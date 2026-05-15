import { queryClient } from "@/lib/queryClient";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** End Supabase session and clear cached domain data (live mode only). */
export async function signOutApp(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut({ scope: "local" });
  queryClient.clear();
}
