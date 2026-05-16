/**
 * Demo seed + tenant data purge (Phase 1).
 *
 * Seed uses your signed-in E2E user (JWT) so RPCs see the correct tenant.
 * Purge uses SUPABASE_SERVICE_ROLE_KEY so all rows delete regardless of RLS.
 *
 * Usage (from app/):
 *   node scripts/tenant-seed.mjs seed [--reset] [--tenant-id=<uuid>]
 *   node scripts/tenant-seed.mjs purge --yes [--tenant-id=<uuid>]
 *
 * Env:
 *   TENANT_ID — optional; otherwise inferred from E2E login
 *   E2E_EMAIL / E2E_PASSWORD or .e2e-credentials.local
 *   SUPABASE_SERVICE_ROLE_KEY — required for purge / seed --reset
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDemoSeed } from "./lib/demo-seed.mjs";
import {
  createAuthedClient,
  loadAdminClient,
  resolveTenantId,
  today,
} from "./lib/e2e-helpers.mjs";
import { purgeTenantTransactionalData } from "./lib/tenant-purge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { cmd: "", reset: false, yes: false, tenantId: "", help: false };
  for (const a of argv) {
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--reset") out.reset = true;
    else if (a === "--yes") out.yes = true;
    else if (a.startsWith("--tenant-id=")) out.tenantId = a.slice("--tenant-id=".length).trim();
    else if (!a.startsWith("-") && !out.cmd) out.cmd = a;
  }
  return out;
}

function printHelp() {
  console.log(`
tenant-seed.mjs — curated demo data or full tenant transactional purge

  node scripts/tenant-seed.mjs seed [--reset] [--tenant-id=<uuid>]
      Insert demo products, customers, sales, purchases, etc.
      --reset  purge all transactional + master rows for the tenant first
               (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)

  node scripts/tenant-seed.mjs purge --yes [--tenant-id=<uuid>]
      Delete all domain data for the tenant; keeps tenants / tenant_users / tenant_settings.
      Must pass --yes. Uses service role.

  Credentials: E2E user login (see create-e2e-user-and-test.mjs).
  Optional: TENANT_ID=... if you only have service role (purge only — seed still needs JWT).
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.cmd) {
    printHelp();
    process.exit(args.cmd ? 0 : 1);
  }

  const billDate = today();
  const stamp = Date.now().toString(36).toUpperCase();

  if (args.cmd === "purge") {
    if (!args.yes) {
      console.error("Refusing purge without --yes (destructive).");
      process.exit(1);
    }
    let tenantId;
    try {
      tenantId = await resolveTenantId(APP, args.tenantId);
    } catch {
      tenantId = (args.tenantId || process.env.TENANT_ID || "").trim();
      if (!tenantId) {
        console.error("purge: set --tenant-id= or TENANT_ID=, or sign in via E2E credentials.");
        process.exit(1);
      }
    }
    const admin = loadAdminClient(APP);
    console.log(`Purging tenant ${tenantId} …`);
    await purgeTenantTransactionalData(admin, tenantId);
    console.log("Done. tenants / tenant_users / tenant_settings unchanged.");
    return;
  }

  if (args.cmd === "seed") {
    const { supabase, tenantId: tidFromAuth } = await createAuthedClient(APP);
    const tenantId = (args.tenantId || tidFromAuth).trim();
    if (tenantId !== tidFromAuth) {
      console.error("seed --tenant-id must match your logged-in tenant (JWT tenant is fixed).");
      process.exit(1);
    }

    if (args.reset) {
      const admin = loadAdminClient(APP);
      console.log(`Reset: purging transactional data for ${tenantId} …`);
      await purgeTenantTransactionalData(admin, tenantId);
    }

    console.log(`Seeding demo data (${stamp}) …`);
    const summary = await runDemoSeed({ supabase, tenantId, billDate, stamp });
    console.log("Summary:", {
      prefix: summary.prefix,
      billId: summary.billId,
      primarySaleTotal: summary.expectedPrimarySaleTotal,
      productCodes: summary.productIds.length,
    });
    await supabase.auth.signOut({ scope: "local" });
    console.log("Seed complete.");
    return;
  }

  console.error("Unknown command:", args.cmd);
  printHelp();
  process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
