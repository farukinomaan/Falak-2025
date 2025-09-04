"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/actions";
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
      if (!val.regNo || val.regNo.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["regNo"], message: "Registration number is required for MAHE" });
      }
    } else {
      if (!val.institute || val.institute.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["institute"], message: "College name is required for Non-MAHE" });
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
    if (existing.data) {
      // Already onboarded
      return { ok: true } as const;
    }

    // Build payload matching UserCreateSchema
    const v = parsed.data;

  const phone = v.phone;

    const toCreate: z.infer<typeof UserCreateSchema> = {
      name: v.name,
  phone,
      email,
      mahe: v.mahe,
      reg_no: v.mahe ? (v.regNo || "") : null,
      institute: v.mahe ? null : (v.institute || null),
      active: true,
    };

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