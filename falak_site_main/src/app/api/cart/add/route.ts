import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { addToCart } from "@/lib/actions/tables/cart";
import { getServiceClient } from "@/lib/actions/supabaseClient";
import { z } from "zod";
import { uuid } from "@/lib/actions/schemas";

const BodySchema = z.object({ passId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  const user = await getUserByEmail(email);
  const userId = user.ok ? user.data?.id : undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "User not found" }, { status: 400 });

  // Accept either a Pass.id or an Events.id (resolve event -> pass)
  let passId = parsed.data.passId;
  try {
    const supabase = getServiceClient();
    const { data: passDirect } = await supabase.from("Pass").select("id").eq("id", passId).maybeSingle();
    if (!passDirect) {
      const { data: passByEvent } = await supabase
        .from("Pass")
        .select("id")
        .eq("event_id", passId)
        .limit(1)
        .maybeSingle();
      if (passByEvent?.id) passId = String(passByEvent.id);
      else return NextResponse.json({ ok: false, error: "Pass not found for given id" }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Service client error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  // Validate resolved passId looks like UUID before insert
  const finalId = uuid.safeParse(passId).success ? passId : "";
  if (!finalId) return NextResponse.json({ ok: false, error: "Invalid pass id" }, { status: 400 });
  const res = await addToCart({ userId, pass_id: finalId });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: res.data ?? null });
}
