import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 1000;

export type RangedQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>;
};

/** Paginate a Supabase select until no more rows. */
export async function fetchAllPages<T>(buildQuery: () => RangedQuery): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery().range(from, to);
    if (error) throw error;
    const batch = (data ?? []) as T[];
    out.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

export async function getTenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: tu, error } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  const tenantId = tu?.tenant_id as string | undefined;
  if (!tenantId) throw new Error("No tenant for user");
  return tenantId;
}
