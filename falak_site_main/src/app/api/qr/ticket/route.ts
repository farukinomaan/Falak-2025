import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getServiceClient } from "@/lib/actions/supabaseClient";

// Secrets:
// 1. ADMIN_QR_JWT_SECRET (or OTP_JWT_SECRET fallback) validates the original upstream JWT passed from the external scanner auth source.
// 2. ADMIN_QR_SESSION_SECRET signs/validates short-lived session tokens we issue at /verify_admin.
function getSessionSecret() {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET missing");
  return new TextEncoder().encode(secret);
}
function getAudience() {
  const aud = process.env.GOOGLE_CLIENT_ID || process.env.ADMIN_QR_GOOGLE_CLIENT_ID;
  if (!aud) throw new Error("GOOGLE_CLIENT_ID (or ADMIN_QR_GOOGLE_CLIENT_ID) missing");
  return aud;
}

async function authenticate(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return { ok: false as const, status: 401, error: "Missing Authorization header" };
  const parts = auth.split(/\s+/);
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return { ok: false as const, status: 401, error: "Missing token" };
  try {
    // Only accept our issued session token
    const res = await jwtVerify(token, getSessionSecret(), { audience: getAudience(), issuer: 'falak-qr' });
    const payload = res.payload as Record<string, unknown>;
    if (!payload || payload['t'] !== 'qr_session') {
      return { ok: false as const, status: 401, error: 'Invalid token type' };
    }
    const phone = typeof payload?.phone === 'string' ? String(payload.phone) : undefined;
    const username = typeof payload?.username === 'string' ? String(payload.username) : undefined;
    const name = typeof payload?.name === 'string' ? String(payload.name) : undefined;
    if (!phone && !username) return { ok: false as const, status: 401, error: 'Token missing admin identity' };

    // Optional: verify admin still exists in ticket_admin_list (revocation safety)
    const supabase = getServiceClient();
    type AdminRow = { username: string | null; phone: string | null; name: string | null; };
    let adminRow: AdminRow | null = null;
    if (phone) {
      const { data, error } = await supabase
        .from('ticket_admin_list')
        .select('username, phone, name')
        .eq('phone', phone)
        .limit(1);
      if (error) return { ok: false as const, status: 500, error: error.message };
      if (Array.isArray(data) && data.length) adminRow = data[0] as AdminRow;
    }
    if (!adminRow && username) {
      const { data, error } = await supabase
        .from('ticket_admin_list')
        .select('username, phone, name')
        .eq('username', username)
        .limit(1);
      if (error) return { ok: false as const, status: 500, error: error.message };
      if (Array.isArray(data) && data.length) adminRow = data[0] as AdminRow;
    }
    if (!adminRow) return { ok: false as const, status: 401, error: 'Unauthenticated' };

    return {
      ok: true as const,
      admin: {
        phone: adminRow?.phone ?? phone ?? null,
        username: adminRow?.username ?? username ?? null,
        name: adminRow?.name ?? name ?? null
      },
    };
  } catch {
    return { ok: false as const, status: 401, error: 'Invalid token' };
  }
}

// GET: ?userId=uuid => return user data + passes with ticket_cut info
export async function GET(req: NextRequest) {
  try {
    const authRes = await authenticate(req);
    if (!authRes.ok) return NextResponse.json({ ok: false, error: authRes.error }, { status: authRes.status });
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ ok: false, error: 'userId param required' }, { status: 400 });
    const supabase = getServiceClient();
    // Fetch user
    const { data: userRow, error: userErr } = await supabase
      .from('Users')
      .select('id, name, email, phone, reg_no, mahe')
      .eq('id', userId)
      .maybeSingle();
    if (userErr) return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
    if (!userRow) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    // Fetch passes the user owns along with ticket_cut fields
    const { data: userPasses, error: upErr } = await supabase
      .from('User_passes')
      .select('id, passId, ticket_cut, ticket_cut_by, ticket_cut_at, created_at, pass:Pass(id, pass_name, event_id, mahe)')
      .eq('userId', userId);
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, admin: authRes.admin, user: userRow, passes: userPasses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST: ?userId=uuid&passId=uuid => mark ticket_cut true
// Body optional; we rely on query to keep integration simple for scanner app.
export async function POST(req: NextRequest) {
  try {
    const authRes = await authenticate(req);
    if (!authRes.ok) return NextResponse.json({ ok: false, error: authRes.error }, { status: authRes.status });
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    let passId = searchParams.get('passId');
    if (!userId) return NextResponse.json({ ok: false, error: 'userId param required' }, { status: 400 });
    const supabase = getServiceClient();
    // If passId not provided, auto-select the user's Proshow pass (Pass.event_id IS NULL)
    let existingId: string | null = null;
    if (!passId) {
      const { data: ups, error: upsErr } = await supabase
        .from('User_passes')
        .select('id, passId, pass:Pass(id, event_id, pass_name)')
        .eq('userId', userId);
      if (upsErr) return NextResponse.json({ ok: false, error: upsErr.message }, { status: 500 });
      type UP = { id: string; passId: string; pass: { id: string; event_id: string | null } | null };
      const list = (ups || []) as unknown as UP[];
      const proshow = list.find((p) => !p.pass || p.pass.event_id == null);
      if (!proshow) return NextResponse.json({ ok: false, error: 'No Proshow pass found for user' }, { status: 404 });
      passId = proshow.passId as string;
      existingId = proshow.id as string;
    }
    // Ensure the record exists (if not fetched yet)
    if (!existingId) {
      const { data: existing, error: existingErr } = await supabase
        .from('User_passes')
        .select('id, ticket_cut, ticket_cut_by, ticket_cut_at')
        .eq('userId', userId)
        .eq('passId', passId)
        .maybeSingle();
      if (existingErr) return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
      if (!existing) return NextResponse.json({ ok: false, error: 'Pass not owned by user' }, { status: 404 });
      existingId = existing.id as string;
      if (existing.ticket_cut) {
        // Already cut – idempotent response
        return NextResponse.json({ ok: true, already: true, ticket_cut: true, ticket_cut_by: existing.ticket_cut_by || authRes.admin?.phone || null, ticket_cut_at: existing.ticket_cut_at || null });
      }
    } else {
      // We only know the id; fetch current status to maintain idempotency
      const { data: existing, error: existingErr } = await supabase
        .from('User_passes')
        .select('id, ticket_cut, ticket_cut_by, ticket_cut_at')
        .eq('id', existingId)
        .maybeSingle();
      if (existingErr) return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
      if (existing?.ticket_cut) {
        return NextResponse.json({ ok: true, already: true, ticket_cut: true, ticket_cut_by: existing.ticket_cut_by || authRes.admin?.phone || null, ticket_cut_at: existing.ticket_cut_at || null });
      }
    }
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('User_passes')
      .update({ ticket_cut: true, ticket_cut_by: authRes.admin?.phone || null, ticket_cut_at: nowIso })
      .eq('id', existingId as string);
    if (updateErr) return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, ticket_cut: true, ticket_cut_by: authRes.admin?.phone || null, ticket_cut_at: nowIso });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; // always fresh for scanning