"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { EventCreateSchema, EventUpdateSchema, uuid } from "../schemas";

const table = "Events" as const

export type Event = z.infer<typeof EventUpdateSchema>

export async function createEvent(input: z.infer<typeof EventCreateSchema>) {
  const parsed = EventCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).insert(parsed.data).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function getEventById(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listEvents() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("enable", true)
    .order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Admin-only: list all events irrespective of enable
export async function listAllEventsRaw() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function listEventsByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: true as const, data: [] as Event[] };
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .in("id", ids)
    .eq("enable", true)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

export async function updateEvent(input: z.infer<typeof EventUpdateSchema>) {
  const parsed = EventUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const { id, ...rest } = parsed.data
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(table).update(rest).eq("id", id).select("*").single()
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, data }
}

// Soft delete if possible: Events has `enable` flag
export async function deleteEvent(id: string) {
  const parsed = uuid.safeParse(id)
  if (!parsed.success) return { ok: false as const, error: "Invalid id" }
  const supabase = getServiceClient()
  // Prefer soft delete by disabling
  const { data, error } = await supabase.from(table).update({ enable: false }).eq("id", id).select("*").single()
  if (!error && data) return { ok: true as const, data }
  // Fallback to hard delete if update failed (e.g., column missing)
  const { error: delErr } = await supabase.from(table).delete().eq("id", id)
  if (delErr) return { ok: false as const, error: delErr.message }
  return { ok: true as const }
}
