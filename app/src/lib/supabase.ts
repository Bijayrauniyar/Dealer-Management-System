import { createClient } from "@supabase/supabase-js";

const urlRaw = import.meta.env.VITE_SUPABASE_URL ?? "";
/** Supabase Dashboard may label this "anon" or "publishable" — either env name works. */
const anonRaw =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

/** True when Vite env exposes both URL and anon/publishable key. */
export const isSupabaseConfigured = Boolean(urlRaw && anonRaw);

/**
 * Client is always created so imports resolve. Use `isSupabaseConfigured` + `MissingSupabaseEnv`
 * before routing authenticated flows. CI/production builds must inject real or placeholder `VITE_*`.
 */
export const supabase = createClient(
  urlRaw || "https://placeholder.supabase.co",
  anonRaw || "eyJhbGciOiJIUzI1NiJ9.placeholder-not-configured",
);
