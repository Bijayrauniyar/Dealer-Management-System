/**
 * Bill print / PDF design checks.
 *
 * Usage:
 *   node scripts/e2e-bill-print.mjs              # unit + source (no Supabase)
 *   node scripts/e2e-bill-print.mjs --live       # + verify bills in your project
 *   node scripts/e2e-bill-print.mjs --ui         # + browser DOM (needs npm run dev + E2E creds)
 *   node scripts/e2e-bill-print.mjs --live --ui  # all layers
 *
 * Env: app/.env.local (+ app/.e2e-credentials.local for --live / --ui)
 * UI:  BASE_URL=http://localhost:5173 (default)
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  billLineAmount,
  lineAmountFromMrp,
  hydrateBillLineFromDbItem,
  sumBillLineAmounts,
} from "./lib/bill-print-math.mjs";
import {
  productStockStatus,
  productPickerOptionMeta,
  buildSaleProductPickerOptions,
} from "./lib/stock-picker.mjs";
import { createE2eReporter, createAuthedClient, parseNpr } from "./lib/e2e-helpers.mjs";
import {
  buildSellerContactLine,
  formatSellerAddressLines,
  formatSellerAddressSegments,
  sellerPhoneNumber,
} from "../src/lib/sellerAddressLine.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const args = new Set(process.argv.slice(2));
const wantLive = args.has("--live");
const wantUi = args.has("--ui");

const r = createE2eReporter("Bill print / PDF");

// ── 1. Unit: line amounts must match DB rate (not wrong PCS MRP) ─────────────
function runUnitTests() {
  r.assertEq(parseNpr("Rs. 576"), 576, "parseNpr Rs. prefix");
  r.assertEq(parseNpr("NPR 1,093"), 1093, "parseNpr NPR comma");
  r.assertClose(
    billLineAmount({ qty: 1, rate: 105, mrp: 1300 }),
    105,
    "bill.amount uses qty×rate when pack MRP differs from line total",
  );
  r.assertClose(
    lineAmountFromMrp({ qty: 1, mrp: 1300, rate: 105 }),
    1300,
    "lineAmountFromMrp still uses MRP (documents old bug)",
  );
  r.assertClose(
    billLineAmount({ qty: 6, rate: 100, mrp: 100 }),
    600,
    "bill.amount PCS line",
  );
  r.assertClose(billLineAmount({ qty: 2, rate: 50, mrp: 60, amount: 99 }), 99, "bill.amount prefers stored amount");

  r.assertClose(
    billLineAmount({ qty: 3, rate: 10.25, mrp: 0 }),
    30.75,
    "bill.amount supports decimal rate (paisa)",
  );

  const freshmentSegments = formatSellerAddressSegments({
    addressLine1: "Birgunj Nepal",
    addressLine2: "Nepal",
    district: "Parsa",
    province: "Nepal",
    country: "Nepal",
  });
  r.assertEq(
    freshmentSegments.join(" · "),
    "Birgunj Nepal · Parsa",
    "seller address dedupes repeated Nepal (Freshment-style settings)",
  );
  r.assertEq(
    buildSellerContactLine(freshmentSegments, { mobile: "9845982192", phone: "" }),
    "Birgunj Nepal · Parsa",
    "seller address line (phone on letterhead right, not in address string)",
  );

  const shortBillAddr = formatSellerAddressLines({
    addressLine1: "Ranighat-11, Birgunj",
    addressLine2: "",
    district: "Parsa",
    province: "Madhesh Pradesh",
    country: "Nepal",
  });
  r.assertEq(shortBillAddr.length, 1, "bill address: line 1 only by default");
  r.assertEq(shortBillAddr[0], "Ranighat-11, Birgunj", "bill address: prints Settings line 1");
  r.assertEq(
    shortBillAddr.join(" ").includes("Parsa"),
    false,
    "bill address: district not on bill unless toggle",
  );

  const addrLines = formatSellerAddressLines(
    {
      addressLine1: "Birgunj Nepal",
      addressLine2: "Nepal",
      district: "Parsa",
      province: "Nepal",
      country: "Nepal",
    },
    { includeDistrictProvince: true },
  );
  r.assertEq(addrLines.length, 2, "bill address + district line when toggle on");
  r.assertEq(
    addrLines.join(" ").includes("9845982192"),
    false,
    "IRD letterhead: address lines exclude phone",
  );

  r.assertEq(
    sellerPhoneNumber({ mobile: "9800000001", phone: "" }),
    "9800000001",
    "letterhead phone (mobile preferred)",
  );

  const hydrated = hydrateBillLineFromDbItem({
    qty: 1,
    rate: 105,
    unit: "Box",
    products: {
      name: "Crunchy butter cone",
      unit: "PCS",
      mrp: 130,
      sale_price: 100,
      discount_pct: 0,
      uom_prices: { Box: { mrp: 1300, sale_price: 105 } },
      uom_conversion: { pack_uom: "Box", factor: 10 },
    },
  });
  r.assertClose(hydrated.amount, 105, "hydrate.pack line amount");
  r.assertClose(hydrated.mrp, 1300, "hydrate.pack display MRP");

  const pcsLine = { qty: 10, rate: 50, mrp: 60 };
  r.assertClose(billLineAmount(pcsLine), 500, "bill.amount sell rate below MRP");
  const implied = Math.round((1 - 500 / 600) * 100);
  r.assertEq(implied, 17, "implied line disc for MRP 60 × 10 → 500");
  r.assertClose(
    sumBillLineAmounts([
      { qty: 1, rate: 105, mrp: 1300 },
      { qty: 2, rate: 50, mrp: 50 },
    ]),
    205,
    "sumBillLineAmounts",
  );

  const pOut = { id: "a", name: "A", onHand: 0, minQty: 5, uom: "PCS", sellingPrice: 100 };
  const pLow = { id: "b", name: "B", onHand: 3, minQty: 10, uom: "PCS", sellingPrice: 200 };
  const pOk = { id: "c", name: "C", onHand: 50, minQty: 5, uom: "PCS", sellingPrice: 300 };
  r.assertEq(productStockStatus(pOut), "out", "stock.out");
  r.assertEq(productStockStatus(pLow), "low", "stock.low");
  r.assertEq(productStockStatus(pOk), "in_stock", "stock.ok");
  r.assertEq(productPickerOptionMeta(pOut).disabled, true, "picker.out disabled");
  r.assertEq(productPickerOptionMeta(pOut, { allowOutOfStockSelect: true }).disabled, false, "picker.out allow");
  const opts = buildSaleProductPickerOptions([pOut, pLow, pOk], ["a"]);
  r.assertEq(opts.find((o) => o.id === "a")?.disabled, false, "picker.line exception");
  r.assertEq(opts.find((o) => o.id === "b")?.tone, "low", "picker.low tone");
}

// ── 2. Source: layout contracts for print + PDF capture ─────────────────────
function runSourceTests() {
  const billView = readFileSync(resolve(SRC, "components/app/BillPrintView.tsx"), "utf8");
  const purchaseBill = readFileSync(resolve(SRC, "components/app/PurchaseBillView.tsx"), "utf8");
  const billPriceDisplay = readFileSync(resolve(SRC, "lib/billPriceDisplay.ts"), "utf8");
  const settingsPage = readFileSync(resolve(SRC, "pages/settings/SettingsPage.tsx"), "utf8");
  const saleEntry = readFileSync(resolve(SRC, "pages/sales/SaleEntryPage.tsx"), "utf8");
  const entityPicker = readFileSync(resolve(SRC, "components/app/EntityPicker.tsx"), "utf8");
  const stockAlert = readFileSync(resolve(SRC, "lib/stockAlert.ts"), "utf8");
  const domainLive = readFileSync(resolve(SRC, "lib/live/domainLive.ts"), "utf8");
  const purchasePage = readFileSync(resolve(SRC, "pages/purchases/PurchasePage.tsx"), "utf8");
  const billExport = readFileSync(resolve(SRC, "lib/billExport.ts"), "utf8");
  const billPdf = readFileSync(resolve(SRC, "lib/billPdfDocument.ts"), "utf8");
  const indexCss = readFileSync(resolve(SRC, "index.css"), "utf8");

  const mustHave = [
    ["BillPrintView", "bill-lines-table", billView],
    ["BillPrintView", "bill-cell-inner", billView],
    ["BillPrintView", "Grand total (NPR)", billView],
    ["BillPrintView", "bill-totals-table", billView],
    ["BillPrintView", "bill-print-summary", billView],
    ["BillPrintView", "billLineAmount", billView],
    ["BillPrintView", "lineDiscPct", billView],
    ["BillPrintView", "BillLetterhead", billView],
    ["BillPrintView", "sellerLetterheadFromBusiness", billView],
    ["BillPrintView", "billLineUnitPriceDisplay", billView],
    ["BillPrintView", "bill-payment-qr", billView],
    ["billPriceDisplay", "salesBillUnitPriceHeaderPrint", billPriceDisplay],
    ["billPriceDisplay", "saleLineDisplayMrp", billPriceDisplay],
    ["billDisplay", "inferBillDiscountFromStored", readFileSync(resolve(SRC, "lib/billDisplay.ts"), "utf8")],
    ["domainLive", "inferBillDiscountFromStored", domainLive],
    ["billPriceDisplay", "showsSalesBillPaymentQr", billPriceDisplay],
    ["SettingsPage", "sales_bill_price_mode", settingsPage],
    ["SettingsPage", "sales_bill_qr_enabled", settingsPage],
    ["SettingsPage", "uploadSalesBillQrImage", settingsPage],
    ["BillPrintView", "createSalesBillQrSignedUrl", billView],
    ["salesBillQrStorage", "tenant-assets", readFileSync(resolve(SRC, "lib/salesBillQrStorage.ts"), "utf8")],
    ["PurchaseBillView", "BillLetterhead", purchaseBill],
    ["PurchaseBillView", "purchaseBillRateHeader", purchaseBill],
    ["billPdfDocument", "sellerLetterheadFromBusiness", billPdf],
    ["billExport", "createBillPdf", billExport],
    ["billPdfDocument", "createBillPdf", billPdf],
    ["billPdfDocument", "billLineAmount", billPdf],
    ["billPdfDocument", "Grand total (NPR)", billPdf],
    ["index.css", ".bill-pdf-capture .bill-lines-table", indexCss],
    ["index.css", "vertical-align: middle", indexCss],
    ["index.css", ".bill-totals-table", indexCss],
    ["index.css", "bill-totals-grand", indexCss],
    ["SaleEntryPage", "buildSaleProductPickerOptions", saleEntry],
    ["stockAlert", "productStockStatus", stockAlert],
    ["EntityPicker", "opt.disabled", entityPicker],
    ["EntityPicker", "cursor-not-allowed", entityPicker],
    ["domainLive", "purchaseDate", domainLive],
    ["PurchasePage", "purchaseDate: date", purchasePage],
  ];
  for (const [file, needle, text] of mustHave) {
    if (!text.includes(needle)) r.fail(`${file} contains ${needle}`, "missing");
    else r.pass(`${file} contains ${needle}`);
  }

  if (/>\s*NPR\s*<\/p>/.test(billView) && billView.includes('text-[8px]')) {
    r.fail("BillPrintView orphan NPR label", "floating NPR under table should be removed");
  } else {
    r.pass("BillPrintView no orphan NPR under table");
  }

  if (billView.includes("border-double")) {
    r.fail("BillPrintView border-double on totals", "use bill-totals-grand single border for PDF");
  } else {
    r.pass("BillPrintView no border-double on totals");
  }

  if (billView.includes("MIN_TABLE_ROWS")) {
    r.fail("BillPrintView empty filler rows", "MIN_TABLE_ROWS should be removed");
  } else {
    r.pass("BillPrintView no empty filler rows");
  }

  if (billExport.includes("billPdfBlobFromElement") || billExport.includes("billPdfCapture")) {
    r.pass("billExport matches on-screen bill design");
  } else {
    r.fail("billExport", "expected billPdfCapture for styled PDF download");
  }

  const mig0035 = resolve(APP, "supabase/migrations/0035_sales_print_settings_and_qr.sql");
  if (existsSync(mig0035)) r.pass("migration 0035_sales_print_settings_and_qr.sql present");
  else r.fail("migration 0035", "missing");

  const mig0036 = resolve(APP, "supabase/migrations/0036_sales_bill_qr_storage.sql");
  if (existsSync(mig0036)) r.pass("migration 0036_sales_bill_qr_storage.sql present");
  else r.fail("migration 0036", "missing");

  if (billPdf.includes("showsSalesBillPaymentQr")) {
    r.pass("billPdfDocument payment QR fallback text");
  } else {
    r.fail("billPdfDocument", "missing showsSalesBillPaymentQr fallback");
  }
}

// ── 3. Live: recent bills — sum(qty×rate) = subtotal ─────────────────────────
async function runLiveTests() {
  const { supabase } = await createAuthedClient(APP);

  const productEmbed =
    "name, unit, mrp, sale_price, discount_pct, uom_prices, uom_conversion";
  let itemSelect = `bill_id, product_id, qty, rate, unit, products(${productEmbed})`;

  const { data: bills, error: be } = await supabase
    .from("sales_bills")
    .select("id, bill_no, subtotal, discount, total")
    .order("bill_date", { ascending: false })
    .limit(15);
  if (be) {
    r.fail("live.sales_bills", be.message);
    return;
  }
  if (!bills?.length) {
    r.pass("live.skip", "no bills in tenant");
    return;
  }

  const ids = bills.map((b) => b.id);
  let { data: items, error: ie } = await supabase.from("sales_items").select(itemSelect).in("bill_id", ids);
  if (ie?.message?.includes("uom_prices") || ie?.message?.includes("uom_conversion")) {
    itemSelect = "bill_id, product_id, qty, rate, unit, products(name, unit, mrp, sale_price, discount_pct)";
    ({ data: items, error: ie } = await supabase.from("sales_items").select(itemSelect).in("bill_id", ids));
  }
  if (ie?.message?.includes("unit")) {
    itemSelect = "bill_id, product_id, qty, rate, products(name, unit, mrp, discount_pct)";
    ({ data: items, error: ie } = await supabase.from("sales_items").select(itemSelect).in("bill_id", ids));
  }
  if (ie) {
    r.fail("live.sales_items", ie.message);
    return;
  }

  const byBill = new Map();
  for (const it of items ?? []) {
    const arr = byBill.get(it.bill_id) ?? [];
    arr.push(it);
    byBill.set(it.bill_id, arr);
  }

  let packBillNo = null;
  for (const b of bills) {
    const rows = byBill.get(b.id) ?? [];
    const lines = rows.map(hydrateBillLineFromDbItem);
    const sum = sumBillLineAmounts(lines);
    r.assertClose(sum, b.subtotal, `live.${b.bill_no} lines sum = subtotal`);
    for (const line of lines) {
      const wrongMrpAmt = lineAmountFromMrp({
        qty: line.qty,
        mrp: line.mrp,
        rate: line.rate,
      });
      if (Math.abs(wrongMrpAmt - line.amount) > 0.5 && line.mrp > line.rate * 2) {
        r.pass(
          `live.${b.bill_no} bill amount ≠ raw MRP calc`,
          `${line.amount} vs ${wrongMrpAmt}`,
        );
      }
    }
    if (!packBillNo && lines.some((l) => l.uom && l.uom !== "PCS")) {
      packBillNo = b.bill_no;
    }
  }
  if (packBillNo) r.pass("live.pack bill found", packBillNo);
  else r.pass("live.pack bill", "none in sample (optional)");

  return packBillNo ?? bills[0]?.bill_no;
}

// ── 4. UI: rendered bill DOM + optional screenshot ───────────────────────────
async function runUiTests(billNoHint) {
  const { chromium } = await import("playwright");
  const { loadEnvFile, loadCreds } = await import("./lib/e2e-helpers.mjs");
  const { createClient } = await import("@supabase/supabase-js");

  const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
  const env = loadEnvFile(resolve(APP, ".env.local"));
  const { email, password } = loadCreds(resolve(APP, ".e2e-credentials.local"));
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signErr) {
    r.fail("ui.signIn", signErr.message);
    return;
  }

  let billNo = billNoHint;
  if (!billNo) {
    const { data: b } = await supabase
      .from("sales_bills")
      .select("bill_no")
      .order("bill_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    billNo = b?.bill_no;
  }
  if (!billNo) {
    r.fail("ui.bill", "no bill to open");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 820, height: 1100 } });
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("you@company.com").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/app\//, { timeout: 20000 });

    await page.goto(`${BASE_URL}/app/bills/${encodeURIComponent(billNo)}`, {
      waitUntil: "domcontentloaded",
    });
    const root = page.locator("#bill-print-root");
    await root.waitFor({ timeout: 15000 });

    const tableCount = await root.locator(".bill-lines-table").count();
    if (tableCount !== 1) r.fail("ui.bill-lines-table", `count=${tableCount}`);
    else r.pass("ui.bill-lines-table present");

    const cellInner = await root.locator(".bill-lines-table .bill-cell-inner").count();
    if (cellInner < 1) r.fail("ui.bill-cell-inner", "none found");
    else r.pass("ui.bill-cell-inner on line table", String(cellInner));

    const orphanNpr = await root.locator("table + p", { hasText: /^NPR$/ }).count();
    if (orphanNpr > 0) r.fail("ui.orphan NPR label", "found under table");
    else r.pass("ui.no orphan NPR under table");

    const totalsTable = await root.locator(".bill-totals-table").count();
    if (totalsTable !== 1) r.fail("ui.bill-totals-table", `count=${totalsTable}`);
    else r.pass("ui.bill-totals-table present");

    const grandRow = await root.locator(".bill-totals-grand").count();
    if (grandRow !== 1) r.fail("ui.bill-totals-grand row", `count=${grandRow}`);
    else r.pass("ui.bill-totals-grand separator row");

    const { data: bill } = await supabase
      .from("sales_bills")
      .select("subtotal, total")
      .eq("bill_no", billNo)
      .maybeSingle();

    const lineAmounts = await root.locator(".bill-lines-table tbody tr").evaluateAll((rows) =>
      rows
        .map((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length < 2) return null;
          const name = (cells[1]?.textContent ?? "").trim();
          if (!name) return null;
          const amt = (cells[cells.length - 1]?.textContent ?? "").replace(/[^\d]/g, "");
          return Number(amt) || 0;
        })
        .filter((n) => n != null),
    );
    const uiSum = lineAmounts.reduce((a, b) => a + b, 0);
    r.assertClose(uiSum, bill?.subtotal, `ui.${billNo} table amounts sum = subtotal`);

    const grandText = await root
      .locator("tr.bill-totals-grand td.bill-totals-amount .bill-cell-inner")
      .innerText()
      .catch(() => "");
    const uiGrand = parseNpr(grandText);
    r.assertClose(uiGrand, bill?.total, `ui.${billNo} grand total matches DB total`);

    const outDir = resolve(APP, "test-output");
    mkdirSync(outDir, { recursive: true });
    const shotPath = resolve(outDir, "bill-print-ui.png");
    await root.screenshot({ path: shotPath });
    r.pass("ui.screenshot", shotPath);
  } finally {
    await browser.close();
  }
}

console.log("\n=== Bill print / PDF E2E ===\n");

runUnitTests();
runSourceTests();

let billForUi;
if (wantLive || wantUi) {
  try {
    billForUi = await runLiveTests();
  } catch (e) {
    r.fail("live.unhandled", e instanceof Error ? e.message : String(e));
  }
}

if (wantUi) {
  try {
    await runUiTests(billForUi);
  } catch (e) {
    if (String(e).includes("Cannot find package 'playwright'")) {
      r.fail("ui.playwright", "run: npm run e2e:ui:setup");
    } else if (String(e).includes("ECONNREFUSED") || String(e).includes("net::ERR")) {
      r.fail("ui.dev server", `start app: npm run dev (${process.env.BASE_URL || "http://localhost:5173"})`);
    } else {
      r.fail("ui.unhandled", e instanceof Error ? e.message : String(e));
    }
  }
} else {
  r.pass("ui.skip", "pass --ui to verify DOM + screenshot");
}

const fails = r.summary();
process.exit(fails > 0 ? 1 : 0);
