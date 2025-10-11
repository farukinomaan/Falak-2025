"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { PassCreateSchema, PassUpdateSchema, uuid } from "../schemas";

const table = "Pass" as const

export type Pass = z.infer<typeof PassUpdateSchema>

export async function createPass(input: z.infer<typeof PassCreateSchema>) {
  const parsed = PassCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getPassById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listPasses() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("enable", true)
    .order("edited_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Admin-only: list all passes irrespective of enable
export async function listAllPassesRaw() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("edited_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listPassesWithoutEvent() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .is("event_id", null)
  .eq("status", true)
    .order("edited_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listPassesByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: true as const, data: [] as Pass[] };
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .in("id", ids)
    .eq("enable", true)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updatePass(input: z.infer<typeof PassUpdateSchema>) {
  const parsed = PassUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Soft delete by setting enable=false if present; otherwise fallback
export async function deletePass(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update({ enable: false }).eq("id", id).select("*").maybeSingle()
  if (!error && data) return { ok: true as const, data }
  const { error: delErr } = await supabase.from(table).delete().eq("id", id)
  if (delErr) return { ok: false as const, error: delErr.message }
  return { ok: true as const }
}
