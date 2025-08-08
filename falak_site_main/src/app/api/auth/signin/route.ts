import { NextResponse } from "next/server";

export async function POST() {
  // NextAuth default sign-in page is disabled; this is a convenience redirect
  return NextResponse.redirect(new URL("/api/auth/signin?provider=credentials", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

