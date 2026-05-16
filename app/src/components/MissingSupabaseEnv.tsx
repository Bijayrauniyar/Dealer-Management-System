/**
 * Shown when VITE_SUPABASE_URL and anon/publishable key are not set at build/runtime.
 */
export function MissingSupabaseEnv() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-6 text-center">
      <h1 className="text-lg font-bold text-foreground">Supabase not configured</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Copy <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">app/.env.example</code> to{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">app/.env.local</code> and set{" "}
        <code className="text-xs">VITE_SUPABASE_URL</code> and{" "}
        <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> (or{" "}
        <code className="text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>). Then restart the dev server or rebuild.
      </p>
    </div>
  );
}
