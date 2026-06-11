/**
 * Phase 0 Tier C — shell, support, Share, migrations 0025/0026, Home tabs.
 *
 * Usage:
 *   npm run e2e:tier-c           # source + route wiring (no login)
 *   npm run e2e:tier-c:live      # + live DB column checks + customer PAN/VAT round-trip
 *
 * Env: app/.env.local (+ .e2e-credentials.local for --live)
 *
 * On Tier C / shell / patterns / bill actions: add/update checks here (same PR).
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

const r = createE2eReporter("Phase 0 Tier C");

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

function runSourceChecks() {
  readMig("0025_tenant_support_contacts.sql");
  readMig("0026_customer_tax_ids.sql");

  const mig26 = readFileSync(resolve(MIG, "0026_customer_tax_ids.sql"), "utf8");
  if (mig26.includes("pan_number") && mig26.includes("vat_number")) {
    r.pass("0026 adds customers.pan_number + vat_number");
  } else {
    r.fail("0026 schema", "expected pan_number, vat_number");
  }

  const router = readSrc("routes/AppRouter.tsx");
  if (router) {
    for (const path of ["reports", "support", 'path="more"']) {
      if (router.includes(path)) r.pass(`AppRouter ${path}`);
      else r.fail(`AppRouter ${path}`, "missing");
    }
    if (router.includes('path="customers"') && router.includes("CustomersPage")) {
      r.pass("AppRouter /app/customers → CustomersPage");
    } else {
      r.fail("AppRouter customers route", "expected CustomersPage");
    }
    if (router.includes('Navigate to="/app/products"') && router.includes('path="stock"')) {
      r.pass("AppRouter /app/stock → /app/products");
    } else {
      r.fail("AppRouter stock redirect", "expected /app/products");
    }
    if (router.includes("SupplierDetailPage")) {
      r.pass("AppRouter supplier detail route");
    } else {
      r.fail("AppRouter supplier detail", "missing SupplierDetailPage");
    }
  }

  const nav = readSrc("config/appNavigation.ts");
  if (nav) {
    if (nav.includes("isHomeTabActive") && nav.includes("isCustomersTabActive")) {
      r.pass("appNavigation tab active helpers");
    } else {
      r.fail("appNavigation", "missing tab helpers");
    }
    if (nav.includes("/app/support") && nav.includes("BikriKhata support")) {
      r.pass("drawer Support → /app/support");
    } else {
      r.fail("drawer support link", "missing");
    }
    if (
      nav.includes("New product") &&
      nav.includes("New customer") &&
      nav.includes("New supplier") &&
      nav.includes("QUICK_ENTRY_ACTIONS")
    ) {
      r.pass("QUICK_ENTRY_ACTIONS includes new masters");
    } else {
      r.fail("QUICK_ENTRY_ACTIONS masters", "missing");
    }
    if (nav.includes('label: "Stock", to: "/app/products"') && !nav.includes('label: "Products"')) {
      r.pass("NAV drawer single Stock hub (no duplicate Products)");
    } else {
      r.fail("NAV Stock hub", "expected one Stock item to /app/products");
    }
  }

  const shell = readSrc("components/layout/AppShell.tsx");
  if (shell) {
    if (shell.includes('label: "Home"') && shell.includes('label: "Reports"')) {
      r.pass("AppShell bottom tabs Home + Reports");
    } else {
      r.fail("AppShell tabs", "missing labels");
    }
    if (shell.includes('label: "Customers"') && shell.includes('to: "/app/customers"')) {
      r.pass("AppShell Customers tab → /app/customers");
    } else {
      r.fail("AppShell Customers tab", "missing");
    }
    if (shell.includes('label: "Stock"') && shell.includes('to: "/app/products"')) {
      r.pass("AppShell Stock tab → /app/products");
    } else {
      r.fail("AppShell Stock tab", "missing");
    }
    if (shell.includes("AppNavDrawer")) {
      r.pass("AppShell mounts AppNavDrawer");
    } else {
      r.fail("AppShell drawer", "missing");
    }
  }

  const drawer = readSrc("components/layout/AppNavDrawer.tsx");
  if (drawer && drawer.includes("NAV_DRAWER_GROUPS")) {
    r.pass("AppNavDrawer uses NAV_DRAWER_GROUPS");
  }

  const productsPage = readSrc("pages/products/ProductsPage.tsx");
  if (productsPage?.includes('title="Stock"') && productsPage.includes("Add purchase")) {
    r.pass("ProductsPage Stock hub + Add purchase");
  } else if (productsPage) {
    r.fail("ProductsPage Stock hub", "missing Stock title or Add purchase");
  }
  if (productsPage?.includes("useProductBrowse")) {
    r.pass("ProductsPage shared useProductBrowse hook");
  }

  const money = readSrc("lib/money.ts");
  if (money?.includes("numericPriceProps") && money?.includes("PRICE_DECIMAL_PLACES = 4")) {
    r.pass("numericPriceProps 4-decimal product prices");
  } else if (money) {
    r.fail("numericPriceProps", "missing 4-decimal price props");
  }

  const entityList = readSrc("components/app/EntityListCard.tsx");
  if (entityList?.includes("EntityList") && entityList.includes("py-2.5")) {
    r.pass("EntityList compact mobile rows");
  } else if (entityList) {
    r.fail("EntityListCard", "missing compact EntityList pattern");
  }

  const dateDisplay = readSrc("components/app/DateDisplay.tsx");
  if (dateDisplay?.includes("compact") && dateDisplay.includes("toMiti")) {
    r.pass("DateDisplay compact dual dates");
  } else if (dateDisplay) {
    r.fail("DateDisplay compact", "missing");
  }

  const dateField = readSrc("components/app/DateFormField.tsx");
  if (dateField?.includes("DateDisplay") && dateField.includes('type="date"') && dateField.includes("compact")) {
    r.pass("DateFormField picker + BS/AD line");
  } else if (dateField) {
    r.fail("DateFormField", "missing dual date below picker");
  }

  const tax = readSrc("lib/tax.ts");
  if (tax?.includes("addVatToExclPrice") && tax?.includes("PRICE_DECIMAL_PLACES")) {
    r.pass("tax.ts 4-decimal product VAT helpers");
  } else if (tax) {
    r.fail("tax.ts price precision", "missing addVatToExclPrice");
  }

  const saleLinePricing = readSrc("components/app/SaleLinePricingBlock.tsx");
  if (saleLinePricing?.includes("numericPriceProps")) {
    r.pass("SaleLinePricingBlock 4-decimal MRP/sell");
  } else if (saleLinePricing) {
    r.fail("SaleLinePricingBlock", "expected numericPriceProps");
  }

  const supportForm = readSrc("components/app/AppSupportInquiryForm.tsx");
  if (supportForm?.includes("Select") && !supportForm.includes("rounded-xl border px-3.5 py-3")) {
    r.pass("AppSupportInquiryForm dropdown message type");
  } else if (supportForm) {
    r.fail("AppSupportInquiryForm", "expected Select dropdown for message type");
  }

  const supportPage = readSrc("pages/support/SupportPage.tsx");
  if (supportPage?.includes("PLATFORM_SUPPORT")) {
    r.pass("SupportPage uses PLATFORM_SUPPORT");
  } else if (supportPage) {
    r.fail("SupportPage", "missing PLATFORM_SUPPORT");
  }
  if (supportPage?.includes("PlatformSupportChannels") && supportPage.includes("AppSupportInquiryForm")) {
    r.pass("SupportPage contact form + channels");
  } else if (supportPage) {
    r.fail("SupportPage form", "missing AppSupportInquiryForm or PlatformSupportChannels");
  }

  const settings = readSrc("pages/settings/SettingsPage.tsx");
  if (settings) {
    if (!settings.includes('id: "support"') && !settings.includes('label: "Support"')) {
      r.pass("Settings has no Support tab");
    } else {
      r.fail("Settings Support tab", "should be menu-only");
    }
  }

  const billDetail = readSrc("pages/bills/BillDetailPage.tsx");
  if (billDetail) {
    if (billDetail.includes("PageActionBar") && billDetail.includes('label: "Share"')) {
      r.pass("BillDetailPage Share via PageActionBar");
    } else {
      r.fail("BillDetailPage Share", "missing PageActionBar Share");
    }
    if (!billDetail.includes("WhatsApp")) {
      r.pass("BillDetailPage no WhatsApp label");
    } else {
      r.fail("BillDetailPage WhatsApp", "should be Share only");
    }
    if (billDetail.includes('variant: "primary"') && billDetail.includes("Collect")) {
      r.pass("BillDetailPage Collect uses primary variant");
    } else {
      r.fail("BillDetailPage Collect", "missing primary Collect");
    }
  }

  const home = readSrc("pages/home/HomePage.tsx");
  if (home) {
    if (
      home.includes("HOME_QUICK_ACTIONS") &&
      home.includes("HOME_OVERVIEW_SECTIONS") &&
      home.includes("DateDisplay")
    ) {
      r.pass("HomePage ops dashboard + quick actions");
    } else {
      r.fail("HomePage dashboard", "missing HOME_QUICK_ACTIONS, HOME_OVERVIEW_SECTIONS, or DateDisplay");
    }
    if (home.includes("Needs attention") && home.includes("Today")) {
      r.pass("HomePage today + attention sections");
    } else {
      r.fail("HomePage KPI sections", "missing");
    }
  }

  if (dateDisplay?.includes("fmtDate")) {
    r.pass("DateDisplay BS + AD base");
  }

  const patterns = readSrc("components/app/patterns.tsx");
  if (patterns && patterns.includes("ListPageHeader") && patterns.includes("FormPageHeader")) {
    r.pass("patterns.tsx reusable chrome");
  } else if (patterns) {
    r.fail("patterns.tsx", "incomplete exports");
  }

  const paymentPage = readSrc("pages/payments/PaymentPage.tsx");
  if (paymentPage?.includes("FormPageHeader")) r.pass("UI-1 PaymentPage FormPageHeader");
  else r.fail("UI-1 PaymentPage", "missing FormPageHeader");
  if (paymentPage?.includes("Advance only") && paymentPage?.includes("commitAdvancePayment")) {
    r.pass("ADV-1 PaymentPage advance tab + commitAdvancePayment");
  } else {
    r.fail("ADV-1 PaymentPage", "missing advance tab or commitAdvancePayment");
  }

  const customerDetail = readSrc("pages/customers/CustomerDetailPage.tsx");
  if (customerDetail?.includes("useCustomerBills") && customerDetail?.includes("reversePayment")) {
    r.pass("ADV-1 CustomerDetailPage bills history + reverse payment");
  } else {
    r.fail("ADV-1 CustomerDetailPage", "missing useCustomerBills or reversePayment");
  }

  const domainLiveAdv = readSrc("lib/live/domainLive.ts");
  if (
    domainLiveAdv?.includes("record_customer_advance") &&
    domainLiveAdv?.includes("reverse_customer_payment") &&
    domainLiveAdv?.includes("advance_applied")
  ) {
    r.pass("ADV-1 domainLive advance + reverse RPCs");
  } else {
    r.fail("ADV-1 domainLive", "missing advance/reverse RPC wiring");
  }

  if (readSrc("components/app/PaymentReverseDialog.tsx")?.includes("paymentReversalConfirm")) {
    r.pass("ADV-1 PaymentReverseDialog");
  } else {
    r.fail("ADV-1 PaymentReverseDialog", "missing reversal confirm");
  }

  const archiveAction = readSrc("components/app/MasterArchiveAction.tsx");
  if (archiveAction?.includes("ConfirmDialog") && !archiveAction?.includes("window.confirm")) {
    r.pass("DEL-1 archive ConfirmDialog");
  } else {
    r.fail("DEL-1 MasterArchiveAction", "expected ConfirmDialog, not window.confirm");
  }

  const archivesPage = readSrc("pages/archives/ArchivesPage.tsx");
  if (archivesPage?.includes("export function ArchivesPage") && archivesPage?.includes("SegmentedTabs")) {
    r.pass("DEL-1 ArchivesPage");
  } else {
    r.fail("DEL-1 ArchivesPage", "missing archives hub");
  }

  if (readSrc("routes/AppRouter.tsx")?.includes('path="archives"')) {
    r.pass("route /app/archives");
  } else {
    r.fail("AppRouter archives route", "missing");
  }

  const domainLive = readSrc("lib/live/domainLive.ts");
  if (domainLive?.includes("CUSTOMER_SELECT_FULL") && domainLive?.includes("is_active")) {
    r.pass("DEL-1 customer is_active in select");
  } else {
    r.fail("DEL-1 customer select", "CUSTOMER_SELECT must include is_active for Archives");
  }

  if (archiveAction?.includes("onArchived")) {
    r.pass("DEL-1 archive navigates after success");
  } else {
    r.fail("DEL-1 onArchived", "missing post-archive callback");
  }

  const settingsUnits = readSrc("pages/settings/SettingsPage.tsx");
  if (settingsUnits?.includes("ProductUnitsSection") && settingsUnits?.includes("product_units")) {
    r.pass("UNITS-1 Settings product units");
  } else {
    r.fail("UNITS-1 Settings", "missing ProductUnitsSection");
  }
  if (settingsUnits?.includes("SegmentedTabs") && settingsUnits?.includes('id: "catalog"')) {
    r.pass("Settings SegmentedTabs + Catalog & stock");
  } else {
    r.fail("Settings tabs", "missing SegmentedTabs or catalog tab");
  }
  if (settingsUnits?.includes('label: "Business"')) {
    r.pass("Settings Business tab label");
  } else {
    r.fail("Settings Business tab", "missing");
  }
  if (nav?.includes("Payment in") && nav?.includes("Payment out")) {
    r.pass("HOME_QUICK_ACTIONS Payment in/out labels");
  } else {
    r.fail("HOME_QUICK_ACTIONS labels", "missing Payment in/out");
  }
  if (nav?.includes("HOME_OVERVIEW_SECTIONS") && nav?.includes('title: "Receivables"') && nav?.includes('title: "Payables"')) {
    r.pass("HOME_OVERVIEW_SECTIONS Receivables + Payables");
  } else {
    r.fail("HOME_OVERVIEW_SECTIONS", "missing categorized overview sections");
  }
  if (nav?.includes('label: "Return"') && nav?.includes('label: "Company"') && nav?.includes('label: "Reports hub"')) {
    r.pass("Home Return quick action + Company/Reports in overview");
  } else {
    r.fail("Home nav split", "Return in quick actions; Company/Reports in overview");
  }
  if (nav?.includes("Sales invoice") && nav?.includes("/app/sales/new")) {
    r.pass("HOME_QUICK_ACTIONS includes Sales invoice");
  } else {
    r.fail("HOME_QUICK_ACTIONS sales", "missing Sales invoice");
  }
  if (readSrc("components/app/DateFormField.tsx")?.includes("DateDisplay")) {
    r.pass("DateFormField dual date on forms");
  } else {
    r.fail("DateFormField", "missing");
  }

  const reportsHub = readSrc("pages/reports/ReportsHubPage.tsx");
  if (reportsHub?.includes("Today & period") && reportsHub?.includes("Receivables")) {
    r.pass("ReportsHub categorized sections");
  } else {
    r.fail("ReportsHub sections", "missing");
  }

  const suppliersPage = readSrc("pages/suppliers/SuppliersPage.tsx");
  if (suppliersPage?.includes("ListBrowsePanel")) {
    r.pass("SuppliersPage ListBrowsePanel");
  } else {
    r.fail("SuppliersPage browse", "missing ListBrowsePanel");
  }

  const productForm = readSrc("pages/products/ProductFormPage.tsx");
  if (productForm?.includes("ProductUnitField") && productForm?.includes("Add unit")) {
    r.pass("UNITS-1 product form Add unit");
  } else {
    r.fail("UNITS-1 ProductFormPage", "missing ProductUnitField");
  }
  if (
    productForm?.includes("useMasterCatalogLoadState") &&
    productForm?.includes("business.defaultMarkupPct")
  ) {
    r.pass("ProductForm edit catalog wait + Settings markup default");
  } else {
    r.fail("ProductFormPage load/markup", "missing catalog wait or markup default");
  }

  const returnPage = readSrc("pages/returns/ReturnPage.tsx");
  if (returnPage?.includes("fetchSaleByBillNoLive") && returnPage?.includes("loadingLines")) {
    r.pass("Return entry loads bill lines");
  } else {
    r.fail("ReturnPage", "must fetch full bill lines on select");
  }

  const customerForm = readSrc("pages/customers/CustomerFormPage.tsx");
  if (customerForm) {
    if (customerForm.includes("Customer PAN") && customerForm.includes("Customer VAT")) {
      r.pass("CustomerFormPage PAN/VAT fields");
    } else {
      r.fail("CustomerFormPage tax fields", "missing");
    }
    if (customerForm.includes("/app/customers")) {
      r.pass("CustomerForm save → /app/customers");
    } else {
      r.fail("CustomerForm redirect", "expected /app/customers");
    }
  }

  const domainHooks = readSrc("store/domainHooks.ts");
  if (domainHooks && domainHooks.includes("pan_number")) {
    r.pass("domainHooks maps pan_number / vat_number");
  } else if (domainHooks) {
    r.fail("domainHooks tax ids", "missing");
  }

  const readme = readFileSync(resolve(APP, "supabase/README.txt"), "utf8");
  if (readme.includes("0025") && readme.includes("0026")) {
    r.pass("supabase/README.txt documents 0025 + 0026");
  } else {
    r.fail("README migrations", "missing 0025/0026 steps");
  }
}

async function runLiveChecks() {
  const stamp = Date.now().toString(36).toUpperCase();
  let supabase;
  let tenantId;
  try {
    ({ supabase, tenantId } = await createAuthedClient(APP));
    r.pass("live.auth + tenant", tenantId.slice(0, 8));
  } catch (e) {
    r.fail("live.auth", e.message);
    return;
  }

  const colChecks = [
    {
      name: "0026 customers.pan_number,vat_number",
      run: () => supabase.from("customers").select("id, pan_number, vat_number").limit(1),
    },
    {
      name: "0025 tenant_settings.support_*",
      run: () =>
        supabase
          .from("tenant_settings")
          .select("support_phone, support_email, support_whatsapp")
          .eq("tenant_id", tenantId)
          .limit(1),
    },
  ];
  for (const c of colChecks) {
    const { error } = await c.run();
    if (error) {
      const missing = /column|does not exist|Could not find/i.test(error.message);
      r.fail(c.name, missing ? `NOT APPLIED — ${error.message}` : error.message);
    } else {
      r.pass(c.name);
    }
  }

  const pan = `PAN${stamp.slice(0, 6)}`;
  const vat = `VAT${stamp.slice(0, 6)}`;
  const custName = `E2E Tax ${stamp}`;

  const { data: inserted, error: insErr } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: custName,
      phone: "9800000001",
      area: "E2E",
      credit_limit: 10000,
      opening_balance: 0,
      pan_number: pan,
      vat_number: vat,
    })
    .select("id, pan_number, vat_number")
    .single();

  if (insErr) {
    r.fail("live.customer insert pan/vat", insErr.message);
    return;
  }
  if (inserted?.pan_number === pan && inserted?.vat_number === vat) {
    r.pass("live.customer insert pan/vat round-trip");
  } else {
    r.fail("live.customer insert", `got pan=${inserted?.pan_number} vat=${inserted?.vat_number}`);
  }

  const { error: delErr } = await supabase.from("customers").delete().eq("id", inserted.id);
  if (delErr) r.fail("live.customer cleanup", delErr.message);
  else r.pass("live.customer cleanup");
}

console.log(`\n=== Phase 0 Tier C (${wantLive ? "source + live" : "source only"}) ===\n`);
runSourceChecks();
if (wantLive) await runLiveChecks();
process.exit(r.summary());
