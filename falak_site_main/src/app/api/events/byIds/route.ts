import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/actions/supabaseClient";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") || "";
  const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ ok: true, data: [] });
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("Events").select("id, name").in("id", ids);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}