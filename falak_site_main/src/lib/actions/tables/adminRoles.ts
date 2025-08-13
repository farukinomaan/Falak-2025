"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { AdminRoleCreateSchema, AdminRoleUpdateSchema, uuid } from "../schemas";

const table = "Admin_roles" as const

export type AdminRole = z.infer<typeof AdminRoleUpdateSchema>

export async function createAdminRole(input: z.infer<typeof AdminRoleCreateSchema>) {
  const parsed = AdminRoleCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getAdminRoleById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listAdminRoles() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateAdminRole(input: z.infer<typeof AdminRoleUpdateSchema>) {
  const parsed = AdminRoleUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function deleteAdminRole(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
