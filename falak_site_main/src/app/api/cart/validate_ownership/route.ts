import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import { validateOwnershipForPass } from "@/lib/actions/tables/cart";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const passId = url.searchParams.get("passId") || "";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  const user = await getUserByEmail(email);
  const userId = user.ok ? user.data?.id : undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "User not found" }, { status: 400 });
  const res = await validateOwnershipForPass(userId, passId);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: Boolean(res.data) });
}
