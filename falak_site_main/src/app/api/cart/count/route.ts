import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { listCart } from "@/lib/actions/tables/cart";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: true, data: 0 });
  const user = await getUserByEmail(email);
  const userId = user.ok ? user.data?.id : undefined;
  if (!userId) return NextResponse.json({ ok: true, data: 0 });
  const res = await listCart(userId);
  if (!res.ok) return NextResponse.json({ ok: true, data: 0 });
  const count = Array.isArray(res.data) ? res.data.length : 0;
  return NextResponse.json({ ok: true, data: count });
}
