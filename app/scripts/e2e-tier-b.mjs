/**
 * Phase 0 Tier B — oversell guard (0024), PageBackLink, VAT/credit UX in source.
 *
 * Usage:
 *   npm run e2e:tier-b           # source checks (no login)
 *   npm run e2e:tier-b:live      # source + e2e:stock:live (oversell RPC on DB)
 *
 * On Tier B feature changes: add/update checks here (same PR).
 * See docs/backend/phase1-use-cases-and-tests.md § Keeping tests in sync.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const MIG = resolve(APP, "supabase/migrations");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("Phase 0 Tier B");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

function runSourceChecks() {
  const mig = resolve(MIG, "0024_block_oversell_in_sales.sql");
  if (!existsSync(mig)) {
    r.fail("migration 0024", "missing");
  } else {
    r.pass("migration 0024 present");
    const sql = readFileSync(mig, "utf8");
    if (sql.includes("assert_sale_stock_available")) {
      r.pass("0024 assert_sale_stock_available");
    } else {
      r.fail("0024", "missing assert_sale_stock_available");
    }
    if (sql.includes("create_sales_bill") && sql.includes("update_sales_bill")) {
      r.pass("0024 hooks create + update sales bill");
    } else {
      r.fail("0024", "missing bill RPC hooks");
    }
  }

  const back = readSrc("components/app/PageBackLink.tsx");
  if (back && back.includes("navigate(-1)")) {
    r.pass("PageBackLink uses history back");
  } else if (back) {
    r.fail("PageBackLink", "unexpected implementation");
  }

  const saleEntry = readSrc("pages/sales/SaleEntryPage.tsx");
  if (saleEntry) {
    if (saleEntry.includes("PageBackLink") || saleEntry.includes("FormPageHeader")) {
      r.pass("SaleEntryPage has back/header chrome");
    } else {
      r.fail("SaleEntryPage back", "missing");
    }
    if (/insufficient stock|oversell|stock.*available/i.test(saleEntry)) {
      r.pass("SaleEntryPage surfaces stock errors");
    } else {
      r.fail("SaleEntryPage stock error UX", "grep insufficient stock");
    }
    if (saleEntry.includes("credit") || saleEntry.includes("Credit")) {
      r.pass("SaleEntryPage credit limit awareness");
    } else {
      r.fail("SaleEntryPage credit", "missing credit handling");
    }
    if (
      saleEntry.includes("SaleLinePricingBlock") &&
      saleEntry.includes("Prints: Rate") &&
      saleEntry.includes("Bill uses")
    ) {
      r.pass("SaleEntryPage line pricing block");
    } else {
      r.fail("SaleEntryPage pricing UI", "missing SaleLinePricingBlock");
    }
    if (!saleEntry.includes("dealer pricing")) {
      r.pass("SaleEntryPage no dealer pricing label");
    } else {
      r.fail("SaleEntryPage copy", "remove dealer pricing wording");
    }
    if (!saleEntry.includes("handleSaveAndPrint") && !saleEntry.includes("SAVE_INVOICE_PRINT_ACTION")) {
      r.pass("SaleEntryPage no save-and-print shortcut");
    } else {
      r.fail("SaleEntryPage save & print", "print only from bill detail");
    }
  }

  const billDetail = readSrc("pages/bills/BillDetailPage.tsx");
  if (billDetail?.includes("bill-print-root") && billDetail?.includes("waitingForSale")) {
    r.pass("BillDetailPage waits for bill before print");
  } else {
    r.fail("BillDetailPage print gate", "missing bill-ready check");
  }

  const entityPicker = readSrc("components/app/EntityPicker.tsx");
  if (entityPicker?.includes('open && "z-50"')) {
    r.pass("EntityPicker search above backdrop");
  } else {
    r.fail("EntityPicker z-index", "dropdown backdrop blocks input");
  }

  const settings = readSrc("pages/settings/SettingsPage.tsx");
  if (settings && /vat.*address|address.*vat|isVatRegistered/i.test(settings)) {
    r.pass("Settings VAT address validation");
  } else if (settings) {
    r.fail("Settings VAT validation", "missing");
  }

  const notif = readSrc("components/app/NotificationPanel.tsx");
  if (notif && notif.includes("linkTo")) {
    r.pass("NotificationPanel linkTo routes");
  } else if (notif) {
    r.fail("NotificationPanel", "missing linkTo");
  }

  const readme = readFileSync(resolve(APP, "supabase/README.txt"), "utf8");
  if (readme.includes("0024")) r.pass("README documents 0024");
  else r.fail("README 0024", "missing step");
}

function runLiveStockSuite() {
  r.pass("live.delegate", "running e2e-stock-dates.mjs --live");
  const res = spawnSync(process.execPath, ["scripts/e2e-stock-dates.mjs", "--live"], {
    cwd: APP,
    stdio: "inherit",
    env: process.env,
  });
  if (res.status === 0) r.pass("live.stock:live suite", "passed (includes oversell block)");
  else r.fail("live.stock:live suite", `exit ${res.status ?? "signal"}`);
}

console.log(`\n=== Phase 0 Tier B (${wantLive ? "source + live" : "source only"}) ===\n`);
runSourceChecks();
if (wantLive) runLiveStockSuite();
process.exit(r.summary());
