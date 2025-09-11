import { NextRequest, NextResponse } from 'next/server';
import { ingestAndListUserPasses } from '@/lib/actions/payments';

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

// GET /api/dev/payments/run?userId=UUID&force=1
// Triggers real ingestion (no mock docs) for the specified user id using the devUserId fallback.
export async function GET(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ ok: false, error: 'missing userId' }, { status: 400 });
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const res = await ingestAndListUserPasses({ devUserId: userId, debug });
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

export const revalidate = 0;