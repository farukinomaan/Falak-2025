"use server";

import { getServiceClient } from "./supabaseClient";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
//import { ingestAndListUserPasses } from "@/lib/actions/payments";
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
import { ingestAndListUserPasses } from "@/lib/actions/payments";
import { computeDeterministicUserQrToken } from "@/lib/security";
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
export type UserDetailsData = { user: UserBasicRow & { reg_no?: string | null; mahe?: boolean | null }; passes: PassDetailRow[]; teams: Array<{ teamId: string; teamName: string; eventId: string; eventName: string; isCaptain: boolean }>; }

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
  const passesRes = await supabase.from('Pass').select('id, pass_name');
  if (passesRes.error) return { ok:false as const, error: passesRes.error.message };
  const passRows = (passesRes.data as PassNameRow[]) || [];
  const data: Array<{ passId: string; pass_name: string; count: number }> = [];
  for (const p of passRows) {
    const c = await supabase
      .from('User_passes')
      .select('id', { count: 'exact', head: true })
      .eq('passId', p.id);
    if (c.error) return { ok:false as const, error: c.error.message };
    data.push({ passId: p.id, pass_name: p.pass_name ?? 'Unnamed', count: c.count ?? 0 });
  }
  return { ok:true as const, data };
}

export async function getTeamsPerEvent() {
  const supabase = getServiceClient();
  const eventsRes = await supabase.from('Events').select('id, name');
  if (eventsRes.error) return { ok:false as const, error: eventsRes.error.message };
  const data: Array<{ eventId: string; event_name: string; count: number }> = [];
  for (const e of (eventsRes.data as EventNameRow[])) {
    const c = await supabase
      .from('Teams')
      .select('id', { count: 'exact', head: true })
      .eq('eventId', e.id);
    if (c.error) return { ok:false as const, error: c.error.message };
    data.push({ eventId: e.id, event_name: e.name, count: c.count ?? 0 });
  }
  return { ok:true as const, data };
}

export async function listUsersWithPurchasedPasses() {
  const supabase = getServiceClient();
  const [usersRes, passesRes] = await Promise.all([
    supabase.from('Users').select('id, name, email, phone'),
    supabase.from('Pass').select('id, pass_name')
  ]);
  if (usersRes.error) return { ok:false as const, error: usersRes.error.message };
  if (passesRes.error) return { ok:false as const, error: passesRes.error.message };
  const passById = new Map<string, string>();
  for (const p of (passesRes.data as PassNameRow[])) passById.set(p.id, p.pass_name ?? 'Unnamed');
  // Stream all user_passes via paged ranges to bypass 1000 soft cap
  const batchSize = 1000; let from = 0; let to = batchSize - 1; let done = false;
  const userPasses: UserPassRow[] = [];
  while (!done) {
    const page = await supabase.from('User_passes').select('id, userId, passId').range(from, to);
    if (page.error) return { ok:false as const, error: page.error.message };
    userPasses.push(...(page.data as UserPassRow[]));
    if ((page.data || []).length < batchSize) done = true; else { from += batchSize; to += batchSize; if (from > 20000) done = true; }
  }
  const usersArr = (usersRes.data as UserBasicRow[]) || [];
  const grouped: Record<string, { id: string; name: string; email: string; phone: string; passes: string[] }> = {};
  for (const up of userPasses) {
    const user = usersArr.find(u => u.id === up.userId);
    if (!user) continue;
    if (!grouped[user.id]) grouped[user.id] = { id: user.id, name: user.name || '', email: user.email, phone: user.phone, passes: [] };
    grouped[user.id].passes.push(passById.get(up.passId) || up.passId);
  }
  const data = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  return { ok:true as const, data };
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
    supabase.from("Users").select("id, name, email, phone, reg_no, mahe").eq("id", userId).maybeSingle(),
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

  return { ok: true as const, data: { user: userRes.data as UserBasicRow & { reg_no?: string | null; mahe?: boolean | null }, passes, teams } as UserDetailsData };
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
  user_phone?: string | null;
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
  // Include common legacy success variants to avoid missing rows stored historically
  const SUCCESS_STATUSES = ['Success','success','Paid','paid','Completed','completed','successfull','Successfull','successfull payment','Successfull payment','successfull_payment','Successfull_payment'];
  const pl = await supabase
    .from('payment_logs')
    .select('id, user_id, tracking_id, membership_type, event_name, event_type, external_created_at')
    .in('status', SUCCESS_STATUSES)
    .order('external_created_at', { ascending: false, nullsFirst: false })
    .limit(limit * 3);
  if (pl.error) return { ok:false as const, error: pl.error.message };
  // Preload user phones for associated user_ids
  const userIds = Array.from(new Set(((pl.data||[]) as Array<{ user_id: string | null }>).map(r => r.user_id).filter(Boolean))) as string[];
  let phoneByUser: Map<string, string | null> = new Map();
  if (userIds.length) {
    const usersRes = await supabase.from('Users').select('id, phone').in('id', userIds);
    if (!usersRes.error && usersRes.data) {
      phoneByUser = new Map((usersRes.data as Array<{ id: string; phone: string | null }>).map(u => [u.id, u.phone ?? null] as const));
    }
  }
  const mapRes = await supabase.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  if (mapRes.error) return { ok:false as const, error: mapRes.error.message };
  // Build mapping from key -> pass_id (may be null). Only consider a log "mapped" if pass_id is non-null.
  const mapping: Record<string, string | null> = {};
  for (const r of (mapRes.data||[]) as Array<{ external_key?: string | null; external_key_v2?: string | null; pass_id?: string | null }>) {
    const k1 = (r.external_key || '').toLowerCase();
    const k2 = (r.external_key_v2 || '').toLowerCase();
    if (k1) mapping[k1] = r.pass_id ?? null;
    if (k2) mapping[k2] = r.pass_id ?? null;
  }
  const pending: PendingPaymentRow[] = [];
  for (const row of (pl.data||[]) as Array<{ id: string; user_id: string | null; tracking_id: string | null; membership_type: string | null; event_name: string | null; event_type: string | null; external_created_at: string | null }>) {
    const mt = (row.membership_type||'').trim().toLowerCase();
    const en = (row.event_name||'').trim().toLowerCase();
    const et = (row.event_type||'').trim().toLowerCase();
    const legacy_key = `${mt}|${en}`;
    const v2_key = `${et}|${en}`;

    const v2KeyPresent = et.length > 0;
    const v2MappedVal = v2_key && Object.prototype.hasOwnProperty.call(mapping, v2_key) ? mapping[v2_key] : undefined;
    const legacyMappedVal = legacy_key && Object.prototype.hasOwnProperty.call(mapping, legacy_key) ? mapping[legacy_key] : undefined;

    // New rule:
    // - If a v2 key is present: include when v2 is missing in mapping OR mapped to null (even if legacy is mapped)
    // - If no v2 key present: fall back to legacy; include when legacy is missing OR mapped to null
    const includePending = v2KeyPresent
      ? (v2MappedVal == null)
      : (legacyMappedVal == null);

    if (includePending) {
      pending.push({
        payment_log_id: row.id,
        user_id: row.user_id,
        user_phone: row.user_id ? (phoneByUser.get(row.user_id) ?? null) : null,
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
  // Newest first by created_at (string ISO) fallback by tracking
  pending.sort((a, b) => {
    const ta = a.created_at || '';
    const tb = b.created_at || '';
    if (ta && tb) return tb.localeCompare(ta);
    if (ta) return -1;
    if (tb) return 1;
    const xa = a.tracking_id || '';
    const xb = b.tracking_id || '';
    return xb.localeCompare(xa);
  });
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
  // Strategy to avoid overwriting when multiple v2 keys share the same legacy key:
  // - If v2 key present: create or update a row keyed by external_key_v2 ONLY (do not set external_key to avoid unique conflict)
  // - Optionally backfill a legacy row ONLY if it doesn't exist yet
  // - If no v2 key: use legacy as before

  if (preferV2) {
    // 1) Upsert v2-only row
    const v2Payload: Record<string, unknown> = { pass_id: passId, active: true, external_key_v2: v2_key };
    const up1 = await supabase
      .from('external_pass_map')
      .upsert(v2Payload, { onConflict: 'external_key_v2' })
      .select('id')
      .maybeSingle();
    if (up1.error) {
      // Provide a clearer hint when the DB lacks the required unique constraint for ON CONFLICT
      const msg = up1.error.message || '';
      if (/no unique or exclusion constraint matching the on conflict specification/i.test(msg)) {
        return { ok: false as const, error: 'missing_unique_index_external_key_v2' };
      }
      return { ok:false as const, error: up1.error.message };
    }

    // 2) Ensure a single legacy row exists at most once; only create if missing
    if (mt) {
      const legacyExists = await supabase
        .from('external_pass_map')
        .select('id')
        .eq('external_key', legacy_key)
        .limit(1)
        .maybeSingle();
      if (!legacyExists.error && !legacyExists.data) {
        const legacyPayload: Record<string, unknown> = { pass_id: passId, active: true, external_key: legacy_key };
        const up2 = await supabase
          .from('external_pass_map')
          .upsert(legacyPayload, { onConflict: 'external_key' })
          .select('id')
          .maybeSingle();
        if (up2.error) return { ok:false as const, error: up2.error.message };
      }
    }
  } else {
    // No v2 key; legacy-only behavior
    const legacyPayload: Record<string, unknown> = { pass_id: passId, active: true };
    if (mt) legacyPayload.external_key = legacy_key;
    const up = await supabase
      .from('external_pass_map')
      .upsert(legacyPayload, { onConflict: 'external_key' })
      .select('id')
      .maybeSingle();
    if (up.error) return { ok:false as const, error: up.error.message };
  }
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

// OPS ADMIN: list all events (id, name) for dropdown
export async function opsListEvents() {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from('Events').select('id, name').order('name');
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: (data || []) as Array<{ id: string; name: string | null }> };
}

// OPS ADMIN: fetch participant roster + stats for an event
export async function opsEventRoster(eventId: string) {
  const idOk = uuid.safeParse(eventId);
  if (!idOk.success) return { ok: false as const, error: 'Invalid eventId' };
  const supabase = getServiceClient();
  // Load event basic info (date/time/venue & enable). Provided schema (2025-09) has: date, time, venue, enable, min_team_size, max_team_size.
  // Older drafts might have start_time/end_time or enabled. We select only existing guaranteed columns first to avoid fallback wiping fields.
  const baseSelect = 'id, name, date, time, venue, enable, min_team_size, max_team_size';
  const evtRes = await supabase
    .from('Events')
    .select(baseSelect)
    .eq('id', eventId)
    .maybeSingle();
  if (evtRes.error) return { ok: false as const, error: evtRes.error.message };
  if (!evtRes.data) return { ok: false as const, error: 'event_not_found' };
  // Normalise to unified event object exposed to client (use 'enabled' property internally derived from enable/ enabled )
  const rawEvt = evtRes.data as { id: string; name: string | null; date?: string | null; time?: string | null; venue?: string | null; enable?: boolean | null; enabled?: boolean | null; min_team_size?: number | null; max_team_size?: number | null };
  const evt = {
    id: rawEvt.id,
    name: rawEvt.name,
    // start_time / end_time intentionally omitted (schema uses date+time). Kept for forward compatibility as undefined.
    start_time: undefined as string | null | undefined,
    end_time: undefined as string | null | undefined,
    date: rawEvt.date ?? null,
    time: rawEvt.time ?? null,
    venue: rawEvt.venue ?? null,
    enabled: (rawEvt.enable ?? rawEvt.enabled) ?? null,
    min_team_size: rawEvt.min_team_size ?? null,
    max_team_size: rawEvt.max_team_size ?? null,
  };

  // Teams (with captain user info)
  const { data: teamsRows, error: teamsErr } = await supabase
    .from('Teams')
    .select('id, name, captainId, Users:captainId(id, name, email, phone, mahe, reg_no, institute)')
    .eq('eventId', eventId);
  if (teamsErr) return { ok: false as const, error: teamsErr.message };
  // Supabase nested select may return Users as array; normalize to single object
  interface RawTeam { id: string; name: string | null; captainId: string; Users?: unknown }
  interface RawUser { id: string; name?: string | null; email?: string | null; phone?: string | null; mahe?: boolean | null; reg_no?: string | null; institute?: string | null }
  const teams = (teamsRows as unknown as RawTeam[] || []).map(tr => {
    const uRaw = (tr as { Users?: any }).Users; // eslint-disable-line @typescript-eslint/no-explicit-any
    const u = Array.isArray(uRaw) ? uRaw[0] : uRaw;
    return {
      id: tr.id,
      name: tr.name,
      captainId: tr.captainId,
      Users: u ? {
        id: (u as RawUser).id,
        name: (u as RawUser).name || null,
        email: (u as RawUser).email || null,
        phone: (u as RawUser).phone || null,
        mahe: (u as RawUser).mahe ?? null,
        reg_no: (u as RawUser).reg_no || null,
        institute: (u as RawUser).institute || null,
      } : null
    };
  }) as Array<{ id: string; name: string | null; captainId: string; Users: { id: string; name?: string | null; email?: string | null; phone?: string | null; mahe?: boolean | null; reg_no?: string | null; institute?: string | null } | null }>;

  // Members
  const { data: memberRows, error: memErr } = await supabase
    .from('Team_members')
    .select('id, teamId, memberId, Users:memberId(id, name, email, phone, mahe, reg_no, institute)')
    .eq('eventId', eventId);
  if (memErr) return { ok: false as const, error: memErr.message };
  interface RawMember { id: string; teamId: string; memberId: string; Users?: unknown }
  const members = (memberRows as unknown as RawMember[] || []).map(mr => {
    const uRaw = (mr as { Users?: any }).Users; // eslint-disable-line @typescript-eslint/no-explicit-any
    const u = Array.isArray(uRaw) ? uRaw[0] : uRaw;
    return {
      id: mr.id,
      teamId: mr.teamId,
      memberId: mr.memberId,
      Users: u ? {
        id: (u as RawUser).id,
        name: (u as RawUser).name || null,
        email: (u as RawUser).email || null,
        phone: (u as RawUser).phone || null,
        mahe: (u as RawUser).mahe ?? null,
        reg_no: (u as RawUser).reg_no || null,
        institute: (u as RawUser).institute || null,
      } : null
    };
  }) as Array<{ id: string; teamId: string; memberId: string; Users: { id: string; name?: string | null; email?: string | null; phone?: string | null; mahe?: boolean | null; reg_no?: string | null; institute?: string | null } | null }>;

  // Build roster rows (captain first in each team)
  interface RosterRow { userId: string; teamId: string; teamName: string | null; captain: boolean; name: string | null; email: string | null; phone: string | null; mahe: boolean; reg_no: string | null; college: string | null }
  const roster: RosterRow[] = [];
  for (const t of teams) {
    const cap = t.Users;
    roster.push({
      userId: cap?.id || t.captainId,
      teamId: t.id,
      teamName: t.name || null,
      captain: true,
      name: cap?.name || null,
      email: cap?.email || null,
      phone: cap?.phone || null,
      mahe: Boolean(cap?.mahe),
      reg_no: cap?.reg_no || null,
      college: cap?.mahe ? 'MAHE BLR' : (cap?.institute || null)
    });
    for (const m of members.filter(m => m.teamId === t.id)) {
      const u = m.Users;
      roster.push({
        userId: u?.id || m.memberId,
        teamId: t.id,
        teamName: t.name || null,
        captain: false,
        name: u?.name || null,
        email: u?.email || null,
        phone: u?.phone || null,
        mahe: Boolean(u?.mahe),
        reg_no: u?.reg_no || null,
        college: u?.mahe ? 'MAHE BLR' : (u?.institute || null)
      });
    }
  }

  // Stats
  const teamCount = teams.length;
  const participantCount = roster.length; // includes captains and members

  // Pass ownership for the event (pass.event_id = eventId)
  const { data: passes, error: pErr } = await supabase
    .from('Pass')
    .select('id')
    .eq('event_id', eventId);
  if (pErr) return { ok: false as const, error: pErr.message };
  const passIds = (passes || []).map(r => (r as { id: string }).id);
  let soldCount = 0;
  if (passIds.length) {
  const { data: up, error: upErr } = await supabase.from('User_passes').select('userId, passId').in('passId', passIds);
    if (upErr) return { ok: false as const, error: upErr.message };
  soldCount = (up || []).length; // raw ownership count (could be > unique users if multiple passes variants)
  }

  // Unique colleges from roster
  const collegeSet = new Set<string>();
  for (const r of roster) { if (r.college) collegeSet.add(r.college); }
  const colleges = Array.from(collegeSet).sort();

  return { ok: true as const, data: { event: evt, roster, stats: { teamCount, participantCount, soldCount, colleges } } };
}

// OPS ADMIN: list users who bought event pass but not on any team
export async function opsPassHoldersWithoutTeam(eventId: string) {
  const idOk = uuid.safeParse(eventId);
  if (!idOk.success) return { ok: false as const, error: 'Invalid eventId' };
  const supabase = getServiceClient();
  const { data: passes, error: pErr } = await supabase.from('Pass').select('id').eq('event_id', eventId);
  if (pErr) return { ok: false as const, error: pErr.message };
  const passIds = (passes || []).map(r => (r as { id: string }).id);
  if (!passIds.length) return { ok: true as const, data: { rows: [], total: 0 } };
  const { data: owners, error: oErr } = await supabase.from('User_passes').select('userId').in('passId', passIds);
  if (oErr) return { ok: false as const, error: oErr.message };
  const userIds = Array.from(new Set((owners || []).map(r => (r as { userId: string }).userId)));
  if (!userIds.length) return { ok: true as const, data: { rows: [], total: 0 } };
  // Exclude any user who is captain or member in Teams/Team_members for this event
  const [capRows, memRows] = await Promise.all([
    supabase.from('Teams').select('captainId').eq('eventId', eventId),
    supabase.from('Team_members').select('memberId').eq('eventId', eventId)
  ]);
  if (capRows.error) return { ok: false as const, error: capRows.error.message };
  if (memRows.error) return { ok: false as const, error: memRows.error.message };
  const excluded = new Set<string>();
  for (const r of (capRows.data || []) as Array<{ captainId: string }>) excluded.add(r.captainId);
  for (const r of (memRows.data || []) as Array<{ memberId: string }>) excluded.add(r.memberId);
  const remaining = userIds.filter(id => !excluded.has(id));
  if (!remaining.length) return { ok: true as const, data: { rows: [], total: 0 } };
  const { data: userRows, error: uErr } = await supabase
    .from('Users')
    .select('id, name, email, phone, mahe, reg_no, institute')
    .in('id', remaining);
  if (uErr) return { ok: false as const, error: uErr.message };
  interface BasicUser { id: string; name?: string | null; email?: string | null; phone?: string | null; mahe?: boolean | null; reg_no?: string | null; institute?: string | null }
  const rows = (userRows || []).map(u => {
    const bu = u as BasicUser;
    return {
      userId: bu.id,
      name: bu.name || null,
      email: bu.email || null,
      phone: bu.phone || null,
      mahe: Boolean(bu.mahe),
      reg_no: bu.reg_no || null,
      college: bu.mahe ? 'MAHE BLR' : (bu.institute || null)
    };
  });
  return { ok: true as const, data: { rows, total: rows.length } };
}

// OPS ADMIN: deactivate (disable) event
export async function opsDeactivateEvent(eventId: string) {
  const idOk = uuid.safeParse(eventId);
  if (!idOk.success) return { ok: false as const, error: 'Invalid eventId' };
  const supabase = getServiceClient();
  // Update correct column name 'enable'. Some legacy code referenced 'enabled'.
  const { data, error } = await supabase
    .from('Events')
    .update({ enable: false })
    .eq('id', eventId)
    .select('id, enable')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'event_not_found' };
  return { ok: true as const, data: { id: (data as { id: string }).id, enabled: (data as { enable?: boolean | null }).enable ?? false } };
}

// OPS ADMIN: activate (enable) event
export async function opsActivateEvent(eventId: string) {
  const idOk = uuid.safeParse(eventId);
  if (!idOk.success) return { ok: false as const, error: 'Invalid eventId' };
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Events')
    .update({ enable: true })
    .eq('id', eventId)
    .select('id, enable')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'event_not_found' };
  return { ok: true as const, data: { id: (data as { id: string }).id, enabled: (data as { enable?: boolean | null }).enable ?? true } };
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


// Admin: update a user's registration number (ticket_admin or super_admin)
export async function adminUpdateUserRegNo(userId: string, regNo: string) {
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: "Invalid userId" };
  const reg = (regNo || "").trim();
  if (!reg) return { ok: false as const, error: "reg_no required" };
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ticket_admin' || role === 'super_admin')) {
    return { ok: false as const, error: "Forbidden" };
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Users')
    .update({ reg_no: reg })
    .eq('id', userId)
    .select('id, name, email, phone, reg_no, mahe')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'user_not_found' };
  return { ok: true as const, data };
}

// Admin: update a user's MAHE boolean (ticket_admin or super_admin)
export async function adminUpdateUserMahe(userId: string, mahe: boolean) {
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: "Invalid userId" };
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ticket_admin' || role === 'super_admin')) {
    return { ok: false as const, error: "Forbidden" };
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Users')
    .update({ mahe })
    .eq('id', userId)
    .select('id, name, email, phone, reg_no, mahe')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'user_not_found' };
  return { ok: true as const, data };
}

// OPS ADMIN: update only reg_no (restricted field set)
export async function opsUpdateUserRegNo(userId: string, regNo: string) {
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: 'Invalid userId' };
  const reg = (regNo || '').trim();
  if (!reg) return { ok: false as const, error: 'reg_no required' };
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: 'Not authenticated' };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ops_admin' || role === 'super_admin')) return { ok: false as const, error: 'Forbidden' };
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Users')
    .update({ reg_no: reg })
    .eq('id', userId)
    .select('id, reg_no')
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: 'user_not_found' };
  return { ok: true as const, data };
}

// Admin: trigger ingestion for a user (ticket_admin or super_admin)
export async function adminIngestPaymentsForUser(userId: string) {
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: "Invalid userId" };
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ticket_admin' || role === 'super_admin')) {
    return { ok: false as const, error: "Forbidden" };
  }

  // Call ingestion and return minimal status
  const res = await ingestAndListUserPasses({ forceUserId: userId });
  if (!res.ok) return { ok: false as const, error: res.error || 'ingestion_failed' };
  return { ok: true as const, data: { synced: true } };

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
  const { data: evtRow, error: evtErr } = await supabase
    .from("Events")
    .select("id, min_team_size, max_team_size, enable")
    .eq("id", input.eventId)
    .maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evtRow) return { ok: false as const, error: "Event not found" };
  // Registration gating by event enable flag
  if (((evtRow as { enable?: boolean | null }).enable) !== true) {
    return { ok: false as const, error: "Registration closed for this event" };
  }
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
  // Fetch event constraints (also sub_cluster for esports exclusion)
  const { data: evtRow, error: evtErr } = await supabase
    .from("Events")
    .select("id, sub_cluster, cluster_name, min_team_size, max_team_size, enable")
    .eq("id", input.eventId)
    .maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evtRow) return { ok: false as const, error: "Event not found" };
  // Registration gating by event enable flag
  if (((evtRow as { enable?: boolean | null }).enable) !== true) {
    return { ok: false as const, error: "Registration closed for this event" };
  }
  const minTeamSize: number | null = (evtRow as { id: string; min_team_size?: number | null }).min_team_size ?? null;
  const maxTeamSize: number | null = (evtRow as { id: string; max_team_size?: number | null }).max_team_size ?? null;
  const minAdditional: number = minTeamSize != null ? Math.max(minTeamSize - 1, 0) : 0;
  const maxAdditional: number | null = maxTeamSize != null ? Math.max(maxTeamSize - 1, 0) : null;
  // If no additional emails provided, enforce minimum additional requirement
  if (unique.length === 0 && minAdditional > 0) {
    return { ok: false as const, error: `At least ${minAdditional} additional member email(s) required` };
  }
  const { data: captainUser, error: capErr } = await supabase.from("Users").select("id, email, mahe").eq("id", input.captainId).maybeSingle();
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

  // Additional validation: For non-esports events, if captain is a MAHE user, ensure every member owns the "MAHE BLR" pass
  try {
  const isEsports = ((evtRow as { sub_cluster?: string | null })?.sub_cluster || '').toLowerCase() === 'esports';
  const isCultural = ((evtRow as { cluster_name?: string | null })?.cluster_name || '').toLowerCase() === 'cultural';
    const captainIsMahe = Boolean((captainUser as { mahe?: boolean | null } | null)?.mahe);
  // Pass requirement applies only to non-esports, non-cultural clusters for MAHE captain
  if (!isEsports && !isCultural && captainIsMahe && foundIds.length) {
      // Resolve pass ids that match MAHE BLR naming (allow prefixes like "MAHE BLR" or exact match)
      const { data: mahePassRows, error: mahePassErr } = await supabase
        .from('Pass')
        .select('id, pass_name')
        .ilike('pass_name', 'MAHE BLR%');
      if (mahePassErr) return { ok: false as const, error: mahePassErr.message };
      const mahePassIds = (mahePassRows || []).map(r => (r as { id: string }).id);
      if (mahePassIds.length === 0) {
        return { ok: false as const, error: 'MAHE BLR pass not configured' };
      }
      // Fetch user_passes for these users and passes
      const { data: upRows, error: upErr } = await supabase
        .from('User_passes')
        .select('userId, passId')
        .in('userId', foundIds)
        .in('passId', mahePassIds);
      if (upErr) return { ok: false as const, error: upErr.message };
      const ownedSet = new Set<string>((upRows || []).map(r => (r as { userId: string }).userId));
      const idToEmail = new Map<string, string>();
      for (const u of (userRows as Array<{ id: string; email: string }>) || []) {
        idToEmail.set(u.id, u.email.toLowerCase());
      }
      const missingIds = foundIds.filter(id => !ownedSet.has(id));
      if (missingIds.length) {
        const missingEmails = missingIds.map(id => idToEmail.get(id) || id).join(', ');
        return { ok: false as const, error: `Members missing MAHE BLR pass: ${missingEmails}` };
      }
    }
  } catch (e) {
    // Non-fatal; surface as error to client for clarity
    const msg = e instanceof Error ? e.message : 'validation_failed';
    return { ok: false as const, error: `Pass validation error: ${msg}` };
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

// Update existing team (captain only) with new name & member emails (excluding captain)
export async function saUpdateTeamWithMemberEmails(input: { teamId: string; eventId: string; captainId: string; name: string; memberEmails: string[] }) {
  const { teamId, eventId, captainId } = input;
  if (!teamId || !eventId || !captainId || !input.name) return { ok: false as const, error: "Missing fields" };
  const supabase = getServiceClient();
  // Fetch team & verify captain
  const { data: teamRow, error: tErr } = await supabase.from('Teams').select('id, name, captainId, eventId').eq('id', teamId).maybeSingle();
  if (tErr) return { ok: false as const, error: tErr.message };
  if (!teamRow) return { ok: false as const, error: 'team_not_found' };
  if ((teamRow as { captainId?: string }).captainId !== captainId) return { ok: false as const, error: 'forbidden_not_captain' };
  if ((teamRow as { eventId: string }).eventId !== eventId) return { ok: false as const, error: 'event_mismatch' };
  // Fetch event constraints
  const { data: evtRow, error: evtErr } = await supabase
    .from('Events')
    .select('id, min_team_size, max_team_size, enable')
    .eq('id', eventId)
    .maybeSingle();
  if (evtErr) return { ok: false as const, error: evtErr.message };
  if (!evtRow) return { ok: false as const, error: 'event_not_found' };
  // Registration gating by event enable flag
  if (((evtRow as { enable?: boolean | null }).enable) !== true) {
    return { ok: false as const, error: 'Registration closed for this event' };
  }
  const minTeamSize: number | null = (evtRow as { min_team_size?: number | null }).min_team_size ?? null;
  const maxTeamSize: number | null = (evtRow as { max_team_size?: number | null }).max_team_size ?? null;
  const rawEmails = (input.memberEmails || []).map(e => (e||'').trim().toLowerCase()).filter(Boolean);
  const uniqueEmails = Array.from(new Set(rawEmails));
  // Get captain email (exclude if present)
  const { data: captainUser, error: capErr } = await supabase.from('Users').select('id, email').eq('id', captainId).maybeSingle();
  if (capErr) return { ok: false as const, error: capErr.message };
  const captainEmail = (captainUser as { email?: string | null } | null)?.email?.toLowerCase();
  const filteredEmails = captainEmail ? uniqueEmails.filter(e => e !== captainEmail) : uniqueEmails;
  // Size constraints apply to total team size including captain => additional members = size -1
  const minAdditional = minTeamSize != null ? Math.max(minTeamSize - 1, 0) : 0;
  const maxAdditional = maxTeamSize != null ? Math.max(maxTeamSize - 1, 0) : null;
  if (filteredEmails.length < minAdditional) return { ok: false as const, error: `Team needs at least ${minTeamSize ?? (minAdditional + 1)} member(s) including captain` };
  if (maxAdditional != null && filteredEmails.length > maxAdditional) return { ok: false as const, error: `Team exceeds max size ${maxTeamSize}` };
  // Resolve users by email
  const { data: userRows, error: uErr } = await supabase.from('Users').select('id, email').in('email', filteredEmails);
  if (uErr) return { ok: false as const, error: uErr.message };
  const idByEmail = new Map<string, string>();
  for (const u of (userRows as Array<{ id: string; email: string }> || [])) idByEmail.set(u.email.toLowerCase(), u.id);
  const missing = filteredEmails.filter(e => !idByEmail.has(e));
  if (missing.length) return { ok: false as const, error: `Unregistered emails: ${missing.join(', ')}` };
  const newMemberIds = filteredEmails.map(e => idByEmail.get(e)!).filter(Boolean);
  // Fetch existing members
  const { data: existingMembersRows, error: emErr } = await supabase.from('Team_members').select('memberId').eq('teamId', teamId);
  if (emErr) return { ok: false as const, error: emErr.message };
  const existingMemberIds = new Set(((existingMembersRows as Array<{ memberId: string }> )|| []).map(r => r.memberId));
  // Determine adds/removals
  const toAdd = newMemberIds.filter(id => !existingMemberIds.has(id));
  const newMemberSet = new Set(newMemberIds);
  const toRemove = Array.from(existingMemberIds).filter(id => !newMemberSet.has(id));
  // Validate no conflicts for additions (members already captain or member in SAME event on ANOTHER team)
  if (toAdd.length) {
    const { data: conflictCaptains, error: ccErr } = await supabase.from('Teams').select('id, captainId').eq('eventId', eventId).in('captainId', toAdd);
    if (ccErr) return { ok: false as const, error: ccErr.message };
    if (conflictCaptains && conflictCaptains.length) return { ok: false as const, error: 'One or more users already captain another team for this event' };
    const { data: conflictMembers, error: cmErr } = await supabase.from('Team_members').select('id, memberId, teamId').eq('eventId', eventId).in('memberId', toAdd);
    if (cmErr) return { ok: false as const, error: cmErr.message };
    if (conflictMembers && conflictMembers.length) return { ok: false as const, error: 'One or more users already in another team for this event' };
  }
  // Apply updates (best-effort sequential). We allow partial failure rollbacks minimal.
  if (toRemove.length) {
    const { error: delErr } = await supabase.from('Team_members').delete().eq('teamId', teamId).in('memberId', toRemove);
    if (delErr) return { ok: false as const, error: delErr.message };
  }
  if (toAdd.length) {
    const rows = toAdd.map(memberId => ({ teamId, memberId, eventId }));
    const { error: addErr } = await supabase.from('Team_members').insert(rows);
    if (addErr) return { ok: false as const, error: addErr.message };
  }
  // Update name if changed
  const newName = input.name.trim();
  if (newName && newName !== (teamRow as { name?: string | null }).name) {
    const { error: nameErr } = await supabase.from('Teams').update({ name: newName }).eq('id', teamId);
    if (nameErr) return { ok: false as const, error: nameErr.message };
  }
  return { ok: true as const, data: { updated: true, added: toAdd.length, removed: toRemove.length } };
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
  const { data: usersData, error: usersError } = await supabase.from("Users").select("id, name, email, phone").in("id", userIds);
  if (usersError) return { ok: false as const, error: usersError.message };
  type UserRow = { id: string; name?: string | null; email?: string | null; phone?: string | null };
  const userById = new Map<string, UserRow>();
  for (const u of (usersData || []) as UserRow[]) {
    if (u && u.id) userById.set(u.id, u);
  }
  // Parse requested passId from status string and later attach pass name
  const parseRequestedPassId = (status: string | null | undefined) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (!s.startsWith('approval_pending')) return null;
    const m = status.match(/passid=([0-9a-f\-]{36})/i);
    return m ? m[1] : null;
  };
  const augmented = tickets.map((t) => {
    const u = userById.get(t.userId || "");
    const requested_pass_id = parseRequestedPassId(t.status);
    return {
      ...t,
      reporter_name: u?.name ?? null,
      reporter_email: u?.email ?? null,
      reporter_phone: u?.phone ?? null,
      requested_pass_id,
    };
  });
  // Attach pass names for requested_pass_id where present
  const passIds = Array.from(new Set(augmented.map(a => a.requested_pass_id).filter(Boolean))) as string[];
  if (passIds.length) {
    const { data: passRows, error: pErr } = await supabase.from('Pass').select('id, pass_name').in('id', passIds);
    if (!pErr && passRows) {
      const nameById = new Map<string, string>();
      for (const r of passRows as Array<{ id: string; pass_name: string | null }>) {
        nameById.set(r.id, r.pass_name || r.id);
      }
      for (const row of augmented) {
        if (row.requested_pass_id) {
          (row as any).requested_pass_name = nameById.get(row.requested_pass_id) || row.requested_pass_id; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
    }
  }
  return { ok: true as const, data: augmented };
}

// Ticket Admin: request approval for pass assignment by super admin
export async function requestTicketApproval(ticketId: string, passId?: string) {
  const tOk = uuid.safeParse(ticketId);
  if (!tOk.success) return { ok: false as const, error: "Invalid id" };
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as unknown as { user?: { email?: string } } | null;
  const email = session?.user?.email;
  if (!email) return { ok: false as const, error: "Not authenticated" };
  const supabase = getServiceClient();
  const status = `Approval_pending${passId ? `(passId=${passId})` : ''},raised by ${email}`;
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
    // Extract requested passId if present
    let requested_pass_id: string | null = null;
    const m = status.match(/passid=([0-9a-f\-]{36})/i);
    if (m) requested_pass_id = m[1];
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
      requested_pass_id,
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

// ---------------- Maintenance: Rewrite all QR tokens to userId-based format ----------------
// Rationale: External scanner now uses userId encoded in QR to fetch passes via /api/qr/ticket.
// Strategy: For every row in User_passes, set qr_token = `UID:${userId}` or a signed variant if QR_SIGNING_SECRET is present.
// Idempotent: Running multiple times leaves same result.
export async function maintenanceRewriteQrTokens({ dryRun = false, batchSize = 1000 }: { dryRun?: boolean; batchSize?: number } = {}) {
  const supabase = getServiceClient();
  // Fetch total count
  const { count: totalCount, error: countErr } = await supabase.from('User_passes').select('id', { count: 'exact', head: true });
  if (countErr) return { ok: false as const, error: countErr.message };
  let offset = 0; let processed = 0; const toUpdate: Array<{ id: string; userId: string; newToken: string }> = [];
  while (true) {
  const { data, error } = await supabase.from('User_passes').select('id, userId, passId, qr_token').range(offset, offset + batchSize - 1);
    if (error) return { ok: false as const, error: error.message };
  const rows = (data as Array<{ id: string; userId: string; passId?: string | null; qr_token?: string | null }> ) || [];
    if (!rows.length) break;
    for (const r of rows) {
      if (!r.userId) continue; // skip corrupt row
      const finalToken = computeDeterministicUserQrToken(r.userId);
      if (r.qr_token === finalToken) continue; // unchanged
      toUpdate.push({ id: r.id, userId: r.userId, newToken: finalToken });
    }
    processed += rows.length;
    offset += batchSize;
    if (rows.length < batchSize) break;
    if (offset > 50000) break; // safety cap
  }
  if (dryRun) {
    return { ok: true as const, data: { dryRun: true, total: totalCount ?? processed, wouldChange: toUpdate.length } };
  }
  // Perform updates in chunks to avoid large single payload
  const chunkSize = 500;
  let applied = 0; const failures: Array<{ id: string; error: string }> = [];
  for (let i=0;i<toUpdate.length;i+=chunkSize) {
    const slice = toUpdate.slice(i, i+chunkSize);
    const payload = slice.map(r => ({ id: r.id, qr_token: r.newToken }));
    const { error } = await supabase.from('User_passes').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback: try row-by-row to gather granular errors
      for (const r of slice) {
        const single = [{ id: r.id, qr_token: r.newToken }];
        const { error: rowErr } = await supabase.from('User_passes').upsert(single, { onConflict: 'id' });
        if (rowErr) failures.push({ id: r.id, error: rowErr.message }); else applied += 1;
      }
    } else {
      applied += slice.length;
    }
  }
  return { ok: true as const, data: { dryRun: false, total: totalCount ?? processed, changed: applied, failed: failures } };
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
  // For each variant phone, attempt paginated retrieval. Stop at first variant that yields any docs.
  for (const v of variants) {
    try {
      let page = 1;
      const collected: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      // Safety cap to avoid infinite loops if remote API misbehaves
      const MAX_PAGES = 20;
      for (;;) {
        const url = `${PAYMENT_ENDPOINT}?mobile=${encodeURIComponent(v)}&page=${page}`;
        const r = await fetch(url, { headers: { accept: 'application/json', accesskey: ACCESS_KEY, accesstoken: ACCESS_TOKEN }, cache: 'no-store' });
        if (!r.ok) { lastError = `remote_status_${r.status}`; break; }
        const j = await r.json();
        const arr = Array.isArray(j?.data?.docs) ? j.data.docs : [];
        if (arr.length) collected.push(...arr);
        const hasNext = Boolean(j?.data?.hasNextPage);
        if (!hasNext) break;
        page += 1;
        if (page > MAX_PAGES) { lastError = 'pagination_overflow'; break; }
      }
      if (collected.length > 0) { docs = collected; break; }
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


// ---------------- Duplicate Pass Purchases (same phone) ----------------

type DuplicateLogRow = {
  payment_log_id: string;
  user_id: string | null;
  phone: string | null;
  tracking_id: string | null;
  membership_type: string | null;
  event_name: string | null;
  event_type: string | null;
  created_at: string | null;
  pass_id: string;
};

function normalizeKeyParts(s?: string | null) {
  return (s || "").trim().toLowerCase();
}

// List logs for a given user that resolve to a pass already owned by that user (i.e., duplicates) across ALL passes.
// Previous implementation restricted to proshow-like (event_id null) passes; now generalized per request.
export async function listDuplicateProshowLogsForUser(userId: string, limit = 200) { // name kept for backward compatibility
  const uid = uuid.safeParse(userId);
  if (!uid.success) return { ok: false as const, error: "Invalid userId" };
  const supabase = getServiceClient();
  // Fetch successful logs for user (include raw to later check source linkage if needed)
  interface PLRow { id: string; user_id: string | null; phone: string | null; tracking_id: string | null; membership_type: string | null; event_name: string | null; event_type: string | null; external_created_at: string | null }
  const { data: logs, error: logErr } = await supabase
    .from('payment_logs')
    .select('id, user_id, phone, tracking_id, membership_type, event_name, event_type, external_created_at')
    .eq('user_id', userId)
    .eq('status', 'Success')
    .order('external_created_at', { ascending: true });
  if (logErr) return { ok: false as const, error: logErr.message };
  // Load active mapping
  const mapRes = await supabase.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  if (mapRes.error) return { ok: false as const, error: mapRes.error.message };
  const mapping: Record<string, string | null> = {};
  for (const r of (mapRes.data || []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (r.external_key) mapping[(r.external_key as string).toLowerCase()] = r.pass_id as string | null;
    if (r.external_key_v2) mapping[(r.external_key_v2 as string).toLowerCase()] = r.pass_id as string | null;
  }
  // Build list of passIds already owned by the user
  const { data: owned, error: ownedErr } = await supabase
    .from('User_passes')
    .select('passId')
    .eq('userId', userId);
  if (ownedErr) return { ok: false as const, error: ownedErr.message };
  const ownedSet = new Set<string>((owned || []).map((r: any) => r.passId as string)); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!logs || logs.length === 0 || ownedSet.size === 0) return { ok: true as const, data: [] as DuplicateLogRow[] };

  // Resolve passId per log and collect duplicates for ANY pass
  const rows: Array<DuplicateLogRow & { _mt: string; _en: string; _et: string }> = [];

  for (const pl of (logs as PLRow[])) {
    const mt = normalizeKeyParts(pl.membership_type);
    const en = normalizeKeyParts(pl.event_name);
    const et = normalizeKeyParts(pl.event_type);
    const legacyKey = `${mt}|${en}`;
    const v2Key = `${et}|${en}`;
    const passId = (mapping[v2Key] ?? mapping[legacyKey]) || null;
    if (!passId) continue; // unmapped
    if (!ownedSet.has(passId)) continue; // not a duplicate if user doesn't own this pass
    rows.push({
      payment_log_id: pl.id,
      user_id: pl.user_id,
      phone: pl.phone ?? null,
      tracking_id: pl.tracking_id ?? null,
      membership_type: pl.membership_type ?? null,
      event_name: pl.event_name ?? null,
      event_type: pl.event_type ?? null,
      created_at: pl.external_created_at ?? null,
      pass_id: passId,
      _mt: mt, _en: en, _et: et,
    });
    if (rows.length >= limit) break;
  }

  // Attempt to exclude the earliest log per (pass_id) as the primary one that likely granted ownership.
  const byPass = new Map<string, DuplicateLogRow[]>();
  for (const r of rows) {
    const arr = byPass.get(r.pass_id) || [];
    arr.push(r);
    byPass.set(r.pass_id, arr);
  }
  const duplicates: DuplicateLogRow[] = [];
  for (const [, arr] of byPass) {
    // Sort by created_at asc and drop the first one from duplicates list
    const sorted = arr.slice().sort((a, b) => {
      const t1 = a.created_at ? Date.parse(a.created_at) : 0;
      const t2 = b.created_at ? Date.parse(b.created_at) : 0;
      return t1 - t2;
    });
    if (sorted.length <= 1) continue;
    duplicates.push(...sorted.slice(1));
  }
  return { ok: true as const, data: duplicates };
}

// ---------------- Maintenance: Fix Non-MAHE Proshow Ownerships (script logic inlined) ----------------
// This makes the one-off script repeatable via a server action / API route.
// It is idempotent: running multiple times yields same final state.
// Strategy: detect NONMAHE users from payment_logs raw.user_type/user_status variants, then
// ensure they only own the Non-MAHE proshow pass (event_id NULL, mahe=false) instead of a MAHE proshow pass.
// If both owned, delete MAHE variant; if only MAHE owned, swap to target.
export async function maintenanceFixNonMaheProshow(limitUsers = 400, dryRun = false) {
  const supabase = getServiceClient();
  // 1) Resolve target Non-MAHE proshow pass (prefer 'passes' lowercase)
  const targetName = 'Non-MAHE BLR';
  let passQ = await supabase
    .from('passes')
    .select('id, pass_name, mahe, event_id')
    .ilike('pass_name', `${targetName}%`)
    .is('event_id', null)
    .eq('mahe', false)
    .limit(5);
  if (passQ.error) {
    passQ = await supabase
      .from('Pass')
      .select('id, pass_name, mahe, event_id')
      .ilike('pass_name', `${targetName}%`)
      .is('event_id', null)
      .eq('mahe', false)
      .limit(5);
  }
  if (passQ.error) return { ok:false as const, error: passQ.error.message };
  const candidates = passQ.data || [];
  if (!candidates.length) return { ok:false as const, error: 'target_non_mahe_pass_not_found' };
  // If multiple we just take first deterministic; script version forced disambiguation. Here we proceed with first.
  const targetPass = candidates[0] as { id: string; pass_name: string };

  // 2) Collect NONMAHE user ids from payment_logs raw (limit for safety)
  const statuses = [
    'Success','Paid','Completed','Successfull','Successfull payment','Successfull_payment',
    'success','paid','completed','successfull','successfull payment','successfull_payment'
  ];
  const orFilter = [
    'raw->>user_type.eq.NONMAHE',
    'raw->>userType.eq.NONMAHE',
    'raw->>user_status.eq.NONMAHE',
    'raw->>userStatus.eq.NONMAHE'
  ].join(',');
  const candUsersRes = await supabase
    .from('payment_logs')
    .select('user_id')
    .in('status', statuses)
    .or(orFilter)
    .not('user_id', 'is', null)
    .limit(limitUsers * 5); // over-fetch to allow filtering distinct then slicing
  if (candUsersRes.error) return { ok:false as const, error: candUsersRes.error.message };
  const userIds = Array.from(new Set((candUsersRes.data || []).map(r => (r as { user_id: string | null }).user_id).filter(Boolean))) as string[];
  const limitedUserIds = userIds.slice(0, limitUsers);
  if (!limitedUserIds.length) return { ok:true as const, data: { updated:0, deleted:0, scannedUsers:0, targetPass: targetPass.pass_name } };

  // 3) Fetch their proshow-like ownership rows
  const upRes = await supabase
    .from('User_passes')
    .select('id, userId, passId, passes:passId(id, pass_name, mahe, event_id)')
    .in('userId', limitedUserIds);
  if (upRes.error) return { ok:false as const, error: upRes.error.message };
  // Filter to event_id null rows only
  interface ProshowRow { id: string; userId: string; passId: string; passes?: { id?: string; pass_name?: string | null; mahe?: boolean | null; event_id?: string | null } }
  const proshowRows = (upRes.data as ProshowRow[] || []).filter(r => r.passes?.event_id == null);

  let updated = 0; let deleted = 0;
  if (!dryRun) {
    for (const r of proshowRows as Array<{ id: string; userId: string; passId: string; passes?: { mahe?: boolean | null; event_id?: string | null; pass_name?: string | null } }>) {
      const p = r.passes;
      if (!p) continue;
      // If pass is MAHE proshow (mahe=true) then remediate
      if (p.event_id == null && p.mahe === true) {
        // Does user already have target pass?
        const existing = await supabase
          .from('User_passes')
          .select('id')
          .eq('userId', r.userId)
          .eq('passId', targetPass.id)
          .maybeSingle();
        if (!existing.error && existing.data) {
          // Delete this MAHE row
          const del = await supabase.from('User_passes').delete().eq('id', r.id);
          if (!del.error) { deleted++; }
          continue;
        }
        // Update passId in place
        const up = await supabase.from('User_passes').update({ passId: targetPass.id }).eq('id', r.id);
        if (!up.error) { updated++; }
      }
    }
  }

  // Dry run summary (without modifications) still counts potential changes
  if (dryRun) {
  const potential = proshowRows.filter(r => r.passes?.event_id == null && r.passes?.mahe === true).length;
    return { ok:true as const, data: { updated: potential, deleted: 0, scannedUsers: limitedUserIds.length, dryRun: true, targetPass: targetPass.pass_name } };
  }
  return { ok:true as const, data: { updated, deleted, scannedUsers: limitedUserIds.length, targetPass: targetPass.pass_name } };
}

// Assign a duplicate log (any pass) to another user by phone. Updates the log's user_id and grants pass to target.
export async function adminAssignDuplicateLogToPhone(paymentLogId: string, targetPhone: string) {
  const pid = uuid.safeParse(paymentLogId);
  if (!pid.success) return { ok: false as const, error: 'Invalid paymentLogId' };
  const phoneRaw = (targetPhone || '').trim();
  if (!phoneRaw) return { ok: false as const, error: 'Phone required' };
  // Role check
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: false as const, error: 'Not authenticated' };
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!(role === 'ticket_admin' || role === 'super_admin')) {
    return { ok: false as const, error: 'Forbidden' };
  }
  const supabase = getServiceClient();
  // Load log
  const { data: logRow, error: logErr } = await supabase
    .from('payment_logs')
    .select('id, user_id, phone, membership_type, event_name, event_type, tracking_id')
    .eq('id', paymentLogId)
    .maybeSingle();
  if (logErr) return { ok: false as const, error: logErr.message };
  if (!logRow) return { ok: false as const, error: 'payment_log_not_found' };

  // Resolve mapping for this log
  interface LogRow { membership_type: string | null; event_name: string | null; event_type: string | null; tracking_id: string | null }
  const lr = logRow as unknown as LogRow;
  const mt = normalizeKeyParts(lr.membership_type);
  const en = normalizeKeyParts(lr.event_name);
  const et = normalizeKeyParts(lr.event_type);
  const legacyKey = `${mt}|${en}`;
  const v2Key = `${et}|${en}`;
  const mapRes = await supabase.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  if (mapRes.error) return { ok: false as const, error: mapRes.error.message };
  const mapping: Record<string, string | null> = {};
  for (const r of (mapRes.data || []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (r.external_key) mapping[(r.external_key as string).toLowerCase()] = r.pass_id as string | null;
    if (r.external_key_v2) mapping[(r.external_key_v2 as string).toLowerCase()] = r.pass_id as string | null;
  }
  const passId = (mapping[v2Key] ?? mapping[legacyKey]) || null;
  if (!passId) return { ok: false as const, error: 'mapping_not_found' };
  // Load pass meta (no longer restricted to proshow-like)
  const { data: passRow, error: passErr } = await supabase.from('Pass').select('id').eq('id', passId).maybeSingle();
  if (passErr) return { ok: false as const, error: passErr.message };
  if (!passRow) return { ok: false as const, error: 'pass_not_found' };

  // Normalize phone and find target user
  const normalized = phoneRaw.startsWith('+') ? phoneRaw.replace(/[^0-9+]/g, '') : phoneRaw.replace(/[^0-9]/g, '');
  const { data: targetUser, error: uErr } = await supabase
    .from('Users')
    .select('id, phone')
    .eq('phone', normalized)
    .maybeSingle();
  if (uErr) return { ok: false as const, error: uErr.message };
  if (!targetUser) return { ok: false as const, error: 'target_user_not_found' };

  const targetUserId = (targetUser as any).id as string; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Ensure target does not already own this pass
  const { data: hasRow, error: hasErr } = await supabase
    .from('User_passes')
    .select('id')
    .eq('userId', targetUserId)
    .eq('passId', passId)
    .maybeSingle();
  if (hasErr) return { ok: false as const, error: hasErr.message };
  if (hasRow) return { ok: false as const, error: 'target_already_has_pass' };

  // Update log owner and grant pass
  const { error: updErr } = await supabase
    .from('payment_logs')
    .update({ user_id: targetUserId })
    .eq('id', paymentLogId);
  if (updErr) return { ok: false as const, error: updErr.message };

  // Grant pass via central assigner (enforces enable/sellout and QR token)
  const granted = await assignPassToUser(targetUserId, passId);
  if (!granted.ok) return { ok: false as const, error: granted.error || 'grant_failed' } as const;
  return { ok: true as const, data: { reassigned_to: targetUserId, passId, tracking_id: (logRow as any).tracking_id || null } } as const; // eslint-disable-line @typescript-eslint/no-explicit-any
}
// Helper to get current admin role from session
export async function getCurrentAdminRole() {
  const session = (await getServerSession(authOptions)) as { user?: { email?: string | null } } | null;
  const email = session?.user?.email || null;
  if (!email) return { ok: true as const, data: null as string | null };
  const r = await getRoleForEmail(email);
  if (!r.ok) return { ok: false as const, error: r.error } as const;
  return { ok: true as const, data: (r.data || null) as string | null };

}
