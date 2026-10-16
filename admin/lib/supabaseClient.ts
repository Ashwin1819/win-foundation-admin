import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public, browser-safe client — NEXT_PUBLIC_SUPABASE_ANON_KEY is a
// publishable/anon key, meant to be exposed client-side (bucket access is
// governed by Supabase's own storage policies, not by keeping this secret).
//
// Lazily created on first actual use rather than at module load — this page
// is statically prerendered, so importing this module runs during `next
// build` too; reading env vars eagerly there would crash the build on any
// environment that hasn't set them yet (e.g. CI), not just fail at runtime.
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

// Actual bucket name as created in the Supabase dashboard (not "campaign-media" —
// renaming wasn't available there, so the code targets the real name instead).
export const CAMPAIGN_MEDIA_BUCKET = "win foundation ph vi";
