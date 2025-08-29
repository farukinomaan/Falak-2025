import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saCreateTeamWithMemberEmails } from "@/lib/actions/adminAggregations";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { eventId, name, memberEmails } = body || {};
    if (!eventId || !name || !Array.isArray(memberEmails)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
  const created = await saCreateTeamWithMemberEmails({ eventId, captainId: userId, name, memberEmails });
    if (!created.ok) return NextResponse.json(created, { status: 400 });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Team createWithEmails error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}