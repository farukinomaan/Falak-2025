"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { TicketCreateSchema, TicketUpdateSchema, uuid } from "../schemas";

const table = "Tickets" as const

export type Ticket = z.infer<typeof TicketUpdateSchema>

export async function createTicket(input: z.infer<typeof TicketCreateSchema>) {
  const parsed = TicketCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getTicketById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listTickets() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateTicket(input: z.infer<typeof TicketUpdateSchema>) {
  const parsed = TicketUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function deleteTicket(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
