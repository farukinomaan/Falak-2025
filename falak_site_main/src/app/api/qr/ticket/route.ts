import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getServiceClient } from "@/lib/actions/supabaseClient";

// Env var: ADMIN_QR_JWT_SECRET (can reuse OTP_JWT_SECRET if you prefer; using dedicated for separation)
function getSecret() {
  const secret = process.env.ADMIN_QR_JWT_SECRET || process.env.OTP_JWT_SECRET; // fallback
  if (!secret) throw new Error("ADMIN_QR_JWT_SECRET (or OTP_JWT_SECRET) missing");
  return new TextEncoder().encode(secret);
}

async function authenticate(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return { ok: false as const, status: 401, error: "Missing Authorization header" };
  const parts = auth.split(/\s+/);
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return { ok: false as const, status: 401, error: "Missing token" };
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = typeof payload.email === 'string' ? payload.email : (typeof payload.sub === 'string' ? payload.sub : undefined);
    if (!email) return { ok: false as const, status: 401, error: "Token missing email" };
    const supabase = getServiceClient();
    const { data: roleRows, error: roleErr } = await supabase
      .from('Admin_roles')
      .select('email, role')
      .eq('email', email)
      .limit(1);
    if (roleErr) return { ok: false as const, status: 500, error: roleErr.message };
    if (!Array.isArray(roleRows) || !roleRows.length) return { ok: false as const, status: 401, error: 'Unauthenticated' };
    return { ok: true as const, email, role: roleRows[0].role as string | null };
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
      .select('id, passId, ticket_cut, ticket_cut_by, created_at, pass:Pass(id, pass_name, event_id, mahe)')
      .eq('userId', userId);
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, admin_email: authRes.email, user: userRow, passes: userPasses });
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
    const passId = searchParams.get('passId');
    if (!userId) return NextResponse.json({ ok: false, error: 'userId param required' }, { status: 400 });
    if (!passId) return NextResponse.json({ ok: false, error: 'passId param required' }, { status: 400 });
    const supabase = getServiceClient();
    // Ensure the record exists
    const { data: existing, error: existingErr } = await supabase
      .from('User_passes')
      .select('id, ticket_cut, ticket_cut_by')
      .eq('userId', userId)
      .eq('passId', passId)
      .maybeSingle();
    if (existingErr) return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ ok: false, error: 'Pass not owned by user' }, { status: 404 });
    if (existing.ticket_cut) {
      // Already cut – idempotent response
      return NextResponse.json({ ok: true, already: true, ticket_cut: true, ticket_cut_by: existing.ticket_cut_by || authRes.email });
    }
    const { error: updateErr } = await supabase
      .from('User_passes')
      .update({ ticket_cut: true, ticket_cut_by: authRes.email })
      .eq('id', existing.id);
    if (updateErr) return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, ticket_cut: true, ticket_cut_by: authRes.email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; // always fresh for scanning