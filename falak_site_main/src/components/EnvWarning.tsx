"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function EnvWarning() {
  useEffect(() => {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
      missing.push("SUPABASE_URL");
    }
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.SUPABASE_ANON_KEY
    ) {
      missing.push("SUPABASE_ANON_KEY");
    }
    if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
      missing.push("NEXTAUTH_URL");
    }
    if (missing.length) {
      toast.warning(
        `Missing env: ${missing.join(", ")} — using placeholder/mocked behavior`
      );
    }
  }, []);

  return null;
}

