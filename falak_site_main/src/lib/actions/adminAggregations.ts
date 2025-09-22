"use server";

import { getServiceClient } from "./supabaseClient";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  EventCreateSchema,
  EventUpdateSchema,
  PassCreateSchema,
  PassUpdateSchema,
  uuid,
} from "./schemas";
import {
  createEvent as _createEvent,
  updateEvent as _updateEvent,
  deleteEvent as _deleteEvent,
  listEvents as _listEvents,
  listAllEventsRaw as _listAllEventsRaw,
} from "./tables/events";
import {
  createPass as _createPass,
  updatePass as _updatePass,
  deletePass as _deletePass,
  listPasses as _listPasses,
  listPassesWithoutEvent as _listPassesWithoutEvent,
  listAllPassesRaw as _listAllPassesRaw,
} from "./tables/pass";
import { createUserPass as _createUserPass } from "./tables/userPasses";
// (Team create/list functions imported on demand elsewhere if needed)

// Wrapper Server Actions for Events
export async function saListEvents() {
  return _listEvents();
}
// Admin: get all events (enabled and disabled)
export async function saListAllEvents() {
  return _listAllEventsRaw();
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
// Admin: get all passes (enabled and disabled)
export async function saListAllPasses() {
  return _listAllPassesRaw();
}
export async function saListProshowPasses() {
  return _listPassesWithoutEvent();
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
  // Use exact counts to avoid the default 1000-row limit on select()
  const [usersRes, teamsRes, userPassesRes] = await Promise.all([
    supabase.from("Users").select("id", { count: 'exact', head: true }),
    supabase.from("Teams").select("id", { count: 'exact', head: true }),
    supabase.from("User_passes").select("id", { count: 'exact', head: true }),
  ]);
  if (usersRes.error) return { ok: false as const, error: usersRes.error.message };
  if (teamsRes.error) return { ok: false as const, error: teamsRes.error.message };
  if (userPassesRes.error) return { ok: false as const, error: userPassesRes.error.message };
  return {
    ok: true as const,
    data: {
      users: usersRes.count ?? 0,
      teams: teamsRes.count ?? 0,
      passesSold: userPassesRes.count ?? 0,
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
  // Use central creator to also generate QR token securely
  const created = await _createUserPass({ userId, passId });
  if (!created.ok) return { ok: false as const, error: created.error || "Failed to assign pass" } as const;
  return { ok: true as const, data: created.data };
}

// ---------------- Pending Payment Log -> Pass Mapping (Ticket Admin) ----------------

interface PendingPaymentRow {
  payment_log_id: string;
  user_id: string | null;
  tracking_id: string | null;
  membership_type: string | null;
  event_name: string | null;
  event_type: string | null;
  created_at: string | null;
  legacy_key: string;
  v2_key: string;
}

// List payment_logs that are Success but have no active mapping (neither legacy nor v2) resolved.
export async function listPendingPaymentLogs(limit = 200) {
  const supabase = getServiceClient();
  const pl = await supabase.from('payment_logs').select('id, user_id, tracking_id, membership_type, event_name, event_type, external_created_at').eq('status','Success').limit(limit * 3);
  if (pl.error) return { ok:false as const, error: pl.error.message };
  const mapRes = await supabase.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  if (mapRes.error) return { ok:false as const, error: mapRes.error.message };
  const mapping = new Set<string>();
  for (const r of (mapRes.data||[]) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (r.external_key) mapping.add((r.external_key as string).toLowerCase());
    if (r.external_key_v2) mapping.add((r.external_key_v2 as string).toLowerCase());
  }
  const pending: PendingPaymentRow[] = [];
  for (const row of (pl.data||[]) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const legacy_key = `${(row.membership_type||'').trim().toLowerCase()}|${(row.event_name||'').trim().toLowerCase()}`;
    const v2_key = `${(row.event_type||'').trim().toLowerCase()}|${(row.event_name||'').trim().toLowerCase()}`;
    if (!mapping.has(v2_key) && !mapping.has(legacy_key)) {
      pending.push({
        payment_log_id: row.id,
        user_id: row.user_id,
        tracking_id: row.tracking_id,
        membership_type: row.membership_type,
        event_name: row.event_name,
        event_type: row.event_type,
        created_at: row.external_created_at,
        legacy_key,
        v2_key,
      });
    }
    if (pending.length >= limit) break;
  }
  return { ok:true as const, data: pending };
}

// Resolve a single pending payment log by creating a mapping + granting pass.
export async function resolvePendingPaymentLog(paymentLogId: string, passId: string) {
  const pidOk = uuid.safeParse(paymentLogId);
  const passOk = uuid.safeParse(passId);
  if (!pidOk.success || !passOk.success) return { ok:false as const, error: 'Invalid ids' };
  const supabase = getServiceClient();
  // Fetch log & pass
  const [logRes, passRes] = await Promise.all([
    supabase.from('payment_logs').select('id, user_id, tracking_id, membership_type, event_name, event_type').eq('id', paymentLogId).maybeSingle(),
    supabase.from('Pass').select('id, pass_name, enable, status').eq('id', passId).maybeSingle(),
  ]);
  if (logRes.error) return { ok:false as const, error: logRes.error.message };
  if (!logRes.data) return { ok:false as const, error: 'payment_log_not_found' };
  if (passRes.error) return { ok:false as const, error: passRes.error.message };
  if (!passRes.data) return { ok:false as const, error: 'pass_not_found' };
  const passEnabled = (passRes.data.enable ?? passRes.data.status) ?? false;
  if (!passEnabled) return { ok:false as const, error: 'pass_disabled' };
  const row = logRes.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const mt = (row.membership_type||'').trim().toLowerCase();
  const en = (row.event_name||'').trim().toLowerCase();
  const et = (row.event_type||'').trim().toLowerCase();
  const legacy_key = `${mt}|${en}`;
  const v2_key = `${et}|${en}`;
  const preferV2 = et.length > 0; // only if event_type present
  // Compose payload (attempt to store both if we have both membership_type & event_type)
  let payload: Record<string, unknown> = { pass_id: passId, active: true };
  if (mt) payload.external_key = legacy_key;
  if (et) payload.external_key_v2 = v2_key;
  // Attempt upsert including both columns
  let upsert = await supabase.from('external_pass_map').upsert(payload, { onConflict: mt ? 'external_key' : (et ? 'external_key_v2' : 'external_key') }).select('id').maybeSingle();
  if (upsert.error && /external_key_v2/i.test(upsert.error.message) && preferV2) {
    // Retry without v2 column if schema missing
    payload = { pass_id: passId, active: true };
    if (mt) payload.external_key = legacy_key;
    upsert = await supabase.from('external_pass_map').upsert(payload, { onConflict: 'external_key' }).select('id').maybeSingle();
  }
  if (upsert.error) return { ok:false as const, error: upsert.error.message };
  // Grant pass ownership if not already
  const already = await supabase.from('User_passes').select('id').eq('userId', row.user_id).eq('passId', passId).maybeSingle();
  if (already.error) return { ok:false as const, error: already.error.message };
  if (!already.data) {
    const created = await _createUserPass({ userId: row.user_id, passId });
    if (!created.ok) return { ok:false as const, error: created.error || 'grant_failed' };
  }
  return { ok:true as const, data: { mapped: true, passGranted: true } };
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

// Admin: update a user's phone (ticket_admin or super_admin)
export async function adminUpdateUserPhone(userId: string, phone: string) {
  // Validate input
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: "Invalid userId" };
  const raw = (phone || "").trim();
  if (!raw) return { ok: false as const, error: "Phone required" };
  // Normalize to digits (keep + at start if present and followed by country code)
  let normalized = raw.replace(/\s+/g, "");
  if (normalized.startsWith("+")) {
    const digitsOnly = normalized.replace(/[^0-9+]/g, "");
    normalized = digitsOnly;
  } else {
    normalized = raw.replace(/[^0-9]/g, "");
  }
  // Basic length check (10-15 digits typical)
  const digitCount = normalized.replace(/\D/g, "").length;
  if (digitCount < 10 || digitCount > 15) return { ok: false as const, error: "Invalid phone length" };

  // Role check via session
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ticket_admin' || role === 'super_admin')) {
    return { ok: false as const, error: "Forbidden" };
  }

  // Update
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Users')
    .update({ phone: normalized })
    .eq('id', userId)
    .select('id, name, email, phone')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'user_not_found' };
  return { ok: true as const, data };
}

// Lightweight helper: list only passIds owned by a user (for quick ownership checks in UI)
export async function saListUserPassIds(userId: string) {
  const idOk = uuid.safeParse(userId);
  if (!idOk.success) return { ok: false as const, error: "Invalid userId" };
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("User_passes").select("passId").eq("userId", userId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: (data as Array<{ passId: string }>).map((r) => r.passId) };
}

// Team utilities for event pages
export async function saGetUserTeamForEvent(userId: string, eventId: string) {
  const supabase = getServiceClient();
  // First attempt: team where user is captain
  const { data: captainTeam, error: capErr } = await supabase
    .from("Teams")
    .select("id, name, eventId, captainId")
    .eq("eventId", eventId)
    .eq("captainId", userId)
    .maybeSingle();
  if (capErr) return { ok: false as const, error: capErr.message };
  if (captainTeam) {
    const { data: members, error: mErr } = await supabase
      .from("Team_members")
      .select("id, memberId")
      .eq("teamId", captainTeam.id);
    if (mErr) return { ok: false as const, error: mErr.message };
    return { ok: true as const, data: { team: captainTeam, members } };
  }
  // Second attempt: membership row referencing userId
  const { data: membershipRows, error: memErr } = await supabase
    .from("Team_members")
    .select("teamId")
    .eq("eventId", eventId)
    .eq("memberId", userId)
    .limit(1);
  if (memErr) return { ok: false as const, error: memErr.message };
  if (!membershipRows || membershipRows.length === 0) return { ok: true as const, data: null };
  const teamId = (membershipRows[0] as { teamId: string }).teamId;
  const { data: team, error: tErr } = await supabase
    .from("Teams")
    .select("id, name, eventId, captainId")
    .eq("id", teamId)
    .maybeSingle();
  if (tErr) return { ok: false as const, error: tErr.message };
  if (!team) return { ok: true as const, data: null };
  const { data: members, error: mErr2 } = await supabase
    .from("Team_members")
    .select("id, memberId")
    .eq("teamId", team.id);
  if (mErr2) return { ok: false as const, error: mErr2.message };
  return { ok: true as const, data: { team, members } };
}

export async function saCreateTeamWithMembers(input: { eventId: string; captainId: string; name: string; memberIds: string[] }) {
  // Basic shape validation (lightweight)
  if (!input.eventId || !input.captainId || !input.name) return { ok: false as const, error: "Missing fields" };
  const supabase = getServiceClient();
  // Fetch event constraints
  const { data: evtRow, error: evtErr } = await supabase.from("Events").select("id, min_team_size, max_team_size").eq("id", input.eventId).maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evtRow) return { ok: false as const, error: "Event not found" };
  const minTeamSize: number | null = (evtRow as { id: string; min_team_size?: number | null }).min_team_size ?? null;
  const maxTeamSize: number | null = (evtRow as { id: string; max_team_size?: number | null }).max_team_size ?? null;
  const minAdditional: number = minTeamSize != null ? Math.max(minTeamSize - 1, 0) : 0; // minimum additional members beyond captain
  const maxAdditional: number | null = maxTeamSize != null ? Math.max(maxTeamSize - 1, 0) : null; // maximum additional members beyond captain
  // Validate member uniqueness & size
  const uniqueMembers = Array.from(new Set(input.memberIds.filter(Boolean)));
  if (uniqueMembers.length !== input.memberIds.filter(Boolean).length) return { ok: false as const, error: "Duplicate member IDs" };
  if (uniqueMembers.length < minAdditional) return { ok: false as const, error: `Team needs at least ${minTeamSize ?? (minAdditional + 1)} member(s) including captain` };
  if (maxAdditional != null && uniqueMembers.length > maxAdditional) return { ok: false as const, error: `Team exceeds max size ${maxTeamSize}` };
  // Ensure user does not already have a team for that event
  const existing = await supabase
    .from("Teams")
    .select("id")
    .eq("eventId", input.eventId)
    .eq("captainId", input.captainId)
    .maybeSingle();
  if (existing.error) return { ok: false as const, error: existing.error.message };
  if (existing.data) return { ok: false as const, error: "Team already exists" };
  // Ensure members are not already in another team for same event (as captain or member)
  if (uniqueMembers.length) {
    const { data: conflictTeams, error: conflictErr } = await supabase
      .from("Teams")
      .select("id, captainId")
      .eq("eventId", input.eventId)
      .in("captainId", uniqueMembers);
    if (conflictErr) return { ok: false as const, error: conflictErr.message };
    if (conflictTeams && conflictTeams.length) return { ok: false as const, error: "One or more users already captain another team for this event" };
    const { data: conflictMembers, error: conflictMembersErr } = await supabase
      .from("Team_members")
      .select("id, memberId")
      .eq("eventId", input.eventId)
      .in("memberId", uniqueMembers);
    if (conflictMembersErr) return { ok: false as const, error: conflictMembersErr.message };
    if (conflictMembers && conflictMembers.length) return { ok: false as const, error: "One or more users already in another team for this event" };
  }

  const { data: team, error: tErr } = await supabase
    .from("Teams")
    .insert({ eventId: input.eventId, captainId: input.captainId, name: input.name })
    .select("id")
    .single();
  if (tErr) return { ok: false as const, error: tErr.message };
  const teamId = team.id as string;
  const membersInsert = uniqueMembers.map((memberId) => ({ teamId, memberId, eventId: input.eventId }));
  if (membersInsert.length) {
    const { error: mErr } = await supabase.from("Team_members").insert(membersInsert);
    if (mErr) return { ok: false as const, error: mErr.message };
  }
  return { ok: true as const, data: { teamId } };
}

// Convenience: create team supplying member emails (all must already be registered users)
export async function saCreateTeamWithMemberEmails(input: { eventId: string; captainId: string; name: string; memberEmails: string[] }) {
  if (!input.eventId || !input.captainId || !input.name) return { ok: false as const, error: "Missing fields" };
  const emails = input.memberEmails.map(e => e.trim().toLowerCase()).filter(Boolean);
  const unique = Array.from(new Set(emails));
  // Disallow captain email among members (retrieve captain email)
  const supabase = getServiceClient();
  // Fetch event constraints
  const { data: evtRow, error: evtErr } = await supabase.from("Events").select("id, min_team_size, max_team_size").eq("id", input.eventId).maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evtRow) return { ok: false as const, error: "Event not found" };
  const minTeamSize: number | null = (evtRow as { id: string; min_team_size?: number | null }).min_team_size ?? null;
  const maxTeamSize: number | null = (evtRow as { id: string; max_team_size?: number | null }).max_team_size ?? null;
  const minAdditional: number = minTeamSize != null ? Math.max(minTeamSize - 1, 0) : 0;
  const maxAdditional: number | null = maxTeamSize != null ? Math.max(maxTeamSize - 1, 0) : null;
  // If no additional emails provided, enforce minimum additional requirement
  if (unique.length === 0 && minAdditional > 0) {
    return { ok: false as const, error: `At least ${minAdditional} additional member email(s) required` };
  }
  const { data: captainUser, error: capErr } = await supabase.from("Users").select("id, email").eq("id", input.captainId).maybeSingle();
  if (capErr) return { ok: false as const, error: capErr.message };
  const captainEmail = (captainUser as { email?: string } | null)?.email?.toLowerCase();
  const filtered = captainEmail ? unique.filter(e => e !== captainEmail) : unique;
  // Enforce minimum additional members after excluding captain email
  if (filtered.length < minAdditional) return { ok: false as const, error: `Team needs at least ${minTeamSize ?? (minAdditional + 1)} member(s) including captain` };
  if (maxAdditional != null && filtered.length > maxAdditional) return { ok: false as const, error: `Team exceeds max size ${maxTeamSize}` };
  // Fetch users by emails
  const { data: userRows, error: uErr } = await supabase.from("Users").select("id, email").in("email", filtered);
  if (uErr) return { ok: false as const, error: uErr.message };
  const foundIds: string[] = [];
  const foundEmails = new Set<string>();
  for (const u of (userRows as Array<{ id: string; email: string }> || [])) {
    foundIds.push(u.id);
    foundEmails.add(u.email.toLowerCase());
  }
  const missing = filtered.filter(e => !foundEmails.has(e));
  if (missing.length) return { ok: false as const, error: `Unregistered emails: ${missing.join(", ")}` };
  // Ensure users not already in a team for event
  if (foundIds.length) {
    const { data: conflictCaptains, error: ccErr } = await supabase
      .from("Teams")
      .select("id, captainId")
      .eq("eventId", input.eventId)
      .in("captainId", foundIds);
    if (ccErr) return { ok: false as const, error: ccErr.message };
    if (conflictCaptains && conflictCaptains.length) return { ok: false as const, error: "One or more users already captain another team for this event" };
    const { data: conflictMembers, error: cmErr } = await supabase
      .from("Team_members")
      .select("id, memberId")
      .eq("eventId", input.eventId)
      .in("memberId", foundIds);
    if (cmErr) return { ok: false as const, error: cmErr.message };
    if (conflictMembers && conflictMembers.length) return { ok: false as const, error: "One or more users already in another team for this event" };
  }
  // Perform creation manually to emulate transaction semantics
  // 1. Re-check existing team for captain
  const { data: existing, error: exErr } = await supabase
    .from("Teams")
    .select("id")
    .eq("eventId", input.eventId)
    .eq("captainId", input.captainId)
    .maybeSingle();
  if (exErr) return { ok: false as const, error: exErr.message };
  if (existing) return { ok: false as const, error: "Team already exists" };
  // 2. Create team
  const { data: team, error: tErr } = await supabase
    .from("Teams")
    .insert({ eventId: input.eventId, captainId: input.captainId, name: input.name })
    .select("id")
    .single();
  if (tErr) return { ok: false as const, error: tErr.message };
  const teamId = (team as { id: string }).id;
  // 3. Insert members
  if (foundIds.length) {
    const { error: mErr } = await supabase.from("Team_members").insert(foundIds.map(id => ({ teamId, memberId: id, eventId: input.eventId })));
    if (mErr) {
      // rollback team
      await supabase.from("Teams").delete().eq("id", teamId);
      return { ok: false as const, error: mErr.message };
    }
  }
  return { ok: true as const, data: { teamId } };
}

// List event IDs where user participates (captain or member)
export async function saListUserTeamEventIds(userId: string) {
  const supabase = getServiceClient();
  const [captainRes, memberRes] = await Promise.all([
    supabase.from("Teams").select("eventId").eq("captainId", userId),
    supabase.from("Team_members").select("eventId").eq("memberId", userId),
  ]);
  if (captainRes.error) return { ok: false as const, error: captainRes.error.message };
  if (memberRes.error) return { ok: false as const, error: memberRes.error.message };
  const ids = new Set<string>();
  for (const r of (captainRes.data as Array<{ eventId: string }> || [])) ids.add(r.eventId);
  for (const r of (memberRes.data as Array<{ eventId: string }> || [])) ids.add(r.eventId);
  return { ok: true as const, data: Array.from(ids) };
}

// Ticket admin: list unresolved tickets
export async function listUnresolvedTickets(limit = 200) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("Tickets")
    .select("id, userId, category, issue, created_at, solved, status")
    .eq("solved", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false as const, error: error.message };
  // Augment tickets with reporter name/email by batching a Users lookup
  const tickets = (data || []) as Array<{ id: string; userId?: string | null; category?: string | null; issue?: string | null; created_at?: string | null; solved?: boolean | null; status?: string | null }>;
  const userIds = Array.from(new Set(tickets.map((t) => t.userId).filter(Boolean))) as string[];
  if (userIds.length === 0) return { ok: true as const, data: tickets };
  const { data: usersData, error: usersError } = await supabase.from("Users").select("id, name, email").in("id", userIds);
  if (usersError) return { ok: false as const, error: usersError.message };
  type UserRow = { id: string; name?: string | null; email?: string };
  const userById = new Map<string, UserRow>();
  for (const u of (usersData || []) as UserRow[]) {
    if (u && u.id) userById.set(u.id, u);
  }
  const augmented = tickets.map((t) => ({
    ...t,
    reporter_name: userById.get(t.userId || "")?.name ?? null,
    reporter_email: userById.get(t.userId || "")?.email ?? null,
  }));
  return { ok: true as const, data: augmented };
}

// Ticket Admin: request approval for pass assignment by super admin
export async function requestTicketApproval(ticketId: string) {
  const tOk = uuid.safeParse(ticketId);
  if (!tOk.success) return { ok: false as const, error: "Invalid id" };
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as unknown as { user?: { email?: string } } | null;
  const email = session?.user?.email;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const supabase = getServiceClient();
  const status = `Approval_pending,raised by ${email}`;
  const { data, error } = await supabase.from("Tickets").update({ status }).eq("id", ticketId).select("*").maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

// Super Admin: list tickets awaiting approval
export async function listApprovalPendingTickets(limit = 200) {
  const supabase = getServiceClient();
  // Fetch unresolved tickets whose status starts with Approval_pending
  const { data, error } = await supabase
    .from("Tickets")
    .select("id, userId, category, issue, created_at, solved, status")
    .eq("solved", false)
    .ilike("status", "Approval_pending%")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false as const, error: error.message };
  const tickets = (data || []) as Array<{ id: string; userId?: string | null; category?: string | null; issue?: string | null; created_at?: string | null; solved?: boolean | null; status?: string | null }>;
  const userIds = Array.from(new Set(tickets.map((t) => t.userId).filter(Boolean))) as string[];
  let usersData: Array<{ id: string; name: string | null; email: string | null }> = [];
  if (userIds.length) {
    const res = await supabase.from("Users").select("id, name, email").in("id", userIds);
    if (res.error) return { ok: false as const, error: res.error.message };
    usersData = (res.data || []) as Array<{ id: string; name: string | null; email: string | null }>;
  }
  const byId = new Map(usersData.map(u => [u.id, u] as const));
  const rows = tickets.map(t => {
    const reporter = byId.get(t.userId || "");
    const status = (t.status || "").trim();
    // Parse raiser email from formatted string: "Approval_pending,raised by {email}"
    let raised_by: string | null = null;
    const marker = "raised by ";
    const idx = status.toLowerCase().indexOf(marker);
    if (idx >= 0) raised_by = status.slice(idx + marker.length).trim();
    return {
      id: t.id,
      userId: t.userId || null,
      category: t.category || null,
      issue: t.issue || null,
      created_at: t.created_at || null,
      status: t.status || null,
      reporter_name: reporter?.name ?? null,
      reporter_email: reporter?.email ?? null,
      raised_by,
    };
  });
  return { ok: true as const, data: rows };
}

// Super Admin: approve and assign pass, then resolve ticket with combined status message
export async function approveTicketAndAssign(ticketId: string, passId: string) {
  const tOk = uuid.safeParse(ticketId);
  const pOk = uuid.safeParse(passId);
  if (!tOk.success || !pOk.success) return { ok: false as const, error: "Invalid ids" };
  const supabase = getServiceClient();
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as unknown as { user?: { email?: string } } | null;
  const superEmail = session?.user?.email;
  if (!superEmail) return { ok: false as const, error: "Not authenticated" };
  // Load ticket to get userId and original status (to parse ticket_admin email)
  const { data: tRow, error: tErr } = await supabase.from("Tickets").select("id, userId, status").eq("id", ticketId).maybeSingle();
  if (tErr) return { ok: false as const, error: tErr.message };
  if (!tRow) return { ok: false as const, error: "ticket_not_found" };
  const userId = (tRow as { userId?: string | null }).userId;
  if (!userId) return { ok: false as const, error: "ticket_has_no_user" };
  const statusStr = ((tRow as { status?: string | null }).status || "").trim();
  let ticketAdminEmail: string | null = null;
  const marker = "raised by ";
  const idx = statusStr.toLowerCase().indexOf(marker);
  if (idx >= 0) ticketAdminEmail = statusStr.slice(idx + marker.length).trim();
  // Assign the pass to the user (idempotent checks inside)
  const assignRes = await assignPassToUser(userId, passId);
  if (!assignRes.ok) return assignRes;
  // Mark ticket solved with composite status
  const composite = `Transaction transcript verified by ${ticketAdminEmail || "ticket_admin"} and assigned by ${superEmail}`;
  const { data, error } = await supabase.from("Tickets").update({ solved: true, status: composite }).eq("id", ticketId).select("*").maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

// Assign a pass to the ticket's user (grants pass to user). Does not mark the ticket solved.
export async function assignPassToTicket(ticketId: string, passId: string) {
  const tOk = uuid.safeParse(ticketId);
  const pOk = uuid.safeParse(passId);
  if (!tOk.success || !pOk.success) return { ok: false as const, error: "Invalid ids" };
  const supabase = getServiceClient();
  const { data: ticket, error } = await supabase.from("Tickets").select("id, userId").eq("id", ticketId).maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!ticket) return { ok: false as const, error: "ticket_not_found" };
  const userId = (ticket as { userId?: string }).userId;
  if (!userId) return { ok: false as const, error: "ticket_has_no_user" };
  // Reuse existing assign logic which handles pass availability and QR token generation
  const res = await assignPassToUser(userId, passId);
  if (!res.ok) return res;
  return { ok: true as const, data: res.data };
}

// Mark ticket as solved
export async function markTicketSolved(ticketId: string, markTranscriptVerified = false) {
  const tOk = uuid.safeParse(ticketId);
  if (!tOk.success) return { ok: false as const, error: "Invalid id" };
  const supabase = getServiceClient();
  const updatePayload: Record<string, unknown> = { solved: true };
  if (markTranscriptVerified) {
    // Resolve admin email from server session
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as unknown as { user?: { email?: string } } | null;
  const email = session?.user?.email;
    if (!email) return { ok: false as const, error: "Not authenticated" };
    updatePayload.status = `Transaction transcript verified by ${email}`;
  } else {
    // stamp resolved-only message with admin email
    const sessionRaw2 = await getServerSession(authOptions);
    const session2 = sessionRaw2 as unknown as { user?: { email?: string } } | null;
    const email2 = session2?.user?.email;
    if (!email2) return { ok: false as const, error: "Not authenticated" };
    updatePayload.status = `Resolved only by ${email2}`;
  }
  const { data, error } = await supabase.from("Tickets").update(updatePayload).eq("id", ticketId).select("*").maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

// Admin utility: Manual Fetch from payment portal by phone
export async function adminManualFetchPayments(phone: string) {
  const p = (phone || "").trim();
  if (!p) return { ok: false as const, error: "Phone required" };
  const ACCESS_KEY = process.env.ACCESSKEY;
  const ACCESS_TOKEN = process.env.ACCESSTOKEN;
  const PAYMENT_ENDPOINT = process.env.VERIFICATION_URL || 'https://api.manipal.edu/api/v1/falak-single-payment-log';
  if (!ACCESS_KEY || !ACCESS_TOKEN) {
    return { ok: false as const, error: "Missing ACCESSKEY/ACCESSTOKEN in env" };
  }
  // Try raw plus +91 variant for convenience
  const variants: string[] = [p];
  const digits = p.replace(/[^0-9]/g, "");
  if (!p.startsWith("+91") && digits.length === 10) variants.push("+91" + digits);
  let docs: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let lastError: string | null = null;
  for (const v of variants) {
    try {
      const url = `${PAYMENT_ENDPOINT}?mobile=${encodeURIComponent(v)}`;
      const r = await fetch(url, { headers: { accept: 'application/json', accesskey: ACCESS_KEY, accesstoken: ACCESS_TOKEN }, cache: 'no-store' });
      if (!r.ok) { lastError = `remote_status_${r.status}`; continue; }
      const j = await r.json();
      const arr = Array.isArray(j?.data?.docs) ? j.data.docs : [];
      if (arr.length > 0) { docs = arr; break; }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch_failed';
    }
  }
  // Load mapping to show resolution info
  const supabase = getServiceClient();
  const mapRes = await supabase.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  const mapping: Record<string, string | null> = {};
  if (!mapRes.error && Array.isArray(mapRes.data)) {
    for (const r of mapRes.data as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (r.external_key) mapping[r.external_key] = r.pass_id as string | null;
      if (r.external_key_v2) mapping[r.external_key_v2] = r.pass_id as string | null;
    }
  }
  const simplify = (d: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const mt = (d?.membership_type || '').trim().toLowerCase();
    const en = (d?.event_name || '').trim().toLowerCase();
    const et = (d?.event_type || '').trim().toLowerCase();
    const legacyKey = `${mt}|${en}`;
    const v2Key = `${et}|${en}`;
    const resolved = mapping[v2Key] ?? mapping[legacyKey] ?? null;
    // attempt common amount fields
    const total_amount = (d?.total_amount ?? d?.actual_amount ?? null);
    return {
      tracking_id: d?.tracking_id || d?.orderid || null,
      order_status: d?.order_status || null,
      membership_type: d?.membership_type || null,
      event_name: d?.event_name || null,
      event_type: d?.event_type || null,
      created_at: d?.created_at || null,
      total_amount,
      legacyKey,
      v2Key,
      mapped: resolved != null,
      pass_id: resolved,
    };
  };
  const rows = (docs || []).map(simplify);
  if (!rows.length && lastError) return { ok: false as const, error: lastError };
  return { ok: true as const, data: rows };
}
