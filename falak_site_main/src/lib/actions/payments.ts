// Payment ingestion & verification logic
// -------------------------------------
// Fetches external payment logs via user phone, persists auditable raw rows (payment_logs), maps to
// internal passes through an admin-controlled whitelist (external_pass_map), attaches ownership in
// User_passes idempotently, backfills past unmapped logs when mappings appear later, and returns the
// current pass ownership plus any still-pending mapping items.
//
// Design goals (implemented here unless noted):
// 1. Server-only secrets (ACCESSKEY / ACCESSTOKEN) – NEVER sent to client.
// 2. Idempotent persistence: UNIQUE constraints + upsert ignore duplicates.
// 3. Mapping whitelist defending against forged membership/event names.
// 4. Race safety: advisory lock (if rpc exists) + optional soft lock table fallback.
// 5. Throttle remote polling (cooldown) with force override.
// 6. Retry + timeout for flaky upstream (exponential backoff 1s/2s).
// 7. Validation + doc cap to avoid DoS / oversized payload ingestion.
// 8. Backfill previously ingested but unmapped logs once mapping appears.
// 9. Pending mapping reporting returned to caller.
// 10. Separation of ownership (User_passes) vs redemption (handled elsewhere) preserved.
//
// Return shape change: data now is { passes: UserPassDTO[]; pending: PendingMappingDTO[] }
// (If legacy callers expected an array, update them accordingly.)
//
// Prerequisite schema (draft – apply via migrations before relying on full feature set):
// payment_logs, external_pass_map, ingestion_locks (soft lock), User_passes added source_* columns & constraints.
// See migration draft provided separately for full SQL.
//
// (Optional) advisory lock function (rpc):
// create or replace function acquire_user_payment_lock(lock_key bigint)
// returns void language plpgsql as $$ begin perform pg_advisory_xact_lock(lock_key); end; $$;
//
// NOTE: If you don't add the SQL yet, the inserts referencing those tables/columns will fail.
// Add them first for full functionality.

import { cookies } from "next/headers";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import crypto from "crypto";

// Endpoint & env keys
const PAYMENT_ENDPOINT = process.env.VERIFICATION_URL || "https://api.manipal.edu/api/v1/falak-single-payment-log";
const ACCESS_KEY = process.env.ACCESSKEY;
const ACCESS_TOKEN = process.env.ACCESSTOKEN;

if (!ACCESS_KEY || !ACCESS_TOKEN) {
  // Intentionally not throwing to avoid crashing build; runtime calls will error clearly.
  // console.warn("ACCESSKEY / ACCESSTOKEN missing. Payment verification will fail.");
}

// Config / tuning
// Cooldown & locking removed (API unlimited); previously used constants/functions deleted.
const MAX_DOCS = 200;                 // Safety cap on processed docs per ingestion
const RETRY_ATTEMPTS = 3;             // 1 initial + 2 retries
const ACCEPTED_STATUSES = new Set(["success", "paid", "completed", "successfull", "successfull payment", "successfull_payment", "success"].map(s=>s.toLowerCase()));
// Legacy variant list for normalization (exact matches we might have stored previously)
const LEGACY_STATUS_VARIANTS = [
  'successfull', 'Successfull',
  'successfull payment', 'Successfull payment',
  'successfull_payment', 'Successfull_payment',
  'paid', 'Paid', 'completed', 'Completed', 'success', 'Success'
];

// In-memory mock support (dev/local testing). If set (via __setMockPaymentDocs), network fetch is skipped.
let MOCK_PAYMENT_DOCS: ExternalPaymentDoc[] | null = null;
export function __setMockPaymentDocs(docs: ExternalPaymentDoc[] | null) {
  MOCK_PAYMENT_DOCS = docs;
}

// Runtime capability flags (auto-detected on first failure) so code works even if migrations not applied yet.
let SUPPORTS_SOURCE_COLUMNS = true; // User_passes.source_* columns
let SUPPORTS_EVENT_TYPE = true;     // payment_logs.event_type column
let SUPPORTS_UPSERT = true;         // userId,passId unique or exclusion constraint exists
let REQUIRE_QR_TOKEN = true;        // qr_token NOT NULL constraint present

// ----------------------
// Mapping cache (external_pass_map)
// ----------------------
// Simple in-memory cache surviving within a single serverless instance / node process between requests.
// TTL kept short (30s) so admin mapping changes propagate quickly without manual invalidation.
const MAPPING_CACHE_TTL_MS = 30_000;
let MAPPING_CACHE: { ts: number; data: Record<string, string | null>; supportsV2: boolean } | null = null;
async function loadMapping(service: ReturnType<typeof createServiceClient>): Promise<Record<string, string | null>> {
  if (MAPPING_CACHE && Date.now() - MAPPING_CACHE.ts < MAPPING_CACHE_TTL_MS) return MAPPING_CACHE.data;
  let supportsV2 = true;
  // Attempt to select potential v2 column (external_key_v2) if it exists.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: any = await service.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  if (res.error && /external_key_v2/i.test(res.error.message)) {
    // Column absent – retry legacy only select.
    supportsV2 = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res = await service.from('external_pass_map').select('external_key, pass_id, active').eq('active', true) as any;
  }
  const map: Record<string, string | null> = {};
  if (!res.error && Array.isArray(res.data)) {
    for (const row of res.data as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (row.external_key) map[row.external_key] = row.pass_id as string | null;
      if (supportsV2 && row.external_key_v2) map[row.external_key_v2] = row.pass_id as string | null;
    }
  }
  MAPPING_CACHE = { ts: Date.now(), data: map, supportsV2 };
  return map;
}
export function __clearMappingCache() { MAPPING_CACHE = null; }

function generateQrToken() {
  try { return crypto.randomUUID(); } catch { return crypto.randomBytes(16).toString('hex'); }
}

interface ExternalPaymentDoc {
  _id?: string;
  tracking_id?: string;
  order_status?: string;
  orderid?: string;
  billing_tel?: string;
  membership_type?: string;
  event_name?: string;
  event_type?: string; // NEW: some upstream payloads may include explicit event_type (e.g., ESPORTS)
  user_type?: string; // Upstream field indicating MAHE/NONMAHE
  user_status?: string; // Some payloads use user_status instead of user_type
  total_amount?: string | number;
  created_at?: string; // date string
  // Additional untyped fields from upstream; store in raw JSON.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

// Cache for pass meta lookups to avoid repeated selects when applying conditional remaps
const PASS_META_CACHE: Record<string, { mahe: boolean | null; event_id: string | null } | undefined> = {};
let NON_MAHE_PROSHOW_PASS_ID: string | null | undefined = undefined; // undefined=unresolved, null=not found

function normalizeUserType(v: unknown): string {
  return String(v ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

// Some upstreams send user_type, others user_status; support camelCase as well
function getNormalizedUserTypeFromDoc(d: { [k: string]: unknown } | null | undefined): string | null {
  if (!d) return null;
  const candidates: unknown[] = [
    d['user_type'],
    d['userType'],
    d['user_status'],
    d['userStatus'],
    d['usertype'],
    d['userstatus'],
  ];
  for (const c of candidates) {
    const n = normalizeUserType(c);
    if (n) return n;
  }
  return null;
}

type PassMetaRow = { mahe: boolean | null; event_id: string | null };

async function getPassMeta(service: ReturnType<typeof createServiceClient>, passId: string) {
  if (PASS_META_CACHE[passId] !== undefined) return PASS_META_CACHE[passId];
  const res = await service.from('passes').select('mahe, event_id').eq('id', passId).maybeSingle<PassMetaRow>();
  if (res.error || !res.data) { PASS_META_CACHE[passId] = undefined; return undefined; }
  const meta: PassMetaRow = { mahe: res.data.mahe ?? null, event_id: res.data.event_id ?? null };
  PASS_META_CACHE[passId] = meta;
  return meta;
}

async function getNonMaheProshowPassId(service: ReturnType<typeof createServiceClient>): Promise<string | null> {
  if (NON_MAHE_PROSHOW_PASS_ID !== undefined) return NON_MAHE_PROSHOW_PASS_ID;
  // Allow explicit override via env
  if (process.env.NON_MAHE_PROSHOW_PASS_ID) {
    NON_MAHE_PROSHOW_PASS_ID = process.env.NON_MAHE_PROSHOW_PASS_ID as string;
    return NON_MAHE_PROSHOW_PASS_ID;
  }
  // Heuristic: public proshow pass -> event_id NULL and mahe=false
  const find = await service
    .from('passes')
    .select('id')
    .is('event_id', null)
    .eq('mahe', false)
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (!find.error && find.data) {
    NON_MAHE_PROSHOW_PASS_ID = find.data.id as string;
  } else {
    NON_MAHE_PROSHOW_PASS_ID = null;
  }
  return NON_MAHE_PROSHOW_PASS_ID;
}

interface FetchResult {
  ok: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

interface UserPassDTO {
  passId: string;
  created_at: string;
  source_tracking_id?: string | null;
  // nested pass info (pass_name, event_id) already selected
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

interface PendingMappingDTO {
  tracking_id: string;
  membership_type: string | undefined;
  event_name: string | undefined;
  external_key: string;
}

function normalize(v?: string) {
  return (v || "").trim().toLowerCase();
}
// Legacy key: membership_type|event_name
function buildLegacyKey(membership: string | undefined, eventName: string | undefined) {
  return normalize(membership) + "|" + normalize(eventName);
}
// V2 key: event_type|event_name (preferred going forward)
function buildV2Key(eventType: string | undefined, eventName: string | undefined) {
  return normalize(eventType) + "|" + normalize(eventName);
}
// hashPhone removed (locking deprecated)

function parseAmount(v: string | number | undefined): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const num = Number((v as string).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function validateDoc(d: ExternalPaymentDoc): string | null {
  // Returns null if valid else reason string
  if (!d) return 'empty_doc';
  if (!d.tracking_id && !d.orderid) return 'missing_tracking';
  if (!d.order_status) return 'missing_status';
  const status = d.order_status.toLowerCase();
  if (!ACCEPTED_STATUSES.has(status)) return 'status_not_success';
  if ((d.membership_type || '').length > 120) return 'membership_too_long';
  if ((d.event_name || '').length > 200) return 'event_name_too_long';
  return null;
}

function digitsOnly(p: string) { return (p || '').replace(/[^0-9]/g, ''); }

async function fetchRemoteLogsOnce(phone: string): Promise<ExternalPaymentDoc[]> {
  if (!ACCESS_KEY || !ACCESS_TOKEN) throw new Error("payment_keys_missing");
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 10000); // 10s timeout
  try {
    const url = `${PAYMENT_ENDPOINT}?mobile=${encodeURIComponent(phone)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'accesskey': ACCESS_KEY,
        'accesstoken': ACCESS_TOKEN,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`remote_http_${res.status}`);
    const json = await res.json();
    const docs = Array.isArray(json?.data?.docs) ? json.data.docs : [];
    return docs;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRemoteLogs(phone: string): Promise<ExternalPaymentDoc[]> {
  if (MOCK_PAYMENT_DOCS) {
    // Return a shallow copy to avoid accidental mutation across ingestions.
    return [...MOCK_PAYMENT_DOCS];
  }
  // Try original phone, then try +91 + digits (to handle upstream expectations)
  const variants: string[] = [];
  const d = digitsOnly(phone);
  variants.push(phone);
  if (!phone.startsWith('+91') && d.length === 10) variants.push('+91' + d);
  let lastErr: unknown;
  for (const variant of variants) {
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
      try {
        const docs = await fetchRemoteLogsOnce(variant);
        // If docs are empty and we have more variants, continue trying
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        lastErr = e;
      }
      if (attempt < RETRY_ATTEMPTS - 1) {
        const backoff = 1000 * (attempt + 1);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  // If we reach here, either lastErr occurred or all attempts returned empty
  if (lastErr) throw lastErr;
  return [];
}

// Soft lock helpers removed.

// Public server action style function
export async function ingestAndListUserPasses(opts?: { devUserId?: string; debug?: boolean; forceUserId?: string }): Promise<FetchResult> {
  const debug: string[] = [];
  // Resolve user id via (1) Supabase auth, (2) NextAuth session email -> Users table lookup, (3) dev override.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: supaUser } } = await supabase.auth.getUser();
  let userId: string | null = supaUser?.id || null;

  // Admin override: when called by a privileged server action, allow forcing a specific userId
  if (opts?.forceUserId) {
    userId = opts.forceUserId;
  }

  // Fallback: NextAuth session email -> Users table
  if (!userId) {
    try {
      const session = await getServerSession(authOptions);
      const email = session?.user?.email;
      if (email) {
        const byEmail = await getUserByEmail(email);
        interface ByEmailData { id: string }
        const data = byEmail.ok ? (byEmail.data as ByEmailData | null) : null;
        if (data?.id) {
          userId = data.id;
        }
      }
    } catch {/* ignore fallback errors */}
  }

  // Admin override: if a caller supplies devUserId, honor it to target a specific user (guard at call-site)
  if (opts?.devUserId) {
    userId = opts.devUserId;
  }
  if (!userId) return { ok:false, error:"unauthenticated" };

  // Fetch user row for phone (try lowercase 'users' first, then capitalized 'Users')
  interface UserRow { id: string; phone?: string | null; last_ingested_at?: string | null }
  let userRow: UserRow | null = null;
  try {
    const attempt = await supabase.from('users').select('id, phone, last_ingested_at').eq('id', userId).maybeSingle();
    if (!attempt.error && attempt.data) userRow = attempt.data as UserRow;
  } catch {/* ignore */}
  if (!userRow || !userRow.phone) {
    try {
      const svc = createServiceClient();
      const attempt2 = await svc.from('Users').select('id, phone, last_ingested_at').eq('id', userId).maybeSingle();
      if (!attempt2.error && attempt2.data) userRow = attempt2.data as UserRow;
    } catch {/* ignore */}
  }
  if (!userRow || !userRow.phone) return { ok:false, error:"user_phone_missing" };
  if (opts?.debug) debug.push(`userId=${userId} phone=${userRow.phone}`);

  // Always proceed to fetch remote logs (no cooldown / rate limit concerns).

  // Locking removed: directly proceed (API unlimited / idempotent operations).
  const service = createServiceClient();

  let docs: ExternalPaymentDoc[] = [];
  try {
  docs = await fetchRemoteLogs(userRow.phone);
  } catch (e) {
    if (opts?.debug) debug.push(`remote_fetch_error=${(e as Error)?.message}`);
  // Lock release removed (no locking used).
    const base = await listUserPassesAndPending(userId);
    if (opts?.debug && base.ok && base.data) base.data.debug = debug;
    return base; // remote failure fallback
  }

  // Validation + cap
  if (docs.length > MAX_DOCS) docs = docs.slice(0, MAX_DOCS);

  // Preload active mapping (cached) including potential v2 keys
  const mapping = await loadMapping(service);

  // Track newly granted passIds to avoid duplicate inserts inside same ingestion
  const granted = new Set<string>();

  // Phone-level proshow ownership guard: ensure only one proshow-like pass (event_id null) is auto-assigned per phone across all users.
  // Determine if any user with this same phone already owns a proshow-like pass, and who that is.
  let phoneProshowOwnedBy: string | null = null;
  try {
    // Find all user IDs with this exact phone
    const samePhone = await service.from('Users').select('id').eq('phone', userRow.phone as string);
    if (!samePhone.error && Array.isArray(samePhone.data) && samePhone.data.length) {
      const ids = (samePhone.data as Array<{ id: string }>).map(r => r.id);
      const existing = await service
        .from('User_passes')
        .select('userId, passes:passId(event_id)')
        .in('userId', ids);
      if (!existing.error && Array.isArray(existing.data)) {
        for (const r of existing.data as Array<{ userId: string; passes?: { event_id?: string | null } }>) {
          const evt = r.passes?.event_id ?? null;
          if (evt == null) { phoneProshowOwnedBy = r.userId; break; }
        }
      }
    }
  } catch {/* ignore phone-scan errors */}
  let phoneProshowConsumed = phoneProshowOwnedBy != null;

  for (const d of docs) {
    const validationError = validateDoc(d);
    if (validationError) continue; // skip non-success or malformed
    const tracking = d.tracking_id || d.orderid as string | undefined;
    if (!tracking) continue;
  const legacyKey = buildLegacyKey(d.membership_type, d.event_name);
  const v2Key = buildV2Key(d.event_type as string | undefined, d.event_name);
  // Some upstream payloads might use actual_amount instead of total_amount – access via index to avoid any cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeActual: unknown = (d as any)['actual_amount'];
  const amount = parseAmount(d.total_amount as string | number | undefined) || (typeof maybeActual === 'string' || typeof maybeActual === 'number' ? parseAmount(maybeActual as string | number) : null);

    // Insert payment log idempotently
    let insertedLogId: string | null = null;
  const canonicalStatus = 'Success';
  let insertLog = await service
      .from('payment_logs')
      .insert({
        tracking_id: d.tracking_id,
        order_id: d.orderid,
        phone: userRow.phone,
        user_id: userId,
    status: canonicalStatus,
        membership_type: d.membership_type,
        event_name: d.event_name,
        // store event_type if provided and column exists
        ...(SUPPORTS_EVENT_TYPE && d.event_type ? { event_type: d.event_type } : {}),
        total_amount: amount,
        external_created_at: d.created_at,
        raw: d,
      })
      .select('id')
      .single();
    if (insertLog.error && /event_type/i.test(insertLog.error.message)) {
      SUPPORTS_EVENT_TYPE = false;
      // retry without event_type
    insertLog = await service
        .from('payment_logs')
        .insert({
          tracking_id: d.tracking_id,
          order_id: d.orderid,
          phone: userRow.phone,
          user_id: userId,
      status: canonicalStatus,
          membership_type: d.membership_type,
          event_name: d.event_name,
          total_amount: amount,
          external_created_at: d.created_at,
          raw: d,
        })
        .select('id')
        .single();
    }
  if (insertLog.error && opts?.debug) debug.push(`insertLog_error=${insertLog.error.message}`);
  if (!insertLog.error && insertLog.data) insertedLogId = insertLog.data.id as string;

  // Precedence: v2 key first, then legacy
  let passId = mapping[v2Key] ?? mapping[legacyKey];
    // Conditional override: if upstream marks user as NONMAHE and mapped pass is MAHE Proshow (event_id null, mahe=true),
    // re-route to Non-MAHE Proshow pass id.
    if (passId) {
      const ut = getNormalizedUserTypeFromDoc(d);
      if (ut === 'nonmahe') {
        try {
          const meta = await getPassMeta(service, passId);
          if (meta && meta.event_id == null) {
            // For any proshow bundle under NONMAHE, force to Non‑MAHE BLR and cleanup stray MAHE proshow
            const nonMaheId = await getNonMaheProshowPassId(service);
            if (nonMaheId) passId = nonMaheId;
            // Remove any existing MAHE=true proshow passes to avoid dual ownership
            const stray = await service
              .from('User_passes')
              .select('id, passes:passId(mahe, event_id)')
              .eq('userId', userId);
            if (!stray.error && Array.isArray(stray.data)) {
              for (const s of stray.data as Array<{ id: string; passes?: { mahe?: boolean | null; event_id?: string | null } }>) {
                const p = s.passes;
                if (p && p.event_id == null && p.mahe === true) {
                  await service.from('User_passes').delete().eq('id', s.id);
                }
              }
            }
          }
        } catch {/* ignore override errors */}
      }
    }
    if (passId) {
      // Determine if this mapped pass is proshow-like (event_id null)
      let isProshowLike = false;
      try {
        const meta = await getPassMeta(service, passId);
        if (meta && meta.event_id == null) isProshowLike = true;
      } catch {/* ignore meta errors */}
      // If a different user with the same phone already owns a proshow-like pass, skip auto-grant for this user.
      if (isProshowLike && phoneProshowConsumed && phoneProshowOwnedBy && phoneProshowOwnedBy !== userId) {
        // keep payment_logs intact but do not grant ownership
        continue;
      }
      if (granted.has(passId)) continue;
      const manualInsert = async () => {
        const existing = await service.from('User_passes').select('passId').eq('userId', userId).eq('passId', passId).maybeSingle();
        if (!existing.error && existing.data) { granted.add(passId); return; }
        const baseRow: Record<string, unknown> = { userId, passId };
        if (SUPPORTS_SOURCE_COLUMNS) {
          baseRow.source_tracking_id = tracking;
          baseRow.source_order_id = d.orderid;
          baseRow.source_payment_log_id = insertedLogId;
        }
        if (REQUIRE_QR_TOKEN) baseRow.qr_token = generateQrToken();
        let ins = await service.from('User_passes').insert(baseRow).select('passId').maybeSingle();
        if (ins.error && /qr_token/i.test(ins.error.message)) {
          // Column maybe absent (unlikely) -> stop requiring it
          REQUIRE_QR_TOKEN = false;
          const retryRow = { ...baseRow };
          delete (retryRow as any).qr_token; // eslint-disable-line @typescript-eslint/no-explicit-any
          ins = await service.from('User_passes').insert(retryRow).select('passId').maybeSingle();
        }
        if (ins.error) { if (opts?.debug) debug.push(`manual_insert_error_passId=${passId} msg=${ins.error.message}`); }
        else if (ins.data) granted.add(passId);
      };
      if (SUPPORTS_UPSERT) {
        try {
          let upsert;
          if (SUPPORTS_SOURCE_COLUMNS) {
            const row: Record<string, unknown> = {
              userId, passId,
              source_tracking_id: tracking,
              source_order_id: d.orderid,
              source_payment_log_id: insertedLogId,
            };
            if (REQUIRE_QR_TOKEN) row.qr_token = generateQrToken();
            upsert = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            if (upsert.error && /qr_token/i.test(upsert.error.message)) {
              REQUIRE_QR_TOKEN = false; // retry without qr_token
              delete row.qr_token;
              upsert = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            }
            if (upsert.error && /source_(tracking_id|order_id|payment_log_id)/i.test(upsert.error.message)) {
              SUPPORTS_SOURCE_COLUMNS = false;
            }
          }
          if (!SUPPORTS_SOURCE_COLUMNS) {
            const row: Record<string, unknown> = { userId, passId };
            if (REQUIRE_QR_TOKEN) row.qr_token = generateQrToken();
            upsert = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            if (upsert.error && /qr_token/i.test(upsert.error.message)) {
              REQUIRE_QR_TOKEN = false;
              delete row.qr_token;
              upsert = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            }
          }
          if (upsert && upsert.error) {
            if (opts?.debug) debug.push(`upsert_error_passId=${passId} msg=${upsert.error.message}`);
            if (/no unique or exclusion constraint/i.test(upsert.error.message)) {
              SUPPORTS_UPSERT = false;
              await manualInsert();
            }
          } else if (upsert && !upsert.error) {
            granted.add(passId);
            // Mark phone as consumed for proshow-like so subsequent logs won't auto-grant again this run
            if (isProshowLike && !phoneProshowConsumed) { phoneProshowConsumed = true; phoneProshowOwnedBy = userId; }
          }
        } catch (e) {
          if (opts?.debug) debug.push(`upsert_exception_passId=${passId} msg=${(e as Error).message}`);
          SUPPORTS_UPSERT = false;
          await manualInsert();
        }
      } else {
        await manualInsert();
      }
    }
  }

  // Backfill: iterate existing payment_logs for this user to attach ownership for mappings added after earlier ingestions
  // Normalize legacy statuses to 'Success' so subsequent queries (eq 'Success') pick them up.
  try {
    await service.from('payment_logs')
      .update({ status: 'Success' })
      .eq('user_id', userId)
      .in('status', LEGACY_STATUS_VARIANTS.filter(s => s !== 'Success'));
  } catch {/* ignore normalization errors */}

  const logsRes = await service
    .from('payment_logs')
    .select('id, tracking_id, order_id, membership_type, event_name, event_type, raw')
	.eq('user_id', userId)
    .eq('status', 'Success');
  if (!logsRes.error && logsRes.data) {
    for (const pl of logsRes.data) {
  interface PLRow { membership_type?: string | null; event_name?: string | null; event_type?: string | null; tracking_id?: string | null; order_id?: string | null; id?: string }
  const row = pl as unknown as PLRow;
  const mt = row.membership_type || undefined;
  const en = row.event_name || undefined;
  const et = row.event_type || undefined;
  const legacyKey = buildLegacyKey(mt, en);
  const v2Key = buildV2Key(et, en);
  let passId = mapping[v2Key] ?? mapping[legacyKey];
      // Apply same NONMAHE override during backfill if raw.user_type indicates Non-MAHE and pass is Proshow
      if (passId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ut = getNormalizedUserTypeFromDoc((pl as any)?.raw);
          if (ut === 'nonmahe') {
            const meta = await getPassMeta(service, passId);
            if (meta && meta.event_id == null) {
              const nonMaheId = await getNonMaheProshowPassId(service);
              if (nonMaheId) passId = nonMaheId;
              // Also cleanup any stray MAHE proshow already assigned
              const stray = await service
                .from('User_passes')
                .select('id, passes:passId(mahe, event_id)')
                .eq('userId', userId);
              if (!stray.error && Array.isArray(stray.data)) {
                for (const s of stray.data as Array<{ id: string; passes?: { mahe?: boolean | null; event_id?: string | null } }>) {
                  const p = s.passes;
                  if (p && p.event_id == null && p.mahe === true) {
                    await service.from('User_passes').delete().eq('id', s.id);
                  }
                }
              }
            }
          }
        } catch {/* ignore override errors */}
      }
      if (!passId) continue; // still unmapped
      // Skip backfill auto-grant if proshow already consumed for this phone by another user
      let isProshowLike2 = false;
      try {
        const meta2 = await getPassMeta(service, passId);
        if (meta2 && meta2.event_id == null) isProshowLike2 = true;
      } catch {/* ignore */}
      if (isProshowLike2 && phoneProshowConsumed && phoneProshowOwnedBy && phoneProshowOwnedBy !== userId) {
        continue;
      }
      if (granted.has(passId)) continue; // already ensured
      const manualBackfill = async () => {
        const existing = await service.from('User_passes').select('passId').eq('userId', userId).eq('passId', passId).maybeSingle();
        if (!existing.error && existing.data) { granted.add(passId); return; }
        const baseRow: Record<string, unknown> = { userId, passId };
        if (SUPPORTS_SOURCE_COLUMNS) {
          baseRow.source_tracking_id = pl.tracking_id || pl.order_id;
          baseRow.source_order_id = pl.order_id;
          baseRow.source_payment_log_id = pl.id;
        }
        if (REQUIRE_QR_TOKEN) baseRow.qr_token = generateQrToken();
        let ins = await service.from('User_passes').insert(baseRow).select('passId').maybeSingle();
        if (ins.error && /qr_token/i.test(ins.error.message)) {
          REQUIRE_QR_TOKEN = false;
          delete (baseRow as any).qr_token; // eslint-disable-line @typescript-eslint/no-explicit-any
          ins = await service.from('User_passes').insert(baseRow).select('passId').maybeSingle();
        }
        if (ins.error) { if (opts?.debug) debug.push(`manual_backfill_error_passId=${passId} msg=${ins.error.message}`); }
        else if (ins.data) granted.add(passId);
      };
      if (SUPPORTS_UPSERT) {
        try {
          let up2;
          if (SUPPORTS_SOURCE_COLUMNS) {
            const row: Record<string, unknown> = {
              userId, passId,
              source_tracking_id: pl.tracking_id || pl.order_id,
              source_order_id: pl.order_id,
              source_payment_log_id: pl.id,
            };
            if (REQUIRE_QR_TOKEN) row.qr_token = generateQrToken();
            up2 = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            if (up2.error && /qr_token/i.test(up2.error.message)) {
              REQUIRE_QR_TOKEN = false;
              delete row.qr_token;
              up2 = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            }
            if (up2.error && /source_(tracking_id|order_id|payment_log_id)/i.test(up2.error.message)) {
              SUPPORTS_SOURCE_COLUMNS = false;
            }
          }
          if (!SUPPORTS_SOURCE_COLUMNS) {
            const row: Record<string, unknown> = { userId, passId };
            if (REQUIRE_QR_TOKEN) row.qr_token = generateQrToken();
            up2 = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            if (up2.error && /qr_token/i.test(up2.error.message)) {
              REQUIRE_QR_TOKEN = false;
              delete row.qr_token;
              up2 = await service.from('User_passes').upsert(row, { onConflict: 'userId,passId', ignoreDuplicates: true }).select('passId').maybeSingle();
            }
          }
          if (up2 && up2.error) {
            if (opts?.debug) debug.push(`backfill_upsert_error_passId=${passId} msg=${up2.error.message}`);
            if (/no unique or exclusion constraint/i.test(up2.error.message)) {
              SUPPORTS_UPSERT = false;
              await manualBackfill();
            }
          } else if (up2 && !up2.error) {
            granted.add(passId);
            if (isProshowLike2 && !phoneProshowConsumed) { phoneProshowConsumed = true; phoneProshowOwnedBy = userId; }
          }
        } catch (e) {
          if (opts?.debug) debug.push(`backfill_upsert_exception_passId=${passId} msg=${(e as Error).message}`);
          SUPPORTS_UPSERT = false;
          await manualBackfill();
        }
      } else {
        await manualBackfill();
      }
    }
  }

  // Auto-grant esports bundle pass if a mahe=true bundle pass was newly granted.
  // Rationale: Portal API now includes esports within the main (mahe=true) bundle, but our access model
  // separates esports into a distinct bundle (mahe=false). To keep UI and logic consistent, we ensure
  // the user also owns the esports bundle when they receive the main bundle.
  try {
    // Only proceed if any newly granted pass exists.
    if (granted.size > 0) {
      const newlyGrantedIds = Array.from(granted);
      const metaQ = await service
        .from('passes')
        .select('id, mahe, event_id')
        .in('id', newlyGrantedIds);
      if (!metaQ.error && Array.isArray(metaQ.data)) {
        const grantedHasMaheTrue = metaQ.data.some(p => p && p.mahe === true && p.event_id == null);
        if (grantedHasMaheTrue) {
          // Check if user already has an esports bundle (mahe=false, event_id null)
          const existingEsports = await service
            .from('User_passes')
            .select('passId, passes:passId(mahe, event_id)')
            .eq('userId', userId);
          let hasEsportsBundle = false;
            if (!existingEsports.error && Array.isArray(existingEsports.data)) {
              interface ExistingRow { passes?: { mahe?: boolean | null; event_id?: string | null } }
              for (const r of existingEsports.data as ExistingRow[]) {
                const p = r.passes;
                if (p && p.mahe === false && p.event_id == null) { hasEsportsBundle = true; break; }
              }
            }
          if (!hasEsportsBundle) {
            // Resolve esports bundle pass id. Prefer env override.
            let esportsBundlePassId: string | null = process.env.ESPORTS_BUNDLE_PASS_ID || null;
            if (!esportsBundlePassId) {
              const findQ = await service
                .from('passes')
                .select('id')
                .eq('mahe', false)
                .is('event_id', null)
                .limit(1)
                .maybeSingle();
              if (!findQ.error && findQ.data) esportsBundlePassId = findQ.data.id as string;
            }
            if (esportsBundlePassId) {
              // Grant esports bundle using existing capability flags.
              const baseRow: Record<string, unknown> = { userId, passId: esportsBundlePassId };
              if (SUPPORTS_SOURCE_COLUMNS) {
                // We don't have a distinct payment log for this synthetic grant; leave provenance empty or clone one of last logs if desired.
              }
              if (REQUIRE_QR_TOKEN) baseRow.qr_token = generateQrToken();
              let grant = await service.from('User_passes').insert(baseRow).select('passId').maybeSingle();
              if (grant.error && /qr_token/i.test(grant.error.message)) {
                REQUIRE_QR_TOKEN = false;
                delete (baseRow as any).qr_token; // eslint-disable-line @typescript-eslint/no-explicit-any
                grant = await service.from('User_passes').insert(baseRow).select('passId').maybeSingle();
              }
              if (!grant.error && grant.data) {
                granted.add(esportsBundlePassId);
                if (opts?.debug) debug.push(`auto_granted_esports_bundle=${esportsBundlePassId}`);
              } else if (grant.error && opts?.debug) {
                debug.push(`auto_grant_esports_error=${grant.error.message}`);
              }
            } else if (opts?.debug) {
              debug.push('esports_bundle_pass_not_found');
            }
          }
        }
      }
    }
  } catch (e) {
    if (opts?.debug) debug.push(`auto_grant_esports_exception=${(e as Error).message}`);
  }

  // Update last_ingested_at (store on users table for cooldown logic)
  const stamp = { last_ingested_at: new Date().toISOString() };
  try { await service.from('users').update(stamp).eq('id', userId); } catch {/* ignore */}
  try { await service.from('Users').update(stamp).eq('id', userId); } catch {/* ignore */}
  const finalRes = await listUserPassesAndPending(userId);
  if (opts?.debug && finalRes.ok && finalRes.data) {
    finalRes.data.debug = debug;
  }
  return finalRes;
}

// Internal helper: list passes then compute pending unmapped logs.
export async function listUserPassesAndPending(userId: string): Promise<FetchResult> {
  const service = createServiceClient();
  // 1. Owned passes (attempt with source_* first if supported)
  let passes: UserPassDTO[] = [];
  if (SUPPORTS_SOURCE_COLUMNS) {
    const passesQ = await service
      .from('User_passes')
      .select('passId, created_at, source_tracking_id, passes:passId(pass_name, event_id)')
      .eq('userId', userId);
    if (passesQ.error && /source_tracking_id/i.test(passesQ.error.message)) {
      SUPPORTS_SOURCE_COLUMNS = false; // downgrade capability
    } else if (passesQ.error) {
      return { ok:false, error: passesQ.error.message };
    } else {
      passes = passesQ.data as UserPassDTO[];
    }
  }
  if (!SUPPORTS_SOURCE_COLUMNS) {
    const minimalQ = await service
      .from('User_passes')
      .select('passId, created_at, passes:passId(pass_name, event_id)')
      .eq('userId', userId);
    if (minimalQ.error) return { ok:false, error: minimalQ.error.message };
    passes = minimalQ.data as UserPassDTO[];
  }
  // Build quick set for passId presence
  const ownedPassIds = new Set(passes.map(p=>p.passId));

  // 2. Active mapping cache (may include v2 keys)
  const mapping = await loadMapping(service);

  // 3. All successful payment logs for user
  const plRes = await service
    .from('payment_logs')
    .select('tracking_id, order_id, membership_type, event_name, event_type')
    .eq('user_id', userId)
    .eq('status', 'Success');
  const pending: PendingMappingDTO[] = [];
  if (!plRes.error && plRes.data) {
    for (const pl of plRes.data) {
  interface PLRow2 { membership_type?: string | null; event_name?: string | null; event_type?: string | null; tracking_id?: string | null; order_id?: string | null }
  const row2 = pl as unknown as PLRow2;
  const mt2 = row2.membership_type || undefined;
  const en2 = row2.event_name || undefined;
  const et2 = row2.event_type || undefined;
  const legacyKey = buildLegacyKey(mt2, en2);
  const v2Key = buildV2Key(et2, en2);
  const ek = et2 ? v2Key : legacyKey; // only use v2 format if event_type actually present
  const passId = mapping[v2Key] ?? mapping[legacyKey];
      // Pending mapping if mapping missing OR mapping exists but pass_id null
      if (passId == null) {
        pending.push({
          tracking_id: pl.tracking_id || pl.order_id,
          membership_type: pl.membership_type,
          event_name: pl.event_name,
          external_key: ek,
        });
      } else if (!ownedPassIds.has(passId)) {
        // Edge case: mapping exists but ownership not yet added (should be rare after backfill)
        pending.push({
          tracking_id: pl.tracking_id || pl.order_id,
          membership_type: pl.membership_type,
          event_name: pl.event_name,
          external_key: ek + ' (ownership-pending)',
        });
      }
    }
  }
  return { ok:true, data: { passes, pending } };
}

// Optional helper to force re-sync from client (client calls API route /api/payments/sync)
export async function forceSyncPayments(opts?: { devUserId?: string; debug?: boolean }) {
  // With cooldown removed, force path identical to normal ingestion.
  return ingestAndListUserPasses(opts);
}

// (Legacy) Preserve old name if external callers expected listUserPasses
export const listUserPasses = listUserPassesAndPending; // alias
