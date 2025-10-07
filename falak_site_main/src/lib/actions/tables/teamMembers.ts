"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { TeamMemberCreateSchema, TeamMemberUpdateSchema, uuid } from "../schemas";

const table = "Team_members" as const

export type TeamMember = z.infer<typeof TeamMemberUpdateSchema>

export async function createTeamMember(input: z.infer<typeof TeamMemberCreateSchema>) {
  const parsed = TeamMemberCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getTeamMemberById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listTeamMembers() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("updated_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listTeamMembersByMemberId(memberId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("memberId", memberId)
    .order("updated_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateTeamMember(input: z.infer<typeof TeamMemberUpdateSchema>) {
  const parsed = TeamMemberUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function deleteTeamMember(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
