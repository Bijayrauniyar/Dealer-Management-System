/**
 * Delete all operational + master rows for one tenant using the service role.
 * Preserves: tenants, tenant_users, tenant_settings.
 * Safe order respects FKs (supplier_payments before suppliers, etc.).
 */

const TABLES_IN_DELETE_ORDER = [
  "supplier_payments",
  "returns",
  "damages",
  "payments",
  "sales_bills", // cascades sales_items
  "expenses",
  "scheme_tracker",
  "capital_entry_audit",
  "capital_entries",
  "salesman_targets",
  "vehicle_log",
  "daily_cash",
  "freezers",
  "beat_plans",
  "purchases", // cascades purchase_items
  "products",
  "customers",
  "suppliers",
];

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} adminClient - service role
 * @param {string} tenantId
 */
export async function purgeTenantTransactionalData(adminClient, tenantId) {
  for (const table of TABLES_IN_DELETE_ORDER) {
    const { error } = await adminClient.from(table).delete().eq("tenant_id", tenantId);
    if (error) throw new Error(`purge ${table}: ${error.message}`);
  }
}

export function getPurgeTableOrder() {
  return [...TABLES_IN_DELETE_ORDER];
}
