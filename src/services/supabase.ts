import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (
  typeof supabaseUrl !== "string" ||
  supabaseUrl.trim().length === 0
) {
  throw new Error(
    "Missing VITE_SUPABASE_URL environment variable.",
  );
}

if (
  typeof supabaseAnonKey !== "string" ||
  supabaseAnonKey.trim().length === 0
) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY environment variable.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
