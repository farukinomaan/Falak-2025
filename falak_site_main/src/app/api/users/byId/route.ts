import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/actions/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || undefined;
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    const supabase = getServiceClient();
    const { data, error } = await supabase.from('Users').select('id, email, name').eq('id', userId).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: 'user_not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error('users.byId error', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
