/**
 * Capture real app UI for the marketing landing page.
 *
 *   npm run capture:marketing
 *
 * Writes: desktop-dashboard.png (hero), mobile-dashboard.png, mobile-bill.png, mobile-sales-new.png, …
 */
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { createE2eReporter, loadEnvFile, loadCreds } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const OUT = resolve(APP, "public/marketing");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
/** Narrow doc width so print layouts fit without transform clipping */
const DOC_WIDTH_PX = 348;

const MARKETING_BRAND = {
  shopName: "Shree Bajrang Traders",
  legalName: "Shree Bajrang Traders",
  region: "Birgunj",
  district: "Parsa",
  province: "Madhesh",
  billFooter: "धन्यवाद / Thank you for your business.",
};

const MARKETING_CUSTOMER = {
  name: "Ramdev General Store",
  phone: "9841234567",
  area: "Birgunj",
};

const MARKETING_SUPPLIER = {
  name: "Himalayan FMCG Suppliers",
  phone: "9812345678",
  address_line1: "Industrial Road, Birgunj",
  district: "Parsa",
};

const r = createE2eReporter("Marketing screenshots");

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/app\//, { timeout: 25000 });
}

async function applyMarketingBranding(supabase) {
  const { data: tu, error: tuErr } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .limit(1)
    .maybeSingle();
  if (tuErr || !tu?.tenant_id) {
    r.fail("tenant", tuErr?.message ?? "no tenant_users row");
    return false;
  }

  const { error: settingsErr } = await supabase
    .from("tenant_settings")
    .update({
      name: MARKETING_BRAND.shopName,
      legal_name: MARKETING_BRAND.legalName,
      region: MARKETING_BRAND.region,
      district: MARKETING_BRAND.district,
      province: MARKETING_BRAND.province,
      bill_footer: MARKETING_BRAND.billFooter,
      default_vat_pct: 13,
      vat_registered: true,
    })
    .eq("tenant_id", tu.tenant_id);
  if (settingsErr) {
    r.fail("branding", settingsErr.message);
    return false;
  }

  const { data: customers } = await supabase.from("customers").select("id, name").limit(30);
  for (const c of customers ?? []) {
    if (/E2E|Demo|Stock|test|Matrix/i.test(String(c.name ?? ""))) {
      await supabase.from("customers").update(MARKETING_CUSTOMER).eq("id", c.id);
    }
  }

  const { data: suppliers } = await supabase.from("suppliers").select("id, name").limit(50);
  for (const s of suppliers ?? []) {
    if (/E2E|Demo|Stock|test|Matrix|Suppliers/i.test(String(s.name ?? ""))) {
      await supabase.from("suppliers").update(MARKETING_SUPPLIER).eq("id", s.id);
    }
  }

  r.pass("marketing branding", MARKETING_BRAND.shopName);
  return true;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function sumInPeriod(supabase, table, dateCol, totalCol, from, to) {
  const { data, error } = await supabase
    .from(table)
    .select(totalCol)
    .gte(dateCol, from)
    .lte(dateCol, to);
  if (error) return 0;
  return (data ?? []).reduce((a, row) => a + Number(row[totalCol] ?? 0), 0);
}

async function createMarketingSale(supabase, { customerId, productId, rate, qty, billDate, mode = "Credit" }) {
  const subtotal = qty * rate;
  const vat = Math.round(subtotal * 0.13);
  const discount = mode === "Credit" ? Math.min(200, Math.round(subtotal * 0.02)) : 0;
  const total = subtotal - discount + vat;
  const { error } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: billDate,
    p_payment_mode: mode,
    p_discount: discount,
    p_items: [{ product_id: productId, qty, rate }],
    p_paid: mode === "Cash" ? total : Math.round(total * 0.35),
    p_notes: "Marketing dashboard capture",
    p_vat_amount: vat,
    p_extra_charges: 0,
  });
  return error;
}

async function ensureStockForSale(supabase, { supplierId, productId, buyRate }) {
  const { error } = await supabase.rpc("record_purchase", {
    p_purchase_date: todayIso(),
    p_supplier_id: supplierId,
    p_lines: [{ product_id: productId, qty: 100, rate_excl: buyRate }],
    p_notes: "Marketing dashboard — stock for capture",
  });
  return error;
}

/** Sales today + healthy period totals (sales ≥ purchases) for dashboard hero. */
async function ensureMarketingDashboardData(supabase) {
  const today = todayIso();
  const periodFrom = daysAgoIso(90);

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, sale_price, purchase_price")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pErr || !product?.id) {
    r.fail("dashboard seed", pErr?.message ?? "no products — run npm run seed:demo");
    return false;
  }

  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (cErr || !customer?.id) {
    r.fail("dashboard seed", cErr?.message ?? "no customers");
    return false;
  }

  const { data: supplier, error: sErr } = await supabase
    .from("suppliers")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (sErr || !supplier?.id) {
    r.fail("dashboard seed", sErr?.message ?? "no suppliers");
    return false;
  }

  const rate = Number(product.sale_price) || Number(product.purchase_price) || 280;
  const buyRate = Math.max(1, Math.round(rate * 0.7));

  async function saleWithStock(opts) {
    let err = await createMarketingSale(supabase, { ...opts, productId: product.id, rate });
    if (err?.message?.includes("Insufficient stock")) {
      const stockErr = await ensureStockForSale(supabase, {
        supplierId: supplier.id,
        productId: product.id,
        buyRate,
      });
      if (stockErr) return stockErr;
      err = await createMarketingSale(supabase, { ...opts, productId: product.id, rate });
    }
    return err;
  }

  const todaySales = await sumInPeriod(supabase, "sales_bills", "bill_date", "total", today, today);
  if (todaySales < 1000) {
    const err = await saleWithStock({
      customerId: customer.id,
      qty: 18,
      billDate: today,
      mode: "Credit",
    });
    if (err) {
      r.fail("dashboard today sale", err.message);
      return false;
    }
    r.pass("dashboard today sale");
  }

  let salesSum = await sumInPeriod(supabase, "sales_bills", "bill_date", "total", periodFrom, today);
  const purchaseSum = await sumInPeriod(supabase, "purchases", "purchase_date", "total", periodFrom, today);
  const targetSales = Math.max(purchaseSum * 1.15, 350_000);
  let added = 0;
  while (salesSum < targetSales && added < 5) {
    const billDate = daysAgoIso(7 + added * 11);
    const err = await saleWithStock({
      customerId: customer.id,
      qty: 24 + added * 4,
      billDate,
      mode: added % 2 === 0 ? "Cash" : "Credit",
    });
    if (err) {
      r.fail("dashboard period sale", err.message);
      return false;
    }
    salesSum = await sumInPeriod(supabase, "sales_bills", "bill_date", "total", periodFrom, today);
    added += 1;
  }
  if (added > 0) r.pass(`dashboard period sales (+${added})`);

  const { count: payToday } = await supabase
    .from("customer_payments")
    .select("id", { count: "exact", head: true })
    .eq("payment_date", today);
  if (!payToday) {
    const { error: payErr } = await supabase.rpc("apply_customer_payment", {
      p_payment_date: today,
      p_customer_id: customer.id,
      p_amount: 28_500,
      p_mode: "Cash",
      p_notes: "Marketing dashboard — collection",
      p_allocations: [],
    });
    if (payErr) r.fail("dashboard collection", payErr.message);
    else r.pass("dashboard today collection");
  }

  return true;
}

async function closeDrawerIfOpen(page) {
  const close = page.getByRole("button", { name: /close menu/i });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.waitForTimeout(300);
  }
}

async function openDrawerForShot(page) {
  const open = page.getByRole("button", { name: /open menu/i });
  await open.click();
  await page.getByRole("dialog", { name: /main menu/i }).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(400);
}

async function prepDashboardMobile(page) {
  await page.getByRole("heading", { name: /business dashboard/i }).waitFor({ state: "visible", timeout: 20000 });
  await closeDrawerIfOpen(page);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector("nav.bottom-tabs")?.remove();
  });
  await page.waitForTimeout(500);
}

async function prepDashboardDesktopWithMenu(page) {
  await page.getByRole("heading", { name: /business dashboard/i }).waitFor({ state: "visible", timeout: 20000 });
  await closeDrawerIfOpen(page);
  await openDrawerForShot(page);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector("nav.bottom-tabs")?.remove();
    const overlay = document.querySelector('[aria-hidden]');
    const aside = document.querySelector('aside[aria-label="Main menu"]');
    if (aside instanceof HTMLElement) {
      aside.style.width = "min(280px, 34vw)";
      aside.style.maxHeight = "100vh";
    }
    const nav = aside?.querySelector("nav");
    if (nav instanceof HTMLElement) nav.scrollTop = 0;
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) main.style.paddingBottom = "1rem";
  });
  await page.waitForTimeout(600);
}

async function shotDashboardMobile(page, filePath) {
  await prepDashboardMobile(page);
  await page.screenshot({ path: filePath, animations: "disabled" });
}

async function shotDashboardDesktop(page, filePath) {
  await prepDashboardDesktopWithMenu(page);
  await page.screenshot({ path: filePath, animations: "disabled" });
}

async function pickMarketingBill(supabase) {
  const { data: rows, error } = await supabase
    .from("sales_bills")
    .select("bill_no, vat_amount, discount, subtotal")
    .order("bill_date", { ascending: false })
    .limit(40);

  if (error) {
    r.fail("bill query", error.message);
    return null;
  }
  if (!rows?.length) return null;

  return (
    rows.find((b) => Number(b.vat_amount) > 0 && Number(b.discount) > 0) ??
    rows.find((b) => Number(b.vat_amount) > 0) ??
    rows[0]
  );
}

async function pickMarketingPurchase(supabase) {
  const { data: rows, error } = await supabase
    .from("purchases")
    .select("id, vat_amount, total")
    .order("purchase_date", { ascending: false })
    .limit(30);

  if (error) {
    r.fail("purchase query", error.message);
    return null;
  }
  if (!rows?.length) return null;

  return rows.find((p) => Number(p.vat_amount) > 0 && Number(p.total) > 0) ?? rows[0];
}

/** Fit A4-style print roots into phone marketing frame — no CSS transform (avoids clipped totals). */
async function shotPrintDocument(page, rootId, filePath) {
  const root = page.locator(`#${rootId}`);
  await root.waitFor({ state: "visible", timeout: 20000 });

  await page.evaluate(
    ({ id, width }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transform = "none";
      el.style.width = `${width}px`;
      el.style.maxWidth = `${width}px`;
      el.style.minWidth = "0";
      el.style.margin = "0 auto";
      el.style.overflow = "visible";
      el.style.boxSizing = "border-box";
      for (const table of el.querySelectorAll("table")) {
        table.style.minWidth = "0";
        table.style.width = "100%";
        table.style.tableLayout = "fixed";
      }
      const main = el.closest("main");
      if (main) {
        main.style.overflow = "visible";
        main.style.padding = "12px 8px";
        main.style.background = "#f8fafc";
      }
    },
    { id: rootId, width: DOC_WIDTH_PX },
  );

  await page.waitForTimeout(500);
  await root.scrollIntoViewIfNeeded();
  await root.screenshot({
    path: filePath,
    animations: "disabled",
    padding: { top: 16, bottom: 16, left: 12, right: 12 },
  });
}

async function shotApp(page, filePath) {
  const main = page.locator("main").first();
  await main.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(500);
  await main.screenshot({ path: filePath, animations: "disabled" });
}

/** Bill detail — include fixed Share / Print / PDF bar (outside `main`). */
async function shotBillDetailHero(page, filePath) {
  await page.getByRole("button", { name: "Share" }).waitFor({ state: "visible", timeout: 20000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: filePath, animations: "disabled" });
}

async function run() {
  mkdirSync(OUT, { recursive: true });

  let env;
  let creds;
  try {
    env = loadEnvFile(resolve(APP, ".env.local"));
    creds = loadCreds(resolve(APP, ".e2e-credentials.local"));
  } catch (e) {
    r.fail("setup", e instanceof Error ? e.message : String(e));
    return r.summary();
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { error: signErr } = await supabase.auth.signInWithPassword(creds);
  if (signErr) {
    r.fail("signIn", signErr.message);
    return r.summary();
  }
  r.pass("signIn");

  if (!(await applyMarketingBranding(supabase))) {
    return r.summary();
  }

  if (!(await ensureMarketingDashboardData(supabase))) {
    return r.summary();
  }

  const bill = await pickMarketingBill(supabase);
  const purchase = await pickMarketingPurchase(supabase);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();

  try {
    await login(page, creds.email, creds.password);
    await page.setViewportSize(MOBILE);

    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
    await shotDashboardMobile(page, resolve(OUT, "mobile-dashboard.png"));
    r.pass("mobile-dashboard.png", MARKETING_BRAND.shopName);

    await page.setViewportSize(DESKTOP);
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
    await page.reload({ waitUntil: "networkidle", timeout: 45000 });
    await shotDashboardDesktop(page, resolve(OUT, "desktop-dashboard.png"));
    r.pass("desktop-dashboard.png menu open", MARKETING_BRAND.shopName);

    await page.setViewportSize(MOBILE);

    if (bill?.bill_no) {
      await page.goto(`${BASE_URL}/app/bills/${encodeURIComponent(bill.bill_no)}`, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      await shotBillDetailHero(page, resolve(OUT, "mobile-bill.png"));
      r.pass(
        `mobile-bill.png bill detail + Share/Print/PDF (VAT ${bill.vat_amount ?? 0}${Number(bill.discount) > 0 ? ", disc" : ""})`,
        bill.bill_no,
      );
    } else {
      r.fail("mobile-bill.png", "no sales bill");
    }

    await page.goto(`${BASE_URL}/app/sales/new`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(800);
    await shotApp(page, resolve(OUT, "mobile-sales-new.png"));
    r.pass("mobile-sales-new.png");

    await page.goto(`${BASE_URL}/app/home?tab=stock`, { waitUntil: "networkidle", timeout: 45000 });
    await shotApp(page, resolve(OUT, "mobile-inventory.png"));
    r.pass("mobile-inventory.png");

    if (purchase?.id) {
      const { data: purRow } = await supabase
        .from("purchases")
        .select("supplier_id")
        .eq("id", purchase.id)
        .maybeSingle();
      if (purRow?.supplier_id) {
        await supabase.from("suppliers").update(MARKETING_SUPPLIER).eq("id", purRow.supplier_id);
      }
      await page.goto(`${BASE_URL}/app/purchases/${encodeURIComponent(purchase.id)}`, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      await shotPrintDocument(page, "purchase-bill-print-root", resolve(OUT, "mobile-purchase.png"));
      const hasVat = Number(purchase.vat_amount) > 0;
      r.pass(`mobile-purchase.png${hasVat ? " (13% VAT)" : ""}`, purchase.id);
    } else {
      r.fail("mobile-purchase.png", "no purchase — create one with VAT in app");
    }

    await page.goto(`${BASE_URL}/app/home?tab=customers`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(600);
    await shotApp(page, resolve(OUT, "mobile-customers.png"));
    r.pass("mobile-customers.png");
  } catch (e) {
    r.fail("capture", e instanceof Error ? e.message : String(e));
  } finally {
    await browser.close();
  }

  return r.summary();
}

run().then((code) => process.exit(code));
