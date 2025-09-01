import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saCreateTeamWithMembers } from "@/lib/actions/adminAggregations";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { eventId, captainId, name, memberIds } = body || {};
    // Basic server-side validation
    if (!eventId || !captainId || !name || !Array.isArray(memberIds)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    if (captainId !== (session.user as { id?: string }).id) {
      return NextResponse.json({ ok: false, error: "Captain mismatch" }, { status: 403 });
    }
    const created = await saCreateTeamWithMembers({ eventId, captainId, name, memberIds });
    if (!created.ok) return NextResponse.json(created, { status: 400 });
    return NextResponse.json(created);
  } catch (e) {
    console.error("Team create error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}