import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        if (!email) return null;
        return { id: email, name: email.split("@")[0], email };
      },
    }),
  ],
  // TODO: Integrate Supabase Adapter later
  session: { strategy: "jwt" },
};

