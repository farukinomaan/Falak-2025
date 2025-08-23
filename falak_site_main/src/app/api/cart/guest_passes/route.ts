// NOTE: This is the only remaining cart-related API. All legacy DB cart endpoints
// (add, count, merge, validate_ownership) and server actions have been removed
// after migrating to a purely client-side (localStorage) cart. This endpoint
// simply resolves a list of ids (which may be pass ids OR event ids) to Pass rows.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/actions/supabaseClient";

const QuerySchema = z.object({ ids: z.string().optional() });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") || undefined;
  const parsed = QuerySchema.safeParse({ ids: idsParam });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 });
  const ids = (parsed.data.ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ ok: true, data: [] });
  try {
    const supabase = getServiceClient();
    const { data: byId, error: e1 } = await supabase
      .from("Pass")
      .select("id, pass_name, description, cost")
      .in("id", ids);
    if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 400 });
  const { data: byEvent, error: e2 } = await supabase
      .from("Pass")
      .select("id, pass_name, description, cost")
      .in("event_id", ids);
    if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 400 });
  type Row = { id: string; pass_name: string; description: string | null; cost: number | string | null };
  const combined: Row[] = ([...(byId || []), ...(byEvent || [])] as Row[]);
  // de-dupe by id
  const map = new Map<string, Row>();
  for (const row of combined) map.set(row.id, row);
  return NextResponse.json({ ok: true, data: Array.from(map.values()) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
