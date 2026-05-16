/**
 * Verifies purge + demo seed + post-conditions + cleanup.
 * Requires: .env.local with VITE_* + SUPABASE_SERVICE_ROLE_KEY, E2E credentials, tenant active.
 *
 * npm run e2e:seed:selftest
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDemoSeed } from "./lib/demo-seed.mjs";
import {
  createAuthedClient,
  createE2eReporter,
  loadAdminClient,
  today,
} from "./lib/e2e-helpers.mjs";
import { purgeTenantTransactionalData } from "./lib/tenant-purge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

const r = createE2eReporter("Tenant seed / purge self-test");

async function countRows(admin, table, tenantId) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

async function run() {
  let admin;
  try {
    admin = loadAdminClient(APP);
    r.pass("loadAdminClient");
  } catch (e) {
    r.fail("loadAdminClient", e instanceof Error ? e.message : String(e));
    return;
  }

  let supabase;
  let tenantId;
  try {
    ({ supabase, tenantId } = await createAuthedClient(APP));
    r.pass("auth + tenant", tenantId.slice(0, 8));
  } catch (e) {
    r.fail("createAuthedClient", e instanceof Error ? e.message : String(e));
    return;
  }

  const { data: t } = await supabase.from("tenants").select("status").eq("id", tenantId).maybeSingle();
  if (t?.status !== "active") {
    r.fail("tenant.active", t?.status ?? "null");
  } else r.pass("tenant.active");

  const stamp = `T${Date.now().toString(36).toUpperCase()}`;
  const billDate = today();

  await purgeTenantTransactionalData(admin, tenantId);
  r.pass("purge.before (empty transactional)");

  const afterPurgeProducts = await countRows(admin, "products", tenantId);
  r.assertEq(afterPurgeProducts, 0, "products count after purge");

  const summary = await runDemoSeed({ supabase, tenantId, billDate, stamp });
  r.pass("runDemoSeed");

  const prodCount = await countRows(admin, "products", tenantId);
  if (prodCount < 3) r.fail("products after seed", String(prodCount));
  else r.pass("products after seed", String(prodCount));

  const billCount = await countRows(admin, "sales_bills", tenantId);
  if (billCount < 2) r.fail("sales_bills after seed", String(billCount));
  else r.pass("sales_bills after seed", String(billCount));

  const { data: bill } = await supabase
    .from("sales_bills")
    .select("total, discount, vat_amount, extra_charges, subtotal")
    .eq("id", summary.billId)
    .single();
  r.assertClose(bill?.total, summary.expectedPrimarySaleTotal, "primary bill total");
  r.assertClose(
    Number(bill?.subtotal) -
      Number(bill?.discount) +
      Number(bill?.vat_amount) +
      Number(bill?.extra_charges),
    summary.expectedPrimarySaleTotal,
    "primary bill total recomputed",
  );

  await purgeTenantTransactionalData(admin, tenantId);
  r.pass("purge.after (cleanup)");

  const finalProducts = await countRows(admin, "products", tenantId);
  r.assertEq(finalProducts, 0, "products count after final purge");

  await supabase.auth.signOut({ scope: "local" });
  r.pass("signOut");
}

try {
  await run();
} catch (e) {
  r.fail("fatal", e instanceof Error ? e.message : String(e));
}

process.exit(r.summary() ? 1 : 0);
