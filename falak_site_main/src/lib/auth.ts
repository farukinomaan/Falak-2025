import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import type { Session } from "next-auth";

import { auth } from "./firebase/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

type AugSession = Session & { needsOnboarding?: boolean; user: Session["user"] & { id?: string } };

// Helper: check if user exists in Supabase
async function checkUserExistsByEmail(email?: string | null) {
  if (!email) return false;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // No DB in dev -> skip forcing onboarding
    return true;
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("checkUserExists error", error);
    return true;
  }
  return !!data;
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
    jwt: async ({ token, account, profile }) => {
      if (account?.provider === "google") {
        //const exists = await checkUserExistsByEmail(token.email);
        //token.needsOnboarding = !exists;
        token.needsOnboarding = true;
      }
      return token;
    },
    session: async ({ session, token }) => {
      const s = session as AugSession;
      if (s.user) {
        //session.user.id = token.sub as string;
        
        s.user.id = token.sub;
        s.needsOnboarding = (token as any).needsOnboarding ?? false;
      }
      return s;
    },
  },
};

