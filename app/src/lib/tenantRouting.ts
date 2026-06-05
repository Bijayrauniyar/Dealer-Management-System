import type { TenantProfile } from "@/lib/auth";
import { isTenantLicenseValid } from "@/lib/tenantLicense";

export type TenantRoute = "/app/home" | "/pending-approval" | "/license-expired" | null;

/** Where to send the user after profile refresh / workspace link. */
export function routeForTenantProfile(profile: TenantProfile): TenantRoute {
  if (!profile.tenantId) return null;
  if (profile.status !== "active") return "/pending-approval";
  if (!isTenantLicenseValid(profile)) return "/license-expired";
  return "/app/home";
}
