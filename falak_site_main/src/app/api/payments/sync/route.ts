import { NextRequest, NextResponse } from 'next/server';
import { ingestAndListUserPasses } from '@/lib/actions/payments';

export async function POST(req: NextRequest) {
  // In production rely on authenticated session only.
  // In non-production allow ?devUserId=... to target a specific user for testing.
  let result;
  if (process.env.NODE_ENV !== 'production') {
    const devUserId = req.nextUrl.searchParams.get('devUserId') || undefined;
    result = await ingestAndListUserPasses({ devUserId });
  } else {
    result = await ingestAndListUserPasses();
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export const revalidate = 0;
