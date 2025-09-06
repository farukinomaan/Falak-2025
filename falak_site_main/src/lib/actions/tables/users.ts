"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { UserCreateSchema, UserUpdateSchema, uuid } from "../schemas";

const table = "Users" as const

export type User = z.infer<typeof UserUpdateSchema>

export async function createUser(input: z.infer<typeof UserCreateSchema>) {
  const parsed = UserCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getUserById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getUserByEmail(email: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("email", email).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getUserByPhone(phone: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("phone", phone).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listUsers() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateUser(input: z.infer<typeof UserUpdateSchema>) {
  const parsed = UserUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Soft delete via active=false if present
export async function deleteUser(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update({ active: false }).eq("id", id).select("*").maybeSingle()
  if (!error && data) return { ok: true as const, data }
  const { error: delErr } = await supabase.from(table).delete().eq("id", id)
  if (delErr) return { ok: false as const, error: delErr.message }
  return { ok: true as const }
}
