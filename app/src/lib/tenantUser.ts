import { supabase } from "@/lib/supabase";

export type TenantUserRow = { tenant_id: string; role: string; created_at: string };

/** Same priority as SQL `current_tenant_id()`: owner link first, then oldest. */
export function pickTenantUserRow(rows: TenantUserRow[] | null): TenantUserRow | null {
  if (!rows?.length) return null;
  const sorted = [...rows].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  return sorted[0] ?? null;
}

/** Workspace id for the signed-in user (matches RLS `current_tenant_id()`). */
export async function getTenantIdForCurrentUser(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: rows, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, created_at")
    .eq("user_id", user.id);

  if (error) throw error;
  const picked = pickTenantUserRow(rows as TenantUserRow[] | null);
  if (!picked?.tenant_id) throw new Error("No tenant for user");
  return picked.tenant_id;
}
