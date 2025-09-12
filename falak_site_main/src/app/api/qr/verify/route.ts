import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Simple QR verification endpoint.
// Security model:
// - qr_token is an unguessable UUID (128-bit). Exposure via printed QR is intentional.
// - This endpoint is read-only: returns pass + basic ownership metadata.
// - No mutation, so an owner scanning repeatedly is harmless.
// - Optional: add rate limiting or staff auth for enriched details (left minimal now).
// - If future risk of enumeration appears, enforce token length/format & early reject.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim();
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  if (token.length < 20) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 });

  try {
    const service = createServiceClient();
    // Look up pass by qr_token (case sensitive).
    const passQ = await service
      .from('User_passes')
      .select('userId, passId, created_at, passes:passId(pass_name, event_id, mahe)')
      .eq('qr_token', token)
      .limit(1)
      .maybeSingle();

    if (passQ.error) {
      return NextResponse.json({ ok: false, error: passQ.error.message }, { status: 500 });
    }
    if (!passQ.data) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    // Minimal response (avoid leaking user PII). If staff scanning needs user info, extend with guarded auth.
    // Supabase may return relation as object or array depending on schema; normalize.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passMetaRaw: any = passQ.data.passes;
    const passMeta = Array.isArray(passMetaRaw) ? passMetaRaw[0] : passMetaRaw;
    return NextResponse.json({ ok: true, data: {
      passId: passQ.data.passId,
      pass_name: passMeta?.pass_name,
      event_id: passMeta?.event_id,
      mahe: passMeta?.mahe,
      created_at: passQ.data.created_at,
    }});
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
