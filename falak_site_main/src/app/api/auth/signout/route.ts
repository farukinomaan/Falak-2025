import { NextResponse } from "next/server";

export async function POST() {
  // Redirect to NextAuth default signout
  return NextResponse.redirect(new URL("/api/auth/signout", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

