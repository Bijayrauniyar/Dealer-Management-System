/**
 * Reset tenant operational data — start from scratch without losing login or shop profile.
 *
 * Removes: customers, suppliers, products, bills, payments, purchases, expenses, etc.
 * Preserves: Supabase Auth users/passwords, tenants row, tenant_users, tenant_settings
 *            (business name, address, PAN/VAT, invoice prefix, bill footer, …).
 *
 * From app/:
 *   node scripts/reset-tenant-data.mjs --yes
 *   node scripts/reset-tenant-data.mjs --yes --tenant-id=<uuid>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Resolves tenant from E2E credentials (.e2e-credentials.local) unless TENANT_ID / --tenant-id=.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdminClient, resolveTenantId } from "./lib/e2e-helpers.mjs";
import { getPurgeTableOrder, purgeTenantTransactionalData } from "./lib/tenant-purge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

function parseArgs(argv) {
  let yes = false;
  let tenantId = "";
  let help = false;
  for (const a of argv) {
    if (a === "--yes") yes = true;
    else if (a === "--help" || a === "-h") help = true;
    else if (a.startsWith("--tenant-id=")) tenantId = a.slice("--tenant-id=".length).trim();
  }
  return { yes, tenantId, help };
}

function printHelp() {
  const tables = getPurgeTableOrder().join(", ");
  console.log(`
reset-tenant-data.mjs — wipe domain data for ONE tenant; keep logins + shop profile

  Scope: only rows with tenant_id = <the id you choose>. Other tenants in Supabase are NOT touched.

  Deleted (for that tenant only): ${tables}

  Preserved (all tenants):
    • Auth users / passwords
    • tenants, tenant_users, tenant_settings for every org

  Usage (from app/, with SUPABASE_SERVICE_ROLE_KEY in .env.local):

    # Recommended: pass the tenant UUID explicitly
    node scripts/reset-tenant-data.mjs --yes --tenant-id=<uuid>

    # Or set env (same effect)
    TENANT_ID=<uuid> node scripts/reset-tenant-data.mjs --yes

    # Or infer tenant from .e2e-credentials.local (the E2E user’s org only)
    node scripts/reset-tenant-data.mjs --yes

  npm (add args after --):
    npm run tenant:reset-data -- --tenant-id=<uuid>

  Equivalent purge:  node scripts/tenant-seed.mjs purge --yes --tenant-id=<uuid>
`);
}

async function main() {
  const { yes, tenantId: tidArg, help } = parseArgs(process.argv.slice(2));
  if (help || !yes) {
    printHelp();
    process.exit(yes ? 0 : 1);
  }

  let tenantId;
  try {
    tenantId = await resolveTenantId(APP, tidArg);
  } catch {
    tenantId = (tidArg || process.env.TENANT_ID || "").trim();
    if (!tenantId) {
      console.error("Need tenant: set E2E_EMAIL/PASSWORD + .e2e-credentials.local, or --tenant-id= / TENANT_ID=");
      process.exit(1);
    }
  }

  const admin = loadAdminClient(APP);
  console.log(`\n── Tenant data reset ──`);
  console.log(`tenant_id: ${tenantId}`);
  console.log(`Scope: DELETE … WHERE tenant_id = '${tenantId}' ONLY (no other tenants).\n`);
  await purgeTenantTransactionalData(admin, tenantId);
  console.log("Done. Login unchanged; tenants / tenant_users / tenant_settings preserved.");
  console.log("Add customers, products, and bills again from the app.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
