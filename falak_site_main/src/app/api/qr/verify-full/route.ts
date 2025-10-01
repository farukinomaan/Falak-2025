import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Extended QR verification endpoint for staff (scan_admin role) that returns enriched user + pass details.
// IMPORTANT: This endpoint should only be called from a server action / route guarded by the admin session.
// We keep it in /api/qr/verify-full separate from public minimal verify route to avoid accidental exposure.
// It expects the caller (client component) to already have an authenticated admin session; we re-check role server-side.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRoleForEmail } from '@/lib/actions/adminAggregations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim();
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  if (token.length < 20) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 });

  // AuthZ: require scan-capable admin role (reuse existing roles for now: ticket_admin, super_admin, ops_admin)
  // Session user shape: { user?: { email?: string } }
  const session = await getServerSession(authOptions) as { user?: { email?: string } } | null;
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const roleRes = await getRoleForEmail(email);
  if (!roleRes.ok || !roleRes.data) return NextResponse.json({ ok: false, error: 'no_role' }, { status: 403 });
  const role = roleRes.data;
  const ALLOWED = new Set(['ticket_admin','super_admin','ops_admin']);
  if (!ALLOWED.has(role)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  try {
    const service = createServiceClient();
    // Join user + pass meta. Some rows may have relation casing differences (passes vs Pass). We'll attempt both.
    // 1) Fetch user pass row by qr_token
    const upRes = await service
      .from('User_passes')
      .select('id, userId, passId, created_at, qr_token, passes:passId(pass_name, event_id, mahe)')
      .eq('qr_token', token)
      .limit(1)
      .maybeSingle();

    if (upRes.error) return NextResponse.json({ ok: false, error: upRes.error.message }, { status: 500 });
    if (!upRes.data) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

    const passMetaRaw: any = upRes.data.passes; // eslint-disable-line @typescript-eslint/no-explicit-any
    const passMeta = Array.isArray(passMetaRaw) ? passMetaRaw[0] : passMetaRaw;

    // Fetch user basic info
    const userRes = await service
      .from('Users')
      .select('id, name, phone, reg_no, mahe, institute')
      .eq('id', upRes.data.userId)
      .limit(1)
      .maybeSingle();
    if (userRes.error) return NextResponse.json({ ok: false, error: userRes.error.message }, { status: 500 });
    if (!userRes.data) return NextResponse.json({ ok: false, error: 'user_not_found' }, { status: 404 });

    return NextResponse.json({ ok: true, data: {
      userId: userRes.data.id,
      userName: userRes.data.name,
      userPhone: userRes.data.phone,
      userRegNo: userRes.data.reg_no,
      userMahe: !!userRes.data.mahe,
      userCollege: userRes.data.mahe ? 'MAHE BLR' : (userRes.data.institute || null),
      passId: upRes.data.passId,
      pass_name: passMeta?.pass_name ?? null,
      event_id: passMeta?.event_id ?? null,
      mahe_only: passMeta?.mahe ?? null,
      issued_at: upRes.data.created_at,
      qr_token: token,
      role,
    }});
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
