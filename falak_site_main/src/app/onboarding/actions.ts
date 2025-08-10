"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const OnboardSchema = z.object({
  name: z.string().min(2),
  regNo: z.string().min(2),
  phone: z.string().min(7),
});

export async function completeOnboarding(input: z.infer<typeof OnboardSchema>) {
  try {
    const parsed = OnboardSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Invalid input" };
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session as any).user.id) {
      return { ok: false, message: "Not authenticated" };
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn("Supabase envs missing, skipping DB persist");
      return { ok: true };
    }
    const supabase = createClient(url, key);
    const payload = {
      auth_user_id: (session as any).user.id as string,
      email: session.user.email as string,
      name: parsed.data.name,
      reg_no: parsed.data.regNo,
      phone: parsed.data.phone,
      provider: "google",
    };

    // Upsert user
    const { error } = await supabase.from("users").upsert(payload, {
      onConflict: "email",
    });
    if (error) {
      console.error("users upsert error", error);
      return { ok: false, message: "DB error" };
    }

    // Mark token flag off on next request by storing a cookie or let jwt recalc on next login
    // Simple approach: rely on middleware refresh on next nav, or force redirect done by client.

    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Unexpected error" };
  }
}