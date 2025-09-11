import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

// GET /api/dev/payments/logs?userId=UUID  -> lists raw payment_logs (selected columns)
export async function GET(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ ok: false, error: 'missing userId' }, { status: 400 });
  const supabase = createServiceClient();
  const logs = await supabase
    .from('payment_logs')
    .select('id, tracking_id, order_id, status, membership_type, event_name, total_amount, external_created_at')
    .eq('user_id', userId)
    .order('external_created_at', { ascending: false });
  if (logs.error) return NextResponse.json({ ok: false, error: logs.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: logs.data });
}

export const revalidate = 0;