"use server";

import { z } from "zod";
import { getServiceClient } from "../supabaseClient";
import { uuid } from "../schemas";

const table = "User_cart_items" as const;

const CartItemCreateSchema = z.object({
  userId: uuid,
  pass_id: uuid,
});

export type CartItem = z.infer<typeof CartItemCreateSchema> & { id?: string };

export async function addToCart(input: CartItem) {
  const parsed = CartItemCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ userid: parsed.data.userId, pass_id: parsed.data.pass_id })
      .select("*")
      .single();
    if (error) {
      // 23505 = unique_violation (already exists)
      const code = (error as { code?: string } | null)?.code;
      if (code === "23505") return { ok: true as const, data: null };
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return { ok: false as const, error: message };
  }
}

export async function removeFromCart(userId: string, pass_id: string) {
  const u = uuid.safeParse(userId);
  const p = uuid.safeParse(pass_id);
  if (!u.success || !p.success) return { ok: false as const, error: "Invalid ids" };
  try {
    const supabase = getServiceClient();
  const { error } = await supabase.from(table).delete().eq("userid", userId).eq("pass_id", pass_id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return { ok: false as const, error: message };
  }
}

export async function listCart(userId: string) {
  const u = uuid.safeParse(userId);
  if (!u.success) return { ok: false as const, error: "Invalid userId" };
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(table)
      .select("id, pass_id")
      .eq("userid", userId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message };
    // Normalize rows
    type CartRow = { id: string; pass_id: string };
    const rows: CartRow[] = Array.isArray(data) ? (data as CartRow[]) : [];
    const normalized = rows.map((r) => ({ id: String(r.id), pass_id: String(r.pass_id) }));
    return { ok: true as const, data: normalized };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return { ok: false as const, error: message };
  }
}

export async function addManyToCart(userId: string, ids: string[]) {
  const u = uuid.safeParse(userId);
  if (!u.success) return { ok: false as const, error: "Invalid userId" };
  const input = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (input.length === 0) return { ok: true as const, data: { added: 0 } };
  try {
    const supabase = getServiceClient();
    // Query by id
    const { data: byIdData, error: byIdErr } = await supabase
      .from("Pass")
      .select("id, event_id")
      .in("id", input);
    if (byIdErr) return { ok: false as const, error: byIdErr.message };
    // Query by event_id
    const { data: byEventData, error: byEventErr } = await supabase
      .from("Pass")
      .select("id, event_id")
      .in("event_id", input);
    if (byEventErr) return { ok: false as const, error: byEventErr.message };
    const candidates = ([...(byIdData || []), ...(byEventData || [])] as Array<{ id: string; event_id: string | null }>);
    // Map each provided id to a pass id
    const mapped: string[] = [];
    for (const raw of input) {
      const byId = candidates.find((p) => p.id === raw);
      if (byId) { mapped.push(byId.id); continue; }
      const byEvent = candidates.find((p) => p.event_id === raw);
      if (byEvent) { mapped.push(byEvent.id); continue; }
    }
    // De-duplicate
    const unique = Array.from(new Set(mapped));
    let added = 0;
    for (const pid of unique) {
      const res = await addToCart({ userId, pass_id: pid });
      if (res.ok) added += 1;
    }
    return { ok: true as const, data: { added } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return { ok: false as const, error: message };
  }
}

export async function listCartWithPassDetails(userId: string) {
  const base = await listCart(userId);
  if (!base.ok) return base;
  const rows = (base.data || []) as Array<{ id: string; pass_id: string }>;
  const ids = rows.map((r) => r.pass_id).filter(Boolean);
  if (ids.length === 0) return { ok: true as const, data: [] };
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("Pass")
      .select("id, pass_name, description, cost, enable, event_id")
      .in("id", ids);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return { ok: false as const, error: message };
  }
}

export async function validateOwnershipForPass(userId: string, passId: string) {
  const u = uuid.safeParse(userId);
  const p = uuid.safeParse(passId);
  if (!u.success || !p.success) return { ok: false as const, error: "Invalid ids" };
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("User_passes")
    .select("id")
    .eq("userId", userId)
    .eq("passId", passId)
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: Boolean(data) };
}
