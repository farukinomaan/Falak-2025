import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT, createRemoteJWKSet } from 'jose';
import { getServiceClient } from '@/lib/actions/supabaseClient';

function getSessionSecret() {
  const secret = process.env.ADMIN_QR_SESSION_SECRET || process.env.ADMIN_QR_JWT_SECRET || process.env.OTP_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_QR_SESSION_SECRET (or fallback) missing');
  // session token uses HS256 in this route, so Uint8Array is fine
  return new TextEncoder().encode(secret);
}

async function verifyUpstreamToken(raw: string) {
  // Verify as a Google ID token using Google's JWKS
  const googleClientId = process.env.ADMIN_QR_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) throw new Error('ADMIN_QR_GOOGLE_CLIENT_ID (or GOOGLE_CLIENT_ID) must be set');
  const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
  const { payload } = await jwtVerify(raw, jwks, { audience: googleClientId });
  const email = typeof payload.email === 'string' ? payload.email : (typeof payload.sub === 'string' ? payload.sub : undefined);
  if (!email) throw new Error('Token missing email');
  return email;
}

async function lookupAdmin(email: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('Admin_roles')
    .select('email, role')
    .eq('email', email)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || !data.length) throw new Error('Unauthenticated');
  return data[0].role as string | null;
}

async function issueSession(email: string, role: string | null) {
  // Short-lived (e.g., 30 minutes) session token
  return await new SignJWT({ t: 'qr_session', email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getSessionSecret());
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth) return NextResponse.json({ ok: false, error: 'Missing Authorization header' }, { status: 401 });
    const parts = auth.split(/\s+/);
    const upstreamToken = parts.length === 2 ? parts[1] : parts[0];
    if (!upstreamToken) return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 401 });
    let email: string;
    try {
      email = await verifyUpstreamToken(upstreamToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'invalid_token';
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    let role: string | null;
    try {
      role = await lookupAdmin(email);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unauthenticated';
      return NextResponse.json({ ok: false, error: msg }, { status: msg === 'Unauthenticated' ? 401 : 500 });
    }
    const sessionToken = await issueSession(email, role);
    return NextResponse.json({ ok: true, email, role, sessionToken, expiresIn: 1800 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
