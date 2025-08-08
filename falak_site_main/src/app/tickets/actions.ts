"use server";

import { type SupportTicketInput, type TicketCategory } from "@/lib/types";
import { SupportTicketSchema } from "@/lib/validation/tickets";

export type SupportTicketResult =
  | { ok: true }
  | { ok: false; message: string; issues?: string[] };

export async function submitSupportTicket(
  formData: FormData
): Promise<SupportTicketResult> {
  try {
    const raw: SupportTicketInput = {
      username: String(formData.get("username") || ""),
      phone: String(formData.get("phone") || ""),
      non_mahe_student: String(formData.get("non_mahe_student") || "false") ===
        "true",
      clg_registration_number: String(
        formData.get("clg_registration_number") || ""
      ),
      category: String(formData.get("category") || "other") as TicketCategory,
      problem: String(formData.get("problem") || ""),
    };

    const parsed = SupportTicketSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Validation failed",
        issues: parsed.error.issues.map((i) => i.message),
      };
    }

    // Try Supabase insert if configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRole) {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(supabaseUrl, serviceRole);
      const { error } = await client.from("support_tickets").insert({
        username: parsed.data.username,
        phone: parsed.data.phone,
        non_mahe_student: parsed.data.non_mahe_student,
        clg_registration_number: parsed.data.clg_registration_number ?? null,
        category: parsed.data.category,
        problem: parsed.data.problem,
      });
      if (error) {
        console.error("Supabase insert error", error);
        return { ok: false, message: "Failed to submit ticket" };
      }
      return { ok: true };
    }

    // Mock success when Supabase not configured
    console.log("[MOCK] support ticket", parsed.data);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Unexpected error" };
  }
}

/*
SQL (for Supabase):
-- create extension if not exists "pgcrypto";
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  username text not null,
  phone text not null,
  non_mahe_student boolean not null default false,
  clg_registration_number text,
  category text not null check (category in ('pro-show-pass not generated','event-pass not generated','other')),
  problem text not null
);
alter table public.support_tickets enable row level security;
-- TODO: RLS policies
*/

