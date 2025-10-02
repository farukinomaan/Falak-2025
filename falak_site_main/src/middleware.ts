import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserByEmail } from "@/lib/actions";
import type { JWT } from "next-auth/jwt";

type AugToken = JWT & { needsOnboarding?: boolean };

export async function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  const token =  (await getToken({ req })) as AugToken | null;
  const needs = token?.needsOnboarding === true;
  const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin_manage");

  // Force karta hai user to onboarding only if bkl is logged in & not registered
  if (token && needs && !isOnboarding) {
    let shouldRedirect = true;
    try {
      // Re-check in DB to see if onboarding just completed this request cycle
      const email = token.email as string | undefined;
      if (email) {
        const exists = await getUserByEmail(email);
        if (exists.ok && exists.data) {
          shouldRedirect = false; // user now exists; allow navigation
        }
      }
    } catch {
      // On error keep default behavior (redirect)
    }
    if (shouldRedirect) {
      const url = new URL("/onboarding", req.url);
      const originalPath = req.nextUrl.pathname + (req.nextUrl.search || "");
      if (originalPath && originalPath !== "/" && !url.searchParams.has("return")) {
        if (originalPath.startsWith("/")) url.searchParams.set("return", originalPath);
      }
      return NextResponse.redirect(url);
    }
  }
  // Force karta hai user to home if bkl is logged in & still onboarding khol lia hai 
  if (token && !needs && isOnboarding) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  // No free ka access to Admin page 
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
    
  return NextResponse.next();
}
export default withAuth(middleware, {
  pages: {
    signIn: "/",
  },
  callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin_manage")) {
          return !!token;
          //return token?.role === "admin";
        }
        // Allow everything; we'll redirect below with matcher routes
        return true;
      },
  },
});

export const config = {
  matcher: [
    "/onboarding",
    "/admin_manage",
    "/profile",
    "/((?!api|_next|favicon.ico|api/auth).*)", // general matcher
  ],
};

