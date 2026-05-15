import { supabase } from "@/lib/supabase";
import { debugLog } from "@/lib/debugLog";

export type SignupTenantInput = {
  businessName: string;
  ownerName: string;
  phone?: string;
  city?: string;
};

/** Links the current auth user to a new tenant (RPC from 0001/0002). */
export async function signupTenantForCurrentUser(input: SignupTenantInput): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("signup_tenant", {
    p_business_name: input.businessName.trim(),
    p_owner_name: input.ownerName.trim(),
    p_phone: input.phone?.trim() || "",
    p_city: input.city?.trim() || "",
  });
  // #region agent log
  debugLog("H4", "signupTenant.ts:rpc", "signup_tenant result", {
    ok: !error,
    errorMessage: error?.message ?? null,
    errorCode: error?.code ?? null,
  });
  // #endregion
  return { error: error?.message ?? null };
}
