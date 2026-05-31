/**
 * Browser UI test — Phase 1 (needs `npm run dev` + E2E credentials).
 * Seeds customer/supplier/product via API for pickers; also exercises customer/product forms in UI.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { parseNpr, loadEnvFile, loadCreds } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const stamp = Date.now().toString(36).toUpperCase();

const results = [];
const ok = (n, d = "") => {
  results.push({ n, ok: true, d });
  console.log("✓", n, d ? `— ${d}` : "");
};
const bad = (n, d) => {
  results.push({ n, ok: false, d });
  console.error("✗", n, d);
};

async function pickEntity(page, placeholder, text) {
  const input = page.getByPlaceholder(placeholder).first();
  await input.waitFor({ state: "visible", timeout: 15000 });
  for (let attempt = 0; attempt < 15; attempt++) {
    await input.click();
    await input.fill(text);
    const option = page.locator("ul button").filter({ hasText: text }).first();
    try {
      await option.waitFor({ state: "visible", timeout: 3000 });
      await option.click();
      return;
    } catch {
      await input.clear();
      await page.locator(".fixed.inset-0.z-40").click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
    }
  }
  throw new Error(`Could not select "${text}" in ${placeholder}`);
}

async function sticky(page, label) {
  const btn = page.getByRole("button", { name: label });
  await btn.waitFor({ state: "visible", timeout: 45_000 });
  for (let i = 0; i < 90; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(500);
  }
  if (!(await btn.isEnabled())) {
    throw new Error(`Button "${label}" stayed disabled after load`);
  }
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
}

/** Visible Sonner toasts (errors surface save/RPC failures). */
async function sonnerText(page) {
  const loc = page.locator("[data-sonner-toast]");
  const n = await loc.count().catch(() => 0);
  const parts = [];
  for (let i = 0; i < Math.min(n, 4); i++) {
    const t = (await loc.nth(i).innerText().catch(() => "")).trim();
    if (t) parts.push(t);
  }
  return parts.join(" | ");
}

/** React Router `navigate()` only updates history — Playwright `waitForURL(..., waitUntil)` often never resolves. */
async function waitForPathnameMatch(page, predicate, timeoutMs, errLabel) {
  try {
    await page.waitForFunction(predicate, { timeout: timeoutMs });
  } catch {
    const url = page.url();
    const toast = await sonnerText(page);
    throw new Error(`${errLabel}: still at ${url}${toast ? ` | ${toast}` : ""}`);
  }
}

async function goMore(page, label) {
  await page.getByRole("link", { name: "More" }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
}

const env = loadEnvFile(resolve(APP, ".env.local"));
const { email, password } = loadCreds(resolve(APP, ".e2e-credentials.local"));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const custName = `UI Customer ${stamp}`;
const formCustName = `UI Form Customer ${stamp}`;
const suppName = `UI Supplier ${stamp}`;
const prodName = `UI Vanilla ${stamp}`;
const capName = `UI Capital ${stamp}`;
const footerText = `UI footer ${stamp}`;

console.log(`\n=== UI Phase 1 @ ${BASE_URL} ===\n`);

let tenantId = "";

const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
if (signErr) {
  bad("API signIn", signErr.message);
  process.exit(1);
}
const { data: { user } } = await supabase.auth.getUser();
const { data: tu } = await supabase.from("tenant_users").select("tenant_id").eq("user_id", user.id).maybeSingle();
tenantId = tu?.tenant_id;
if (!tenantId) {
  bad("API tenant", "no tenant_users row");
  process.exit(1);
}
ok("API signIn + tenant");

const { data: tenRow } = await supabase.from("tenants").select("status").eq("id", tenantId).maybeSingle();
if (tenRow?.status !== "active") {
  console.error(
    `\nAbort: tenant status is "${tenRow?.status ?? "unknown"}" (needs active for /app/* UI).\n` +
      `Run in Supabase SQL Editor:\n  update tenants set status = 'active' where id = '${tenantId}';\n` +
      `Or apply migration 0004 (dev) or re-run create-e2e-user-and-test.mjs with SUPABASE_SERVICE_ROLE_KEY.\n`,
  );
  process.exit(1);
}

// Customer for sale/payment flows (API — avoids picker race before domain bundle loads)
const { error: cErr } = await supabase.from("customers").insert({
  tenant_id: tenantId,
  name: custName,
  phone: "9800111000",
  area: "UI Area",
  credit_limit: 50000,
  opening_balance: 0,
}).select("id").single();
if (cErr) bad("API seed customer", cErr.message);
else ok("API seed customer", custName);

const { error: sErr } = await supabase.from("suppliers").insert({
  tenant_id: tenantId,
  name: suppName,
  phone: "9811111112",
}).select("id").single();
if (sErr) bad("API seed supplier", sErr.message);
else ok("API seed supplier", suppName);

const { error: pErr } = await supabase.from("products").insert({
  tenant_id: tenantId,
  code: `UI-${stamp}`,
  name: prodName,
  category: "Ice Cream",
  unit: "PCS",
  purchase_price: 80,
  sale_price: 100,
  mrp: 120,
  discount_pct: 0,
  vat_applicable: false,
  min_qty: 10,
  is_active: true,
}).select("id").single();
if (pErr) bad("API seed product", pErr.message);
else ok("API seed product", prodName);

try {
  const ping = await fetch(BASE_URL);
  if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
  ok("dev server");
} catch (e) {
  bad("dev server", e.message);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/home/, { timeout: 20000 });
  ok("1. login");

  await page.goto(`${BASE_URL}/app/settings`, { waitUntil: "networkidle" });
  await page.getByText("Loading…").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  const billFooter = page.locator("textarea").first();
  if ((await billFooter.count()) > 0) {
    await billFooter.fill(footerText);
  }
  await sticky(page, "Save settings");
  await page.getByText(/Settings saved/i).waitFor({ timeout: 10000 });
  ok("2. settings");

  await page.goto(`${BASE_URL}/app/customers/new`, { waitUntil: "networkidle" });
  await page.getByPlaceholder(/Ghantaghar/i).fill(formCustName);
  await page.locator('input[type="tel"]').first().fill("9800333444");
  await page.locator("label").filter({ hasText: "Area" }).locator("..").locator("input").fill("UI Test Area");
  await sticky(page, "Add customer");
  await page.waitForURL(/\/app\/customers/, { timeout: 15000 });
  ok("2b. customer form", formCustName);

  await page.goto(`${BASE_URL}/app/products/new`, { waitUntil: "networkidle" });
  const uiProdName = `UI Form ${stamp}`;
  await page.getByPlaceholder(/Vanilla/i).fill(uiProdName);
  await page.locator("label").filter({ hasText: "Buy price" }).locator("..").locator("input").fill("80");
  await page.locator("label").filter({ hasText: "Sell price excl" }).locator("..").locator("input").fill("100");
  await sticky(page, "Add product");
  await page.waitForURL(/\/app\/products/, { timeout: 15000 });
  ok("3. product form", uiProdName);

  await page.goto(`${BASE_URL}/app/sales/new`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Search customers").waitFor({ state: "visible", timeout: 20000 });
  await pickEntity(page, "Search customers", custName);
  await pickEntity(page, "Search product", prodName);
  await page.locator("div").filter({ hasText: /^Qty$/ }).locator('input[type="number"]').fill("5");
  const expectedUiTotal = 500;
  const saleSticky = page.locator(".fixed.bottom-16").filter({
    has: page.getByRole("button", { name: "Save bill" }),
  });
  const uiGrandText = await saleSticky
    .locator("div.flex.items-center")
    .filter({ has: page.getByText("Grand total", { exact: true }) })
    .locator("span.font-semibold")
    .first()
    .textContent();
  const uiGrand = parseNpr(uiGrandText);
  if (Math.abs(uiGrand - expectedUiTotal) > 0.5) {
    throw new Error(`UI grand total expected ${expectedUiTotal}, got ${uiGrand} (${uiGrandText})`);
  }
  ok("4a. sale UI grand total", String(uiGrand));

  const dueField = page.locator("label").filter({ hasText: "Due date" }).locator("..").locator('input[type="date"]');
  if ((await dueField.count()) > 0) await dueField.fill(new Date().toISOString().slice(0, 10));
  await sticky(page, "Save bill");
  await waitForPathnameMatch(
    page,
    () => /^\/app\/bills\/.+/.test(window.location.pathname),
    20000,
    "after Save bill",
  );
  const billNo = decodeURIComponent(page.url().match(/\/bills\/([^?]+)/)?.[1] ?? "");
  const { data: billRow } = await supabase.from("sales_bills").select("total").eq("bill_no", billNo).maybeSingle();
  if (!billRow || Math.abs(Number(billRow.total) - expectedUiTotal) > 0.5) {
    throw new Error(`DB total expected ${expectedUiTotal}, got ${billRow?.total}`);
  }
  ok("4b. sale DB total matches UI", billNo);

  if (!(await page.getByText(footerText).isVisible().catch(() => false))) {
    await page.goto(`${page.url().split("?")[0]}?print=1`, { waitUntil: "networkidle" });
  }
  await page.getByText(footerText).waitFor({ timeout: 10000 });
  ok("4c. bill print footer", footerText);

  // Leave ?print=1 so window.print() can't steal focus / block the next clicks.
  await page.goto(`${BASE_URL}/app/bills/${encodeURIComponent(billNo)}`, { waitUntil: "domcontentloaded" });

  await page.locator("button:has(svg.lucide-pencil)").click();
  await waitForPathnameMatch(
    page,
    () => /\/app\/sales\/edit\//.test(window.location.pathname),
    15000,
    "open bill edit (pencil)",
  );
  const updateBtn = page.getByRole("button", { name: "Update bill" });
  for (let i = 0; i < 40 && !(await updateBtn.isEnabled()); i++) {
    await page.waitForTimeout(500);
  }
  if (await updateBtn.isEnabled()) {
    // Change qty so RPC must persist new lines + totals (not a no-op).
    const qtyEdit = page.locator("div").filter({ hasText: /^Qty$/ }).locator('input[type="number"]').first();
    await qtyEdit.fill("6");
    const saleStickyEdit = page.locator(".fixed.bottom-16").filter({
      has: page.getByRole("button", { name: "Update bill" }),
    });
    const grandAfterEditText = await saleStickyEdit
      .locator("div.flex.items-center")
      .filter({ has: page.getByText("Grand total", { exact: true }) })
      .locator("span.font-semibold")
      .first()
      .textContent();
    const expectedAfterEdit = 600; /* 6 × 100, no bill VAT on seeded product */
    const grandAfterEdit = parseNpr(grandAfterEditText);
    if (Math.abs(grandAfterEdit - expectedAfterEdit) > 0.5) {
      throw new Error(`Edit screen grand total expected ${expectedAfterEdit}, got ${grandAfterEdit} (${grandAfterEditText})`);
    }
    const rpcWait = page.waitForResponse(
      (r) => r.url().includes("update_sales_bill") && r.request().method() === "POST",
      { timeout: 30_000 },
    );
    await sticky(page, "Update bill");
    let rpcResp;
    try {
      rpcResp = await rpcWait;
    } catch {
      const toast = await sonnerText(page);
      throw new Error(
        `No update_sales_bill response (save may not have run). url=${page.url()}${toast ? ` | ${toast}` : ""}`,
      );
    }
    const rpcBody = await rpcResp.text().catch(() => "");
    if (!rpcResp.ok()) {
      const toast = await sonnerText(page);
      throw new Error(
        `update_sales_bill HTTP ${rpcResp.status()}: ${rpcBody.slice(0, 800)}${toast ? ` | ${toast}` : ""}`,
      );
    }
    await waitForPathnameMatch(
      page,
      () => /^\/app\/bills\/.+/.test(window.location.pathname),
      15_000,
      "after Update bill",
    );
    if (await page.getByText(/Could not save bill/i).isVisible().catch(() => false)) {
      throw new Error("Update bill failed (error toast)");
    }
    const { data: billEdited } = await supabase
      .from("sales_bills")
      .select("total, subtotal")
      .eq("bill_no", billNo)
      .maybeSingle();
    if (!billEdited || Math.abs(Number(billEdited.total) - expectedAfterEdit) > 0.5) {
      throw new Error(`DB total after edit expected ${expectedAfterEdit}, got ${billEdited?.total}`);
    }
    if (Math.abs(Number(billEdited.subtotal) - expectedAfterEdit) > 0.5) {
      throw new Error(`DB subtotal after edit expected ${expectedAfterEdit}, got ${billEdited?.subtotal}`);
    }
    ok("4d. bill edit updates line + DB (update_sales_bill)", billNo);
  } else {
    ok("4d. bill update", "Update disabled (bill not hydrated)");
  }

  ok("4. sale");

  await page.goto(`${BASE_URL}/app/payments/new`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await pickEntity(page, "Search customers", custName);
  await page.waitForTimeout(1500);
  const noBills = await page.getByText("No open bills").isVisible().catch(() => false);
  if (noBills) throw new Error("No open bills after sale — refresh sales data or check bill balance");
  await page.getByText("Apply to bills").waitFor({ timeout: 15000 });
  await page.getByText("Select all").click();
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByRole("button", { name: "Save payment" }).click();
  await page.waitForTimeout(2500);
  ok("5. payment");

  await goMore(page, "Return");
  await page.waitForLoadState("networkidle");
  await pickEntity(page, "Search customers", custName);
  const billInput = page.getByPlaceholder("Select bill");
  await billInput.click();
  await page.locator("ul button").first().click();
  await page.locator("button:has(svg.lucide-plus)").first().click();
  await sticky(page, "Save return");
  await page.waitForTimeout(2500);
  ok("6. return");

  await goMore(page, "Purchase");
  await page.waitForLoadState("networkidle");
  await pickEntity(page, "Search supplier", suppName);
  await pickEntity(page, "Search product", prodName);
  await page.locator("label").filter({ hasText: "Cost / unit" }).locator("..").locator("input").fill("80");
  await sticky(page, "Save purchase");
  await page.waitForTimeout(2500);
  ok("7. purchase");

  await goMore(page, "Supplier pay");
  await page.waitForLoadState("networkidle");
  await pickEntity(page, "Search supplier", suppName);
  await page.locator('input[type="number"]').first().fill("500");
  await sticky(page, "Save payment");
  await page.waitForTimeout(2500);
  ok("8. supplier payment");

  await goMore(page, "Expense");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="number"]').first().fill("99");
  await sticky(page, "Save expense");
  await page.waitForURL(/\/app\/home/, { timeout: 15000 });
  ok("9. expense");

  await goMore(page, "Damage");
  await page.waitForLoadState("networkidle");
  await pickEntity(page, "Search product", prodName);
  await sticky(page, "Save damage");
  await page.waitForURL(/\/app\/home/, { timeout: 15000 });
  ok("10. damage");

  await page.goto(`${BASE_URL}/app/products`, { waitUntil: "networkidle" });
  const productSearch = page.getByPlaceholder(/Search/i).first();
  if ((await productSearch.count()) > 0) {
    await productSearch.fill(prodName);
    await page.waitForTimeout(500);
  }
  await page.getByText(prodName).first().waitFor({ timeout: 15000 });
  ok("11. product list", prodName);

  await page.goto(`${BASE_URL}/app/capital/new`, { waitUntil: "networkidle" });
  await page.locator("label").filter({ hasText: "Type" }).locator("..").locator("select").selectOption("owner_capital");
  await page.locator("label").filter({ hasText: "Name / description" }).locator("..").locator("input").fill(capName);
  await page.locator("label").filter({ hasText: /Amount invested/ }).locator("..").locator('input[type="number"]').fill("15000");
  await sticky(page, "Save entry");
  await page.waitForURL(/\/app\/capital\/?$/, { timeout: 15000 });
  await page.getByText(capName).waitFor({ timeout: 10000 });
  ok("12. capital entry", capName);

  await goMore(page, "Daily cash");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Save draft/i }).click();
  await page.getByText(/draft saved/i).waitFor({ timeout: 10000 });
  ok("13. daily cash draft");

  await goMore(page, "Scheme");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder(/Summer mango/i).fill(`UI Scheme ${stamp}`);
  await pickEntity(page, "Search product", prodName);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);
  await page.locator("label").filter({ hasText: "End date" }).locator("..").locator('input[type="date"]').fill(endDate.toISOString().slice(0, 10));
  await page.locator("label").filter({ hasText: /Discount %/ }).locator("..").locator("input").fill("5");
  await sticky(page, "Save scheme");
  await page.waitForURL(/\/app\/home/, { timeout: 15000 });
  ok("14. scheme save");
} catch (e) {
  bad("UI flow", e.message);
  await page.screenshot({ path: resolve(__dirname, "../.e2e-ui-failure.png"), fullPage: true });
  console.error("Screenshot saved: app/.e2e-ui-failure.png");
} finally {
  await browser.close();
  await supabase.auth.signOut({ scope: "local" });
}

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} passed\n`);
process.exit(fails ? 1 : 0);
