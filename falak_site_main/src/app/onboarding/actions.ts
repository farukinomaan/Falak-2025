"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/actions";
import { getUserByPhone, updateUser } from "@/lib/actions";
import { UserCreateSchema } from "@/lib/actions/schemas";
import { getServiceClient } from "@/lib/actions/supabaseClient";

// OTP verification disabled: accept phone as provided (basic length check only)
const OnboardSchema = z
  .object({
    name: z.string().min(2),
    phone: z.string().min(7),
    mahe: z.boolean(),
    regNo: z.string().optional().nullable(),
    institute: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.mahe) {
      const digits = (val.regNo || '').replace(/[^0-9]/g, '');
      const lenOk = digits.length === 9 || digits.length === 12;
      const allowedPrefixes = ['21','22','23','24','25','123','124','125'];
      const startsOk = allowedPrefixes.some(p => digits.startsWith(p));
      if (!lenOk || !startsOk) {
        ctx.addIssue({ code: 'custom', path: ['regNo'], message: 'Invalid registration number, logout message HR if you entered correct' });
      }
    } else {
      if (!val.institute || val.institute.trim().length < 2) {
        ctx.addIssue({ code: 'custom', path: ['institute'], message: 'College name is required for Non-MAHE' });
      }
    }
  });

export type OnboardInput = z.infer<typeof OnboardSchema>;

export async function completeOnboarding(input: OnboardInput) {
  try {
    const parsed = OnboardSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error?.issues?.[0]?.message || "Invalid input";
      return { ok: false, message: first } as const;
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return { ok: false, message: "Not authenticated" } as const;
    }

    // Idempotent create using existing server actions
    const existing = await getUserByEmail(email);
    if (!existing.ok) {
      return { ok: false, message: existing.error || "Lookup error" } as const;
    }

    // Build payload matching UserCreateSchema
    const v = parsed.data;

  // Normalize phone to 10-digit national format (strip +91/leading zeros/non-digits)
  let phone = (v.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  if (phone.length > 10) phone = phone.slice(-10);
  if (phone.length === 11 && phone.startsWith('0')) phone = phone.slice(1);

    const toCreate: z.infer<typeof UserCreateSchema> = {
      name: v.name,
  phone,
      email,
      mahe: v.mahe,
  reg_no: v.mahe ? (v.regNo || "") : null,
      institute: v.mahe ? null : (v.institute || null),
      active: true,
    };

    // If user with this email already exists, short‑circuit success (they are already onboarded)
    if (existing.data) {
      return { ok: true } as const;
    }

    // Enforce phone uniqueness: if phone already belongs to a different user (with ANY email), block onboarding.
    // Only allow linking if existing phone row has NO email (legacy / partial record).
    let phoneLookup = await getUserByPhone(phone);
    if (!phoneLookup.ok) {
      return { ok: false, message: phoneLookup.error || "Lookup error" } as const;
    }
    if (!phoneLookup.data) {
      // Try +91 legacy format
      const legacy = await getUserByPhone("+91" + phone);
      if (!legacy.ok) {
        return { ok: false, message: legacy.error || "Lookup error" } as const;
      }
      if (legacy.data) phoneLookup = legacy;
    }

    if (phoneLookup.data) {
      const existingPhoneUser = phoneLookup.data as { id: string; email?: string | null };
      // If that record already has an email different from this session's email, treat as conflict
      if (existingPhoneUser.email && existingPhoneUser.email !== email) {
        return { ok: false, message: "Phone number already registered with another account" } as const;
      }
      // If no email on the record (legacy stub), attach this email & proceed
      if (!existingPhoneUser.email) {
        const updated = await updateUser({ id: existingPhoneUser.id, email, phone });
        if (!updated.ok) {
          return { ok: false, message: updated.error || "Could not claim existing phone record" } as const;
        }
        return { ok: true } as const;
      }
      // If same email (unlikely since existing.data was null), just allow
      return { ok: true } as const;
    }

    const created = await createUser(toCreate);
    if (!created.ok) {
      return { ok: false, message: created.error || "DB error" } as const;
    }

    return { ok: true } as const;
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Unexpected error" } as const;
  }
}

// Faculty onboarding: writes to faculty_user (name, phone, emp_id, email) and ensures Users row with mahe=true
export async function completeFacultyOnboarding(input: { username: string; phone: string; empId: string }) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return { ok: false as const, message: 'Not authenticated' };

    const username = (input.username || '').trim();
    let phone = (input.phone || '').replace(/[^0-9]/g, '');
    const empId = (input.empId || '').trim();
    if (username.length < 2) return { ok: false as const, message: 'Invalid name' };
    if (phone.length < 7) return { ok: false as const, message: 'Invalid phone' };
    if (!empId) return { ok: false as const, message: 'Employee ID required' };

    // Normalize phone to 10-digit national
    if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
    if (phone.length > 10) phone = phone.slice(-10);
    if (phone.length === 11 && phone.startsWith('0')) phone = phone.slice(1);

    const supabase = getServiceClient();

    // Upsert into faculty_user
    const { error: fErr } = await supabase
      .from('faculty_user')
      .upsert({ name: username, phone, emp_id: empId, email }, { onConflict: 'email' });
    if (fErr) return { ok: false as const, message: fErr.message };

    // Ensure Users row with mahe=true
    // Try to find existing user by email
    const existing = await getUserByEmail(email);
    if (!existing.ok) return { ok: false as const, message: existing.error || 'Lookup error' };
    if (existing.data) {
      // Update to ensure mahe=true and set phone if empty
      const existingUser = existing.data as { id: string };
      const updated = await updateUser({ id: existingUser.id, mahe: true, phone });
      if (!updated.ok) return { ok: false as const, message: updated.error || 'Update failed' };
      return { ok: true as const };
    }
    // No existing -> create
    const toCreate: z.infer<typeof UserCreateSchema> = {
      name: username,
      phone,
      email,
      mahe: true,
      reg_no: null,
      institute: null,
      active: true,
    };
    const created = await createUser(toCreate);
    if (!created.ok) return { ok: false as const, message: created.error || 'DB error' };
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: 'Unexpected error' };
  }
}