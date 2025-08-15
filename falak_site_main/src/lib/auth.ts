import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// Supabase direct client not needed here; use existing server actions instead
import type { Session } from "next-auth";

import { auth } from "./firebase/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getUserByEmail } from "@/lib/actions";

type AugSession = Session & { needsOnboarding?: boolean; user: Session["user"] & { id?: string } };

// Helper: check if user exists in Supabase
async function checkUserExistsByEmail(email?: string | null) {
  if (!email) return false;
  // If env is missing, skip forcing onboarding to avoid blocking local dev
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  const res = await getUserByEmail(email);
  if (!res.ok) {
    console.error("checkUserExists error", res.error);
    return true;
  }
  return Boolean(res.data);
}

export const  authOptions: AuthOptions = {
  providers: [
    // Credentials({
    //   name: "Demo",
    //   credentials: {
    //     email: { label: "Email", type: "email" },
    //   },
    //   async authorize(credentials) {
    //     const email = credentials?.email?.toString().trim();
    //     if (!email) return null;
    //     return { id: email, name: email.split("@")[0], email };
    //   },
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  // pages: {
  //   signIn: "/signin"
  // },
  // TODO: Integrate Supabase Adapter later
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // signIn: async ({ user, account, profile, email, credentials }) => {
    //   if (account?.provider === "google") {
    //     const provider = new GoogleAuthProvider();
    //     const result = await signInWithPopup(auth, provider);
    //     return true; 
    //   }
    //   return false;
    // },
    jwt: async ({ token }) => {
      // Always recompute based on DB so onboarding status updates immediately after creation
      const exists = await checkUserExistsByEmail(token.email);
      token.needsOnboarding = !exists;
      return token;
    },
  session: async ({ session, token }) => {
      const s = session as AugSession;
      if (s.user) {
        //session.user.id = token.sub as string;
        
        s.user.id = token.sub;
    s.needsOnboarding = (token as { needsOnboarding?: boolean }).needsOnboarding ?? false;
      }
      return s;
    },
  },
};

