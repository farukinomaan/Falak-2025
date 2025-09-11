"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/actions";
import { getUserByPhone, updateUser } from "@/lib/actions";
import { UserCreateSchema } from "@/lib/actions/schemas";

// Reverted schema: require verified phone directly (Firebase OTP flow)
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
      // Removed strict 9-digit constraint; accept any length numeric (>=1)
      const digits = (val.regNo || '').replace(/[^0-9]/g, '');
      if (digits.length < 1) {
        ctx.addIssue({ code: 'custom', path: ['regNo'], message: 'Registration number is required' });
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
      return { ok: false, message: "Invalid input" } as const;
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

    // If user with this email already exists, return ok
    if (existing.data) {
      return { ok: true } as const;
    }

    // Check if a user already exists with this phone; if so, update that record to have this email if missing
    let byPhone = await getUserByPhone(phone);
    if (!byPhone.ok) {
      return { ok: false, message: byPhone.error || "Lookup error" } as const;
    }
    // Fallback: try matching '+91' prefixed phone to migrate older rows
    if (!byPhone.data) {
      const byPhoneLegacy = await getUserByPhone("+91" + phone);
      if (!byPhoneLegacy.ok) {
        return { ok: false, message: byPhoneLegacy.error || "Lookup error" } as const;
      }
      if (byPhoneLegacy.data) byPhone = byPhoneLegacy;
    }

    if (byPhone.data) {
      // If this phone is already tied to a user, and that user has no email or different email, try to attach email
      const u = byPhone.data as { id: string; email?: string | null };
      if (!u.email || u.email !== email) {
        const updated = await updateUser({ id: u.id, email, phone });
        if (!updated.ok) {
          // Fallback: return ok to avoid blocking flow if phone is already used
          return { ok: true } as const;
        }
      }
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