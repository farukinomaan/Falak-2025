import { NextRequest, NextResponse } from 'next/server';
import { __clearMappingCache } from '@/lib/actions/payments';
import { checkDevHeader } from '../guard';

function denyProd() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 });
  }
  return null;
}

// POST /api/dev/payments/cache -> clear mapping cache
export async function POST(req: NextRequest) {
  const deny = denyProd(); if (deny) return deny;
  const headerFail = checkDevHeader(req); if (headerFail) return headerFail;
  try { __clearMappingCache(); } catch {}
  return NextResponse.json({ ok: true, cacheCleared: true });
}

export const revalidate = 0;
