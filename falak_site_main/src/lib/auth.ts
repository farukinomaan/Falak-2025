import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
// Supabase direct client not needed here; use existing server actions instead
import type { Session } from "next-auth";

// Removed unused Firebase client imports after simplifying auth callbacks
import { getUserByEmail } from "@/lib/actions";

type AugSession = Session & { needsOnboarding?: boolean; user: Session["user"] & { id?: string } };

interface AugToken extends JWT {
  supabaseUserId?: string;
  needsOnboarding?: boolean;
}

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
    jwt: async ({ token }) => {
      const t = token as AugToken;
      const exists = await checkUserExistsByEmail(t.email);
      t.needsOnboarding = !exists;
      // If user exists, fetch Supabase user id (only if not cached)
      if (t.email && !t.supabaseUserId && !t.needsOnboarding) {
        try {
          const userRes = await getUserByEmail(t.email);
          if (userRes.ok && userRes.data?.id) t.supabaseUserId = userRes.data.id as string;
        } catch {
          // ignore
        }
      }
      return token; // return base token instance, mutated in place
    },
    session: async ({ session, token }) => {
      const s = session as AugSession;
      const t = token as AugToken;
      if (s.user) {
        // Prefer Supabase user id for server-side data lookups
        s.user.id = t.supabaseUserId || t.sub;
        s.needsOnboarding = t.needsOnboarding ?? false;
      }
      return s;
    },
  },
};

