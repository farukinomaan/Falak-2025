import { NextResponse } from 'next/server';
import { saUpdateTeamWithMemberEmails } from '@/lib/actions/adminAggregations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string | null } } | null;
    const captainId = session?.user?.id;
    if (!captainId) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    const body = await req.json();
    const { teamId, eventId, name, memberEmails } = body as { teamId?: string; eventId?: string; name?: string; memberEmails?: string[] };
    if (!teamId || !eventId || !name || !Array.isArray(memberEmails)) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }
    const res = await saUpdateTeamWithMemberEmails({ teamId, eventId, captainId, name, memberEmails });
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  } catch (e) {
    console.error('update team error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
