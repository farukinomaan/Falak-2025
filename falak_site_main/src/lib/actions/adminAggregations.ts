"use server";

import { getServiceClient } from "./supabaseClient";
import { z } from "zod";
import {
  EventCreateSchema,
  EventUpdateSchema,
  PassCreateSchema,
  PassUpdateSchema,
  UserPassCreateSchema,
  uuid,
} from "./schemas";
import {
  createEvent as _createEvent,
  updateEvent as _updateEvent,
  deleteEvent as _deleteEvent,
  listEvents as _listEvents,
} from "./tables/events";
import {
  createPass as _createPass,
  updatePass as _updatePass,
  deletePass as _deletePass,
  listPasses as _listPasses,
} from "./tables/pass";

// Wrapper Server Actions for Events
export async function saListEvents() {
  return _listEvents();
}
export async function saCreateEvent(input: z.infer<typeof EventCreateSchema>) {
  return _createEvent(input);
}
export async function saUpdateEvent(input: z.infer<typeof EventUpdateSchema>) {
  return _updateEvent(input);
}
export async function saDeleteEvent(id: string) {
  return _deleteEvent(id);
}

// Wrapper Server Actions for Passes
export async function saListPasses() {
  return _listPasses();
}
export async function saCreatePass(input: z.infer<typeof PassCreateSchema>) {
  return _createPass(input);
}
export async function saUpdatePass(input: z.infer<typeof PassUpdateSchema>) {
  return _updatePass(input);
}
export async function saDeletePass(id: string) {
  return _deletePass(id);
}

// Types for lightweight selections
type IdOnly = { id: string };
interface PassNameRow extends IdOnly { pass_name: string | null }
interface EventNameRow extends IdOnly { name: string }
interface UserBasicRow extends IdOnly { name: string | null; email: string; phone: string }
export interface SearchUserRow extends UserBasicRow { reg_no?: string | null }
interface UserPassRow extends IdOnly { userId: string; passId: string }
interface TeamRow extends IdOnly { eventId: string; name: string; captainId?: string | null }
interface TeamMemberRow extends IdOnly { teamId: string; memberId: string; eventId: string }
interface PassDetailRow extends IdOnly { pass_name: string | null; enable?: boolean | null; status?: boolean | null; quanatity?: number | string | null }
export type UserDetailsData = { user: UserBasicRow; passes: PassDetailRow[]; teams: Array<{ teamId: string; teamName: string; eventId: string; eventName: string; isCaptain: boolean }>; }

// Aggregations for Super Admin
export async function getTotals() {
  const supabase = getServiceClient();
  const [usersRes, teamsRes, userPassesRes] = await Promise.all([
    supabase.from("Users").select("id"),
    supabase.from("Teams").select("id"),
    supabase.from("User_passes").select("id"),
  ]);
  if (usersRes.error) return { ok: false as const, error: usersRes.error.message };
  if (teamsRes.error) return { ok: false as const, error: teamsRes.error.message };
  if (userPassesRes.error) return { ok: false as const, error: userPassesRes.error.message };
  return {
    ok: true as const,
    data: {
      users: (usersRes.data as IdOnly[]).length,
      teams: (teamsRes.data as IdOnly[]).length,
      passesSold: (userPassesRes.data as IdOnly[]).length,
    },
  };
}

export async function getPassSalesByPass() {
  const supabase = getServiceClient();
  const [passes, ups] = await Promise.all([
    supabase.from("Pass").select("id, pass_name"),
    supabase.from("User_passes").select("id, passId"),
  ]);
  if (passes.error) return { ok: false as const, error: passes.error.message };
  if (ups.error) return { ok: false as const, error: ups.error.message };
  const counts = new Map<string, number>();
  for (const row of (ups.data as UserPassRow[])) {
    counts.set(row.passId, (counts.get(row.passId) || 0) + 1);
  }
  const data = ((passes.data as PassNameRow[]) || []).map((p) => ({
    passId: p.id,
    pass_name: p.pass_name ?? "Unnamed",
    count: counts.get(p.id) || 0,
  }));
  return { ok: true as const, data };
}

export async function getTeamsPerEvent() {
  const supabase = getServiceClient();
  const [events, teams] = await Promise.all([
    supabase.from("Events").select("id, name"),
    supabase.from("Teams").select("id, eventId"),
  ]);
  if (events.error) return { ok: false as const, error: events.error.message };
  if (teams.error) return { ok: false as const, error: teams.error.message };
  const counts = new Map<string, number>();
  for (const t of (teams.data as TeamRow[])) {
    counts.set(t.eventId, (counts.get(t.eventId) || 0) + 1);
  }
  const data = ((events.data as EventNameRow[]) || []).map((e) => ({
    eventId: e.id,
    event_name: e.name,
    count: counts.get(e.id) || 0,
  }));
  return { ok: true as const, data };
}

export async function listUsersWithPurchasedPasses() {
  const supabase = getServiceClient();
  const [users, ups, passes] = await Promise.all([
    supabase.from("Users").select("id, name, email, phone"),
    supabase.from("User_passes").select("id, userId, passId"),
    supabase.from("Pass").select("id, pass_name"),
  ]);
  if (users.error) return { ok: false as const, error: users.error.message };
  if (ups.error) return { ok: false as const, error: ups.error.message };
  if (passes.error) return { ok: false as const, error: passes.error.message };

  const passById = new Map<string, string>();
  for (const p of (passes.data as PassNameRow[])) passById.set(p.id, p.pass_name ?? "Unnamed");

  const passesByUser = new Map<string, string[]>();
  for (const up of (ups.data as UserPassRow[])) {
    const arr = passesByUser.get(up.userId) || [];
    const name = passById.get(up.passId);
    if (name) arr.push(name);
    passesByUser.set(up.userId, arr);
  }

  const data = (users.data as UserBasicRow[])
    .filter((u) => (passesByUser.get(u.id) || []).length > 0)
    .map((u) => ({
      id: u.id,
      name: u.name ?? "Unnamed",
      email: u.email,
      phone: u.phone,
      passes: passesByUser.get(u.id) || [],
    }));

  return { ok: true as const, data };
}

// Ticket Admin helpers
export async function searchUsers(q: string) {
  const supabase = getServiceClient();
  const query = q.trim();
  if (!query) return { ok: true as const, data: [] as SearchUserRow[] };
  const { data, error } = await supabase
    .from("Users")
    .select("id, name, email, phone, reg_no")
    .or(
      `email.ilike.%${query}%,phone.ilike.%${query}%,reg_no.ilike.%${query}%`
    )
    .limit(20);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: (data as unknown as SearchUserRow[]) };
}

export async function getUserDetails(userId: string) {
  const idOk = uuid.safeParse(userId);
  if (!idOk.success) return { ok: false as const, error: "Invalid userId" };
  const supabase = getServiceClient();
  const [userRes, upRes, passRes, tmRes, teamRes, evtRes] = await Promise.all([
    supabase.from("Users").select("id, name, email, phone").eq("id", userId).maybeSingle(),
    supabase.from("User_passes").select("id, userId, passId").eq("userId", userId),
    supabase.from("Pass").select("id, pass_name, enable, status, quanatity"),
    supabase.from("Team_members").select("id, teamId, memberId, eventId").eq("memberId", userId),
    supabase.from("Teams").select("id, name, eventId, captainId"),
    supabase.from("Events").select("id, name"),
  ]);
  if (userRes.error) return { ok: false as const, error: userRes.error.message };
  if (upRes.error) return { ok: false as const, error: upRes.error.message };
  if (passRes.error) return { ok: false as const, error: passRes.error.message };
  if (tmRes.error) return { ok: false as const, error: tmRes.error.message };
  if (teamRes.error) return { ok: false as const, error: teamRes.error.message };
  if (evtRes.error) return { ok: false as const, error: evtRes.error.message };

  const passById = new Map<string, PassDetailRow>();
  for (const p of (passRes.data as PassDetailRow[])) passById.set(p.id, p);
  const teamById = new Map<string, TeamRow>();
  for (const t of (teamRes.data as TeamRow[])) teamById.set(t.id, t);
  const eventById = new Map<string, EventNameRow>();
  for (const e of (evtRes.data as EventNameRow[])) eventById.set(e.id, e);

  const passes = (upRes.data as UserPassRow[])
    .map((row) => passById.get(row.passId))
    .filter(Boolean) as PassDetailRow[];
  const teams = (tmRes.data as TeamMemberRow[])
    .map((m) => {
      const team = teamById.get(m.teamId);
      const event = team ? eventById.get(team.eventId) : undefined;
      return team && event
        ? {
            teamId: team.id,
            teamName: team.name,
            eventId: event.id,
            eventName: event.name,
            isCaptain: team.captainId === userId,
          }
        : undefined;
    })
    .filter(Boolean) as Array<{ teamId: string; teamName: string; eventId: string; eventName: string; isCaptain: boolean }>;

  return { ok: true as const, data: { user: userRes.data as UserBasicRow, passes, teams } as UserDetailsData };
}

export async function assignPassToUser(userId: string, passId: string) {
  const uid = uuid.safeParse(userId);
  const pid = uuid.safeParse(passId);
  if (!uid.success || !pid.success) return { ok: false as const, error: "Invalid ids" };
  const supabase = getServiceClient();
  const [passRes, existingCountRes] = await Promise.all([
    supabase.from("Pass").select("id, enable, status, quanatity").eq("id", passId).maybeSingle(),
    supabase.from("User_passes").select("id").eq("passId", passId),
  ]);
  if (passRes.error) return { ok: false as const, error: passRes.error.message };
  if (!passRes.data) return { ok: false as const, error: "Pass not found" };
  const p = passRes.data as { enable?: boolean | null; status?: boolean | null; quanatity?: number | string | null };
  const enabled = (p.enable ?? p.status) ?? false;
  if (!enabled) return { ok: false as const, error: "Pass is disabled" };
  const maxQty = p.quanatity;
  if (maxQty !== undefined && maxQty !== null) {
    const max = typeof maxQty === "string" ? parseInt(maxQty, 10) : maxQty;
    if (!Number.isNaN(max) && existingCountRes.data && existingCountRes.data.length >= max) {
      return { ok: false as const, error: "Pass sold out" };
    }
  }
  const parsed = UserPassCreateSchema.safeParse({ userId, passId });
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  const { data, error } = await supabase
    .from("User_passes")
    .insert({ userId, passId })
    .select("*")
    .single();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

// Role resolver helper for the page
export async function getRoleForEmail(email: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("Admin_roles")
    .select("role")
    .eq("email", email)
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: (data?.role as string | undefined) };
}
