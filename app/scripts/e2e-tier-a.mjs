/**
 * Phase 0 Tier A — export hub, categories, stock adjustment, settings tabs, rebrand.
 *
 * Usage:
 *   npm run e2e:tier-a           # source checks (no login)
 *   npm run e2e:tier-a:live      # + live DB columns 0019–0023 on tenant_settings
 *
 * Also runs export file checks (same as e2e:export).
 *
 * On Tier A feature changes: add/update checks here (same PR).
 * See docs/backend/phase1-use-cases-and-tests.md § Keeping tests in sync.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter, createAuthedClient } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const MIG = resolve(APP, "supabase/migrations");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("Phase 0 Tier A");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

function readMig(name) {
  const p = resolve(MIG, name);
  if (!existsSync(p)) {
    r.fail(`migration ${name}`, "missing");
    return "";
  }
  r.pass(`migration ${name} present`);
  return readFileSync(p, "utf8");
}

function runExportChecks() {
  const types = readSrc("lib/export/types.ts");
  if (types.includes("EXPORT_ROW_CAP")) r.pass("export EXPORT_ROW_CAP");
  else r.fail("export types", "EXPORT_ROW_CAP missing");

  const columns = readSrc("lib/export/columns.ts");
  if (columns.includes("SALES_REGISTER_COLUMNS") && columns.includes("VAT_SUMMARY_COLUMNS")) {
    r.pass("export register columns");
  } else r.fail("export columns", "incomplete");

  const settings = readSrc("pages/settings/SettingsPage.tsx");
  if (settings.includes("ExportSection") && settings.includes('id: "export"')) {
    r.pass("Settings Export tab");
  } else r.fail("Settings Export tab", "missing");

  const exportUi = readSrc("pages/settings/ExportSection.tsx");
  if (exportUi.includes("downloadCsv") && exportUi.includes("buildProductsExport")) {
    r.pass("ExportSection downloadCsv");
  } else r.fail("ExportSection", "incomplete");

  const brand = readSrc("config/productBrand.ts");
  if (brand.includes("PRODUCT_DISPLAY_NAME")) r.pass("productBrand config");
  else r.fail("productBrand", "missing");
}

function runTierASourceChecks() {
  const migs = [
    "0019_tenant_product_categories.sql",
    "0020_stock_adjustments.sql",
    "0021_tenant_allow_stock_adjustment.sql",
    "0022_tenant_list_page_size.sql",
    "0023_tenant_show_district_on_bill.sql",
  ];
  for (const m of migs) readMig(m);

  const m20 = readFileSync(resolve(MIG, "0020_stock_adjustments.sql"), "utf8");
  if (m20.includes("stock_adjustments") && m20.includes("record_stock_adjustment")) {
    r.pass("0020 stock_adjustments + RPC");
  } else {
    r.fail("0020", "missing table or RPC");
  }

  const settings = readSrc("pages/settings/SettingsPage.tsx");
  if (settings) {
    if (settings.includes("ProductCategoriesSection")) r.pass("Settings product categories UI");
    else r.fail("Settings categories", "missing ProductCategoriesSection");
    if (settings.includes("allow_stock_adjustment")) r.pass("Settings allow_stock_adjustment");
    else r.fail("Settings stock adjustment flag", "missing");
    if (settings.includes("list_page_size")) r.pass("Settings list_page_size");
    else r.fail("Settings list_page_size", "missing");
    if (settings.includes("show_district_province_on_bill")) {
      r.pass("Settings show_district on bill");
    } else {
      r.fail("Settings district on bill", "missing");
    }
    const tabIds = ['"business"', '"bills"', '"stock"', '"export"'];
    for (const id of tabIds) {
      if (settings.includes(id)) r.pass(`Settings tab ${id}`);
      else r.fail(`Settings tab ${id}`, "missing");
    }
  }

  const adjPage = readSrc("pages/stock/StockAdjustmentPage.tsx");
  if (adjPage && adjPage.includes("commitStockAdjustment")) {
    r.pass("StockAdjustmentPage commitStockAdjustment");
  } else if (adjPage) {
    r.fail("StockAdjustmentPage", "missing");
  }

  const domainLive = readSrc("lib/live/domainLive.ts");
  if (domainLive?.includes('rpc("record_stock_adjustment"')) {
    r.pass("domainLive record_stock_adjustment");
  } else if (domainLive) {
    r.fail("domainLive adjustment", "missing RPC");
  }

  const readme = readFileSync(resolve(APP, "supabase/README.txt"), "utf8");
  if (readme.includes("0019") && readme.includes("0023")) {
    r.pass("README documents 0019–0023");
  } else {
    r.fail("README Tier A steps", "missing 0019–0023");
  }

  runExportChecks();
}

async function runLiveChecks() {
  let supabase;
  let tenantId;
  try {
    ({ supabase, tenantId } = await createAuthedClient(APP));
    r.pass("live.auth + tenant", tenantId.slice(0, 8));
  } catch (e) {
    r.fail("live.auth", e.message);
    return;
  }

  const { data, error } = await supabase
    .from("tenant_settings")
    .select(
      "product_categories, allow_stock_adjustment, list_page_size, show_district_province_on_bill",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    const missing = /column|does not exist/i.test(error.message);
    r.fail("live.tenant_settings Tier A columns", missing ? `NOT APPLIED — ${error.message}` : error.message);
    return;
  }
  r.pass("live.tenant_settings Tier A columns (0019–0023)");

  if (Array.isArray(data?.product_categories)) {
    r.pass("live.product_categories array");
  } else {
    r.fail("live.product_categories", String(data?.product_categories));
  }

  const { error: rpcErr } = await supabase.rpc("record_stock_adjustment", {
    p_adjustment_date: new Date().toISOString().slice(0, 10),
    p_product_id: "00000000-0000-0000-0000-000000000000",
    p_qty: 0,
    p_reason: "e2e-probe",
    p_notes: "tier-a-rpc-exists-check",
  });
  if (rpcErr) {
    if (/does not exist|42883/i.test(rpcErr.message)) {
      r.fail("live.record_stock_adjustment RPC", "NOT APPLIED — run 0020");
    } else {
      r.pass("live.record_stock_adjustment RPC exists", rpcErr.message.slice(0, 60));
    }
  } else {
    r.pass("live.record_stock_adjustment RPC callable");
  }
}

console.log(`\n=== Phase 0 Tier A (${wantLive ? "source + live" : "source only"}) ===\n`);
runTierASourceChecks();
if (wantLive) await runLiveChecks();
process.exit(r.summary());
