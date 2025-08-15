"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { UserPassCreateSchema, UserPassUpdateSchema, uuid } from "../schemas";
import { generateQrToken, signQrToken } from "@/lib/security";

const table = "User_passes" as const

export type UserPass = z.infer<typeof UserPassUpdateSchema>

export async function createUserPass(input: z.infer<typeof UserPassCreateSchema>) {
  const parsed = UserPassCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  // Generate and sign a QR token per purchase
  const base = generateQrToken()
  const secret = process.env.QR_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
  const signed = signQrToken(base, String(secret))
  const payload = { ...parsed.data, qr_token: signed }
  const { data, error } = await supabase.from(table).insert(payload).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getUserPassById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listUserPasses() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listUserPassesByUserId(userId: string) {
  const parsed = uuid.safeParse(userId)
  if (!parsed.success) return { ok: false as const, error: "Invalid userId" }
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("userId", userId)
    .order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateUserPass(input: z.infer<typeof UserPassUpdateSchema>) {
  const parsed = UserPassUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  type UpdateInput = z.infer<typeof UserPassUpdateSchema>
  const { id, ...restAll } = parsed.data as UpdateInput
  const restSafe = { ...restAll } as Record<string, unknown>
  if ("qr_token" in restSafe) delete restSafe.qr_token
  const supabase = getServiceClient()
  // Never allow client to change qr_token via this path
  const { data, error } = await supabase.from(table).update(restSafe).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function deleteUserPass(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
