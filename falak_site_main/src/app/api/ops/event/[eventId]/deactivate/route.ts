import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRoleForEmail, opsDeactivateEvent } from '@/lib/actions/adminAggregations';

// Using 'any' for context to avoid Next.js ParamCheck type mismatch issues
export async function POST(_req: Request, context: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const params = await context.params;
  const eventId: string = (params as { eventId: string }).eventId;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (role !== 'ops_admin' && role !== 'super_admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const res = await opsDeactivateEvent(eventId);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
