import { createClient } from "@supabase/supabase-js";

const urlRaw = import.meta.env.VITE_SUPABASE_URL ?? "";
/** Supabase Dashboard may label this "anon" or "publishable" — either env name works. */
const anonRaw =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

/** True when Vite env exposes both URL and anon/publishable key (live Supabase mode). */
export const isSupabaseConfigured = Boolean(urlRaw && anonRaw);

if (!isSupabaseConfigured) {
  console.warn(
    "Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) — running demo mode.",
  );
}

/** `createClient` rejects empty strings; demo mode never calls the network when `isSupabaseConfigured` is false. */
export const supabase = createClient(
  isSupabaseConfigured ? urlRaw : "https://demo.invalid",
  isSupabaseConfigured ? anonRaw : "demo-anon-placeholder",
);
