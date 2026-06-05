const PREFIX = "bk_license_reminder";

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function storageKey(tenantId: string, dateKey: string): string {
  return `${PREFIX}_${tenantId}_${dateKey}`;
}

export function licenseReminderShownToday(tenantId: string | null): boolean {
  if (!tenantId || typeof localStorage === "undefined") return true;
  return localStorage.getItem(storageKey(tenantId, localDateKey())) === "1";
}

export function markLicenseReminderShown(tenantId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(tenantId, localDateKey()), "1");
}
