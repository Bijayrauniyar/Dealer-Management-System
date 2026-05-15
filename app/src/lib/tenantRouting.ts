import type { TenantProfile } from "@/lib/auth";

/** Where to send the user after profile refresh / workspace link. */
export function routeForTenantProfile(profile: TenantProfile): "/app/home" | "/pending-approval" | null {
  if (!profile.tenantId) return null;
  if (profile.status === "active") return "/app/home";
  return "/pending-approval";
}
