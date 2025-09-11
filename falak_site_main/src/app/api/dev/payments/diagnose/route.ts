import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { checkDevHeader } from '../guard';

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

const ACCEPTED = new Set([
  'success','paid','completed','successfull','successfull payment','successfull_payment'
]);

async function fetchRemote(phone: string) {
  const ACCESS_KEY = process.env.ACCESSKEY;
  const ACCESS_TOKEN = process.env.ACCESSTOKEN;
  const PAYMENT_ENDPOINT = process.env.VERIFICATION_URL || 'https://api.manipal.edu/api/v1/falak-single-payment-log';
  if (!ACCESS_KEY || !ACCESS_TOKEN) {
    return { ok:false, error:'missing_keys' };
  }
  try {
    const url = `${PAYMENT_ENDPOINT}?mobile=${encodeURIComponent(phone)}`;
    const r = await fetch(url, { headers:{ accept:'application/json', accesskey: ACCESS_KEY, accesstoken: ACCESS_TOKEN }, cache:'no-store' });
    if (!r.ok) return { ok:false, error:`remote_status_${r.status}` };
    const j = await r.json();
    const docs = Array.isArray(j?.data?.docs) ? j.data.docs : [];
    return { ok:true, docs };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_fetch_error';
    return { ok:false, error: msg };
  }
}

export async function GET(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  const headerFail = checkDevHeader(req); if (headerFail) return headerFail;
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ ok:false, error:'missing userId' }, { status:400 });
  const svc = createServiceClient();

  let row: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let tableUsed = '';
  const lower = await svc.from('users').select('id, phone').eq('id', userId).maybeSingle();
  if (!lower.error && lower.data) { row = lower.data; tableUsed = 'users'; }
  if (!row) {
    const upper = await svc.from('Users').select('id, phone').eq('id', userId).maybeSingle();
    if (!upper.error && upper.data) { row = upper.data; tableUsed = 'Users'; }
  }
  if (!row) return NextResponse.json({ ok:true, data:{ userFound:false } });
  const phone = row.phone;
  if (!phone) return NextResponse.json({ ok:true, data:{ userFound:true, tableUsed, phone:null, reason:'user_phone_missing' } });

  const keysPresent = Boolean(process.env.ACCESSKEY && process.env.ACCESSTOKEN);
  if (!keysPresent) return NextResponse.json({ ok:true, data:{ userFound:true, tableUsed, phone, keysPresent:false, reason:'env_keys_missing' } });

  const remote = await fetchRemote(phone);
  if (!remote.ok) {
    return NextResponse.json({ ok:true, data:{ userFound:true, tableUsed, phone, keysPresent:true, remoteError: remote.error } });
  }
  const docs = remote.docs as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Load current active mappings to report resolution
  const mapRes = await svc.from('external_pass_map').select('external_key, external_key_v2, pass_id, active').eq('active', true);
  const map: Record<string, string | null> = {};
  if (!mapRes.error && mapRes.data) {
    for (const r of mapRes.data as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (r.external_key) map[r.external_key] = r.pass_id;
      if (r.external_key_v2) map[r.external_key_v2] = r.pass_id;
    }
  }
  const simplified = docs.slice(0, 10).map(d => {
    const mt = (d.membership_type||'').trim().toLowerCase();
    const en = (d.event_name||'').trim().toLowerCase();
    const et = (d.event_type||'').trim().toLowerCase();
    const legacyKey = mt + '|' + en;
    const v2Key = et + '|' + en;
    const resolved = map[v2Key] ?? map[legacyKey] ?? null;
    return {
      tracking_id: d.tracking_id || d.orderid,
      order_status: d.order_status,
      membership_type: d.membership_type,
      event_name: d.event_name,
      event_type: d.event_type,
      legacyKey,
      v2Key,
      mapped: Boolean(resolved),
      pass_id: resolved,
      created_at: d.created_at,
    };
  });
  const acceptedCount = docs.filter(d => ACCEPTED.has((d.order_status||'').toLowerCase())).length;
  return NextResponse.json({ ok:true, data:{ userFound:true, tableUsed, phone, keysPresent:true, remoteDocs: docs.length, acceptedCount, sample: simplified } });
}

export const revalidate = 0;