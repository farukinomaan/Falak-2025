"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { RedeemedPassCreateSchema, RedeemedPassUpdateSchema, uuid } from "../schemas";

const table = "redeemed_passes" as const

export type RedeemedPass = z.infer<typeof RedeemedPassUpdateSchema>

export async function createRedeemedPass(input: z.infer<typeof RedeemedPassCreateSchema>) {
  const parsed = RedeemedPassCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getRedeemedPassById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listRedeemedPasses() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateRedeemedPass(input: z.infer<typeof RedeemedPassUpdateSchema>) {
  const parsed = RedeemedPassUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function deleteRedeemedPass(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
