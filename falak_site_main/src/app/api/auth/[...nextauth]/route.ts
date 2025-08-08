import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Provide a fallback NEXTAUTH_URL in dev to avoid Invalid URL errors
const originalUrl = process.env.NEXTAUTH_URL;
if (!originalUrl && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

