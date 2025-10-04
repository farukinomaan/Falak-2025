import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import { saCreateTeamWithMemberEmails } from "@/lib/actions/adminAggregations";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { eventId, name, memberEmails, captainEmail } = body || {};
    if (!eventId || !name || !Array.isArray(memberEmails)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getServiceClient();
    let captainId = userId;
    if (captainEmail) {
      const email = (captainEmail || '').trim().toLowerCase();
      const { data: u, error: uErr } = await supabase.from('Users').select('id, email').eq('email', email).maybeSingle();
      if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });
      if (!u) return NextResponse.json({ ok: false, error: 'captain_email_not_found' }, { status: 400 });
      captainId = (u as { id: string }).id;
    }

    const created = await saCreateTeamWithMemberEmails({ eventId, captainId, name, memberEmails });
    if (!created.ok) return NextResponse.json(created, { status: 400 });
    return NextResponse.json(created);
  } catch (e) {
    console.error('createWithEmailsAsCaptain error', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
