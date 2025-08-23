import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { addManyToCart } from "@/lib/actions/tables/cart";
import { z } from "zod";

const BodySchema = z.object({ ids: z.array(z.string().min(1)).default([]) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json || {});
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  const user = await getUserByEmail(email);
  const userId = user.ok ? user.data?.id : undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "User not found" }, { status: 400 });

  const ids = Array.from(new Set((parsed.data.ids || []).filter(Boolean)));
  if (ids.length === 0) return NextResponse.json({ ok: true, data: { added: 0 } });

  const res = await addManyToCart(userId, ids);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: res.data });
}
