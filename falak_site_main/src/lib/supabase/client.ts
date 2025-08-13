"use client";

// import { createClient } from "@supabase/supabase-js";

// export function getSupabaseClient() {
//   const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
//   const anonKey =
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

//   if (!url || !anonKey) {
//     throw new Error(
//       "Supabase env vars missing. Add SUPABASE_URL and SUPABASE_ANON_KEY to use the client."
//     );
//   }

//   return createClient(url, anonKey);
// }


import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
