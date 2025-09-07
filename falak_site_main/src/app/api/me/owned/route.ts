import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { getServiceClient } from "@/lib/actions/supabaseClient";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: true, passIds: [], eventIds: [] });
    }
    const userRes = await getUserByEmail(email);
    if (!userRes.ok || !userRes.data?.id) {
      return NextResponse.json({ ok: true, passIds: [], eventIds: [] });
    }
    const userId = userRes.data.id as string;

    const supabase = getServiceClient();
    const ups = await supabase.from("User_passes").select("passId").eq("userId", userId);
    if (ups.error) {
      return NextResponse.json({ ok: false, error: ups.error.message }, { status: 400 });
    }
    const passIds = (ups.data || []).map((r: { passId: string }) => r.passId).filter(Boolean);
    if (passIds.length === 0) {
      return NextResponse.json({ ok: true, passIds: [], eventIds: [] });
    }
    const passRows = await supabase.from("Pass").select("id, event_id").in("id", passIds);
    if (passRows.error) {
      return NextResponse.json({ ok: false, error: passRows.error.message }, { status: 400 });
    }
    const eventIds = (passRows.data || [])
      .map((r: { event_id?: string | null }) => r.event_id)
      .filter((x: string | null | undefined): x is string => Boolean(x));
    return NextResponse.json({ ok: true, passIds, eventIds });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
