import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { __clearMappingCache } from '@/lib/actions/payments';

interface SeedBody { membership_type?: string; event_name?: string; event_type?: string; pass_name?: string }

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

// POST body: { membership_type?, event_type?, event_name, pass_name }
// Creates or updates an external_pass_map row.
// Legacy key: membership_type|event_name  (stored in external_key)
// V2 key:     event_type|event_name       (stored in external_key_v2)
// You may supply both during migration for dual resolution.
export async function POST(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  let body: SeedBody = {};
  try { body = await req.json() as SeedBody; } catch {}
  const { membership_type, event_name, pass_name, event_type } = body;
  if (!event_name || !pass_name || (!membership_type && !event_type)) {
    return NextResponse.json({ ok: false, error: 'missing fields (need event_name, pass_name, and at least one of membership_type or event_type)' }, { status: 400 });
  }
  const external_key = membership_type ? `${String(membership_type).trim().toLowerCase()}|${String(event_name).trim().toLowerCase()}` : null;
  const external_key_v2 = event_type ? `${String(event_type).trim().toLowerCase()}|${String(event_name).trim().toLowerCase()}` : null;
  const supabase = createServiceClient();
  // Find pass id
  const pass = await supabase.from('Pass').select('id, pass_name').ilike('pass_name', pass_name).maybeSingle();
  if (pass.error || !pass.data) return NextResponse.json({ ok: false, error: 'pass_not_found' }, { status: 404 });
  // Try including v2 column first, fallback if it doesn't exist yet.
  let supportsV2 = true;
  let payload: Record<string, unknown> = { pass_id: pass.data.id, active: true };
  if (external_key) payload.external_key = external_key;
  if (external_key_v2) payload.external_key_v2 = external_key_v2;
  let ins = await supabase.from('external_pass_map').upsert(payload, { onConflict: 'external_key' }).select('id, external_key, external_key_v2, pass_id').maybeSingle();
  if (ins.error && /external_key_v2/i.test(ins.error.message)) {
    supportsV2 = false;
    // Retry without v2
    payload = { pass_id: pass.data.id, active: true };
    if (external_key) payload.external_key = external_key;
    ins = await supabase.from('external_pass_map').upsert(payload, { onConflict: 'external_key' }).select('id, external_key, pass_id').maybeSingle();
  }
  if (ins.error || !ins.data) return NextResponse.json({ ok: false, error: ins.error?.message || 'insert_failed' }, { status: 500 });
  // Invalidate mapping cache so new mapping is immediately picked up
  try { __clearMappingCache(); } catch { /* ignore */ }
  return NextResponse.json({ ok: true, data: { ...ins.data, supportsV2Attempted: supportsV2, cacheInvalidated: true } });
}

export const revalidate = 0;