/**
 * Phase 0 export hub — source checks for lib/export + Settings Export tab.
 *
 *   node scripts/e2e-export.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src");
const r = createE2eReporter("Export");

function read(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`missing ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

const types = read("lib/export/types.ts");
if (types.includes("EXPORT_ROW_CAP")) r.pass("export types + row cap");
else r.fail("export types", "EXPORT_ROW_CAP missing");

const columns = read("lib/export/columns.ts");
if (columns.includes("SALES_REGISTER_COLUMNS") && columns.includes("VAT_SUMMARY_COLUMNS")) {
  r.pass("export columns defined");
} else r.fail("export columns", "incomplete");

const csv = read("lib/export/csv.ts");
if (csv.includes("papaparse") || csv.includes("Papa")) r.pass("csv uses papaparse");
else r.fail("csv.ts", "papaparse");

const build = read("lib/export/buildRegisters.ts");
if (build.includes("buildProductsExport") && build.includes("assertCap")) r.pass("buildRegisters");
else r.fail("buildRegisters", "incomplete");
if (build.includes("buildExpensesRegisterExport") && build.includes("buildReturnsRegisterExport")) {
  r.pass("EXP-P1 period registers");
} else {
  r.fail("EXP-P1 registers", "expenses/damages/returns builders missing");
}
if (build.includes("assertExportDateRange") && !build.includes("customers(id, name, phone, area)")) {
  r.pass("outstanding export uses view columns");
} else {
  r.fail("outstanding export", "expected v_customer_balance direct select");
}

const settings = read("pages/settings/SettingsPage.tsx");
if (settings.includes("ExportSection") && settings.includes('id: "export"')) {
  r.pass("Settings Export tab");
} else r.fail("Settings export tab", "missing");

const exportUi = read("pages/settings/ExportSection.tsx");
if (exportUi.includes("downloadCsv") && exportUi.includes("buildProductsExport")) {
  r.pass("ExportSection UI");
} else r.fail("ExportSection", "missing");
if (exportUi.includes("Goods returns") && exportUi.includes("buildDamagesRegisterExport")) {
  r.pass("ExportSection EXP-P1 buttons");
} else {
  r.fail("ExportSection EXP-P1", "missing expenses/damages/returns buttons");
}
if (exportUi.includes("Item-wise sales") && exportUi.includes("Sales register (by bill)")) {
  r.pass("ExportSection sales register labels");
} else {
  r.fail("ExportSection labels", "missing item-wise / by-bill labels");
}

const backup = read("lib/export/backupZip.ts");
if (backup.includes("customer_outstanding.csv") && backup.includes("vat_period_summary.csv")) {
  r.pass("Backup ZIP includes outstanding + VAT");
} else r.fail("backupZip", "missing outstanding or VAT in ZIP");
if (backup.includes("expenses_register.csv") && backup.includes("returns_register.csv")) {
  r.pass("Backup ZIP EXP-P1 registers");
} else {
  r.fail("backupZip EXP-P1", "missing expenses/damages/returns in ZIP");
}

const brand = read("config/productBrand.ts");
if (brand.includes("PRODUCT_DISPLAY_NAME")) r.pass("productBrand config");
else r.fail("productBrand", "missing");

r.summary();
