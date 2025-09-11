import { NextRequest, NextResponse } from 'next/server';
import { getMyAccessibleEventIds } from '@/lib/actions/access';

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('force') === '1' || req.nextUrl.searchParams.get('force') === 'true';
  const res = await getMyAccessibleEventIds(force);
  return NextResponse.json(res, { status: res.ok ? 200 : 401 });
}

export const revalidate = 0;
