/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Legacy name; same value as publishable key in Dashboard. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Newer Supabase Dashboard "Publishable key" (sb_publishable_...). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
