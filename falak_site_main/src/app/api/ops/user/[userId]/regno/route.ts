import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { opsUpdateUserRegNo, getRoleForEmail } from '@/lib/actions/adminAggregations';

export async function POST(req: Request, context: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { params } = context as { params: { userId: string } };
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const roleRes = await getRoleForEmail(email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (role !== 'ops_admin' && role !== 'super_admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const reg_no = (body?.reg_no || '').trim();
  const res = await opsUpdateUserRegNo(params.userId, reg_no);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
