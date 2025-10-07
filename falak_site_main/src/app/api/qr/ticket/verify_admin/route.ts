import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getServiceClient } from '@/lib/actions/supabaseClient';

function getGoogleClientSecret() {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error('GOOGLE_CLIENT_SECRET missing');
  return new TextEncoder().encode(secret);
}
function getGoogleClientId() {
  const id = process.env.GOOGLE_CLIENT_ID || process.env.ADMIN_QR_GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID (or ADMIN_QR_GOOGLE_CLIENT_ID) missing');
  return id;
}
async function issueSession(payload: { phone?: string | null; username?: string | null; name?: string | null; role?: string | null }) {
  // Short-lived (e.g., 30 minutes) session token, signed with Google client secret and audience set to our Google client id
  return await new SignJWT({ t: 'qr_session', ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(getGoogleClientId())
    .setIssuer('falak-qr')
    .setExpirationTime('30m')
    .sign(getGoogleClientSecret());
}

export async function POST(req: NextRequest) {
  try {
    // Expect JSON body with credentials, e.g., { username, password, phone, name }
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    if (!username && !phone) return NextResponse.json({ ok: false, error: 'username_or_phone_required' }, { status: 400 });
    if (!password) return NextResponse.json({ ok: false, error: 'password_required' }, { status: 400 });

    const supabase = getServiceClient();
    // Lookup in ticket_admin_list by username OR phone
    let q = supabase.from('ticket_admin_list').select('id, username, phone, name, password').limit(1);
    if (username) q = q.eq('username', username);
    else if (phone) q = q.eq('phone', phone);
    const { data, error } = await q.maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    const row = data as { id: string; username?: string | null; phone?: string | null; name?: string | null; password?: string | null; role?: string | null };
    // NOTE: Plain-text compare. Replace with hashing if passwords are hashed.
    if ((row.password || '') !== password) return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });

  const payload = { username: row.username || null, phone: row.phone || null, name: row.name || null };
    const sessionToken = await issueSession(payload);
    return NextResponse.json({ ok: true, ...payload, sessionToken, expiresIn: 1800 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
