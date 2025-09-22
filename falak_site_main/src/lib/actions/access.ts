import { createServiceClient, createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Access rules:
// 1. Pass with event_id NOT NULL grants access to that specific event.
// 2. Pass with event_id NULL and mahe = true  -> grants all events whose sub_cluster != 'esports' (case-insensitive).
// 3. Pass with event_id NULL and mahe = false -> grants all events whose sub_cluster = 'esports'.
// 4. If any ownership row references a payment_log whose membership_type = 'esports' (case-insensitive),
//    additionally grant all events whose sub_cluster = 'proshow'.
// Case comparisons are performed in JS after fetching needed rows.

export interface EventAccessResult {
  eventIds: string[];
}

// Simple in-memory cache (per server instance) with TTL.
// NOTE: In a serverless multi-region deployment this cache is per-instance and ephemeral.
const ACCESS_CACHE = new Map<string, { ts: number; data: EventAccessResult }>();
const ACCESS_CACHE_TTL_MS = 60_000; // 1 minute

export async function computeUserAccessibleEventIds(userId: string): Promise<EventAccessResult> {
  // Check cache first
  const cached = ACCESS_CACHE.get(userId);
  if (cached && Date.now() - cached.ts < ACCESS_CACHE_TTL_MS) {
    return cached.data;
  }
  const service = createServiceClient();

  // Fetch passes joined
  const passesQ = await service
    .from('User_passes')
    .select('passId, passes:passId(event_id, mahe)')
    .eq('userId', userId);
  if (passesQ.error) return { eventIds: [] };

  interface PassRow { passId: string; passes: { event_id: string | null; mahe: boolean | null } | null }
  interface RawPass { passId?: unknown; passes?: { event_id?: unknown; mahe?: unknown } }
  const rows: PassRow[] = Array.isArray(passesQ.data)
    ? (passesQ.data as RawPass[]).map(r => ({
        passId: typeof r.passId === 'string' ? r.passId : String(r.passId ?? ''),
        passes: r.passes ? {
          event_id: typeof r.passes.event_id === 'string' ? r.passes.event_id : (r.passes.event_id == null ? null : String(r.passes.event_id)),
          mahe: typeof r.passes.mahe === 'boolean' ? r.passes.mahe : (r.passes.mahe == null ? null : Boolean(r.passes.mahe)),
        } : null,
      }))
    : [];
  const hasBundleEventsPass = rows.some(r => !r.passes?.event_id && r.passes?.mahe === true);
  const hasBundleEsportsPass = rows.some(r => !r.passes?.event_id && r.passes?.mahe === false);

  // Detect if user owns any specific event pass that is for an esports event.
  // If yes, we will grant access to ALL esports events (global esports unlock by any esports pass).
  const specificEventIds = Array.from(new Set(rows.map(r => r.passes?.event_id).filter((v): v is string => Boolean(v))));
  let hasAnySpecificEsportsPass = false;
  if (specificEventIds.length) {
    const specEvQ = await service
      .from('Events')
      .select('id, sub_cluster')
      .in('id', specificEventIds);
    if (!specEvQ.error && Array.isArray(specEvQ.data)) {
      hasAnySpecificEsportsPass = (specEvQ.data as Array<{ id: string; sub_cluster: string | null }>).
        some(ev => (ev.sub_cluster || '').toLowerCase() === 'esports');
    }
  }

  // Check membership types via payment logs for proshow unlocking via esports membership_type
  interface MembershipRow { payment_logs?: { membership_type?: string | null; event_type?: string | null; event_name?: string | null } | null }
  const membershipQ = await service
    .from('User_passes')
    .select('source_payment_log_id, payment_logs:source_payment_log_id(membership_type, event_type, event_name)')
    .eq('userId', userId);
  let hasEsportsMembership = false;
  let hasEsportsFullBundle = false; // Falak25 + ESPORTS grants all esports events
  if (!membershipQ.error && Array.isArray(membershipQ.data)) {
    for (const r of membershipQ.data as MembershipRow[]) {
      const mt = (r.payment_logs?.membership_type || '').toLowerCase();
      const et = (r.payment_logs?.event_type || '').toLowerCase();
      if (mt === 'esports' || et === 'esports') { hasEsportsMembership = true; }
      if (mt === 'falak25' && (r.payment_logs?.event_name || '').toLowerCase() === 'esports') {
        hasEsportsFullBundle = true;
      }
      if (hasEsportsMembership && hasEsportsFullBundle) break;
    }
  }

  // Pre-fetch all events only if a bundle pass exists or esports membership triggers extra scope
  interface EventRow { id: string; sub_cluster: string | null }
  let allEvents: EventRow[] = [];
  // Include hasEsportsFullBundle (Falak25 + ESPORTS) so we actually load events to grant them.
  if (hasBundleEventsPass || hasBundleEsportsPass || hasEsportsMembership || hasEsportsFullBundle || hasAnySpecificEsportsPass) {
    const evQ = await service.from('Events').select('id, sub_cluster');
    if (!evQ.error && Array.isArray(evQ.data)) allEvents = evQ.data as EventRow[];
  }

  const allowed = new Set<string>();

  // Specific event passes
  for (const r of rows) {
    if (r.passes?.event_id) allowed.add(r.passes.event_id);
  }

  if (hasBundleEventsPass) {
    for (const ev of allEvents) {
      if (!ev) continue;
      const sc = (ev.sub_cluster || '').toLowerCase();
      if (sc !== 'esports') allowed.add(ev.id);
    }
  }

  if (hasBundleEsportsPass || hasEsportsFullBundle) {
    for (const ev of allEvents) {
      const sc = (ev.sub_cluster || '').toLowerCase();
      if (sc === 'esports') allowed.add(ev.id);
    }
  }

  // New rule: any specific esports event pass unlocks all esports events
  if (hasAnySpecificEsportsPass) {
    for (const ev of allEvents) {
      const sc = (ev.sub_cluster || '').toLowerCase();
      if (sc === 'esports') allowed.add(ev.id);
    }
  }

  if (hasEsportsMembership) {
    for (const ev of allEvents) {
      const sc = (ev.sub_cluster || '').toLowerCase();
      if (sc === 'proshow') allowed.add(ev.id);
    }
  }

  const result: EventAccessResult = { eventIds: Array.from(allowed) };
  ACCESS_CACHE.set(userId, { ts: Date.now(), data: result });
  return result;
}

// API-style helper to be used from a route action.
export async function getMyAccessibleEventIds(force = false) {
  const cookieStore = await cookies();
  const client = createClient(cookieStore);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthenticated' };
  if (force) ACCESS_CACHE.delete(user.id);
  const result = await computeUserAccessibleEventIds(user.id);
  return { ok: true as const, data: result };
}
