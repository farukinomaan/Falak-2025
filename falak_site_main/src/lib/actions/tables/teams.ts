"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { TeamCreateSchema, TeamUpdateSchema, uuid } from "../schemas";

const table = "Teams" as const

export type Team = z.infer<typeof TeamUpdateSchema>

export async function createTeam(input: z.infer<typeof TeamCreateSchema>) {
  const parsed = TeamCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getTeamById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listTeams() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("updated_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listTeamsByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: true as const, data: [] as Team[] }
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .in("id", ids)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateTeam(input: z.infer<typeof TeamUpdateSchema>) {
  const parsed = TeamUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Soft delete via active=false when possible
export async function deleteTeam(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update({ active: false }).eq("id", id).select("*").maybeSingle()
  if (!error && data) return { ok: true as const, data }
  const { error: delErr } = await supabase.from(table).delete().eq("id", id)
  if (delErr) return { ok: false as const, error: delErr.message }
  return { ok: true as const }
}
