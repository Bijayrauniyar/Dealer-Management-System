/**
 * Supplier list → invoices → purchase detail (and payment pre-select wiring).
 *
 * Usage:
 *   node scripts/e2e-supplier-invoices.mjs           # source + route checks (no Supabase)
 *   node scripts/e2e-supplier-invoices.mjs --live    # + authenticated DB reads
 *
 * Env: app/.env.local (+ app/.e2e-credentials.local for --live)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter, createAuthedClient } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("Supplier invoices");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

function runSourceChecks() {
  const suppliersPage = readSrc("pages/suppliers/SuppliersPage.tsx");
  if (suppliersPage) {
    if (suppliersPage.includes("onClick={() => {}}")) {
      r.fail("SuppliersPage stub buttons", "empty onClick still present");
    } else {
      r.pass("SuppliersPage no empty onClick stubs");
    }
    const purchasesHub = readSrc("pages/purchases/PurchasesPage.tsx");
    if (
      purchasesHub?.includes('navigate("/app/supplier-payments/new"') &&
      purchasesHub.includes("/app/purchases/") &&
      purchasesHub.includes("SegmentedTabs")
    ) {
      r.pass("PurchasesPage hub wires payment + invoice navigation");
    } else {
      r.fail("PurchasesPage hub navigation", "missing supplier payment or invoice routes");
    }
  }

  const invoicesPage = readSrc("pages/suppliers/SupplierInvoicesPage.tsx");
  if (invoicesPage) {
    r.pass("SupplierInvoicesPage exists");
    if (invoicesPage.includes("supplierId") && invoicesPage.includes("/app/purchases/")) {
      r.pass("SupplierInvoicesPage links to purchase detail");
    } else {
      r.fail("SupplierInvoicesPage purchase link", "missing");
    }
  }

  const detailPage = readSrc("pages/purchases/PurchaseDetailPage.tsx");
  if (detailPage) {
    r.pass("PurchaseDetailPage exists");
    if (detailPage.includes("fetchPurchaseDetailLive")) {
      r.pass("PurchaseDetailPage uses fetchPurchaseDetailLive");
    } else {
      r.fail("PurchaseDetailPage fetch", "missing");
    }
    if (detailPage.includes("Edit purchase")) {
      r.pass("PurchaseDetailPage Edit button");
    } else {
      r.fail("PurchaseDetailPage Edit", "missing");
    }
  }

  const router = readSrc("routes/AppRouter.tsx");
  if (router) {
    if (router.includes("suppliers/:supplierId/invoices")) {
      r.pass("Route suppliers/:supplierId/invoices");
    } else {
      r.fail("Route supplier invoices", "missing");
    }
    if (router.includes('path="purchases"') && router.includes("PurchasesPage")) {
      r.pass("Route purchases hub (PurchasesPage)");
    } else if (router) {
      r.fail("Route purchases hub", "missing PurchasesPage at /app/purchases");
    }
    if (router.includes("purchases/:purchaseId")) {
      r.pass("Route purchases/:purchaseId");
    } else {
      r.fail("Route purchase detail", "missing");
    }
  }

  const paymentPage = readSrc("pages/supplier-payment/SupplierPaymentPage.tsx");
  if (paymentPage && paymentPage.includes("presetSupplierId")) {
    r.pass("SupplierPaymentPage preset supplier from location.state");
  } else if (paymentPage) {
    r.fail("SupplierPaymentPage preset", "missing presetSupplierId");
  }

  const purchasePage = readSrc("pages/purchases/PurchasePage.tsx");
  if (purchasePage && purchasePage.includes("presetSupplierId")) {
    r.pass("PurchasePage preset supplier from location.state");
  } else if (purchasePage) {
    r.fail("PurchasePage preset", "missing presetSupplierId");
  }

  const types = readSrc("domain/types.ts");
  if (types && types.includes("supplierId:") && types.includes("PurchaseDetail")) {
    r.pass("PurchaseListItem includes supplierId + PurchaseDetail type");
  } else if (types) {
    r.fail("domain types", "missing supplierId or PurchaseDetail");
  }

  const domainLive = readSrc("lib/live/domainLive.ts");
  if (domainLive && domainLive.includes("fetchPurchaseDetailLive")) {
    r.pass("fetchPurchaseDetailLive in domainLive");
  } else if (domainLive) {
    r.fail("domainLive", "missing fetchPurchaseDetailLive");
  }

  if (
    domainLive &&
    domainLive.includes("PURCHASE_LIST_SELECT_LEGACY") &&
    domainLive.includes("isMissingColumnError") &&
    domainLive.includes("supplier_invoice_no")
  ) {
    r.pass("domainLive legacy purchase select when 0014 not applied");
  } else if (domainLive) {
    r.fail("domainLive purchase fallback", "missing legacy select for supplier_invoice_no");
  }

  if (domainLive && domainLive.includes("commitPurchaseUpdateLive")) {
    r.pass("commitPurchaseUpdateLive in domainLive");
  } else if (domainLive) {
    r.fail("domainLive", "missing commitPurchaseUpdateLive");
  }

  if (router && router.includes("purchases/edit/:purchaseId")) {
    r.pass("Route purchases/edit/:purchaseId");
  } else if (router) {
    r.fail("Route purchase edit", "missing");
  }

  if (purchasePage && purchasePage.includes("commitPurchaseUpdate")) {
    r.pass("PurchasePage uses commitPurchaseUpdate");
  } else if (purchasePage) {
    r.fail("PurchasePage edit save", "missing commitPurchaseUpdate");
  }

  if (purchasePage && purchasePage.includes("dueDate") && purchasePage.includes("Due today or earlier")) {
    r.pass("PurchasePage due date hint + state");
  } else if (purchasePage) {
    r.fail("PurchasePage due date", "missing dueDate wiring");
  }

  if (
    purchasePage &&
    purchasePage.includes("ConfirmDialog") &&
    purchasePage.includes("purchasePaidAdjustmentConfirm")
  ) {
    r.pass("PurchasePage financial save confirmation dialog");
  } else if (purchasePage) {
    r.fail("PurchasePage save confirm", "missing ConfirmDialog / purchasePaidAdjustmentConfirm");
  }

  const financialConfirm = readSrc("lib/financialSaveConfirm.tsx");
  if (financialConfirm && financialConfirm.includes("On confirmation")) {
    r.pass("financialSaveConfirm professional copy");
  } else if (financialConfirm) {
    r.fail("financialSaveConfirm", "missing");
  }

  const purchaseLineDisplay = readSrc("lib/purchaseLineDisplay.ts");
  if (purchaseLineDisplay && purchaseLineDisplay.includes("purchaseLineQtyDisplay") && purchaseLineDisplay.includes("billLineQtyDisplay")) {
    r.pass("purchaseLineDisplay helpers");
  } else if (purchaseLineDisplay) {
    r.fail("purchaseLineDisplay", "missing qty display helpers");
  }

  if (domainLive && domainLive.includes("p_due_date")) {
    r.pass("domainLive passes p_due_date to record_purchase");
  } else if (domainLive) {
    r.fail("domainLive due date RPC", "missing p_due_date");
  }

  if (purchasePage && purchasePage.includes("supplierInvoiceNo") && purchasePage.includes("commitPurchase({")) {
    r.pass("PurchasePage passes supplierInvoiceNo on create");
  } else if (purchasePage) {
    r.fail("PurchasePage supplier invoice", "missing supplierInvoiceNo on create");
  }

  if (
    purchasePage &&
    purchasePage.includes("Bill discount") &&
    purchasePage.includes("discountAmount") &&
    purchasePage.includes("discountLabel")
  ) {
    r.pass("PurchasePage bill discount (flat/percent + label)");
  } else if (purchasePage) {
    r.fail("PurchasePage bill discount", "missing discount UI or commit payload");
  }

  if (
    purchasePage &&
    purchasePage.includes("Preview purchase") &&
    purchasePage.includes("PurchaseBillView") &&
    purchasePage.includes("buildPurchaseDraft")
  ) {
    r.pass("PurchasePage preview before save (eye + draft bill)");
  } else if (purchasePage) {
    r.fail("PurchasePage preview", "missing preview toolbar or draft builder");
  }

  if (domainLive && domainLive.includes("p_discount") && domainLive.includes("p_discount_label")) {
    r.pass("domainLive passes p_discount to purchase RPCs");
  } else if (domainLive) {
    r.fail("domainLive purchase discount RPC", "missing p_discount / p_discount_label");
  }

  const purchaseBillView = readSrc("components/app/PurchaseBillView.tsx");
  if (
    purchaseBillView &&
    purchaseBillView.includes("purchaseShowsFooterDiscount") &&
    purchaseBillView.includes("purchaseFooterDiscountLabel")
  ) {
    r.pass("PurchaseBillView footer discount rows");
  } else if (purchaseBillView) {
    r.fail("PurchaseBillView discount", "missing footer discount helpers");
  }

  const migration = resolve(APP, "supabase/migrations/0044_purchase_bill_discount.sql");
  if (existsSync(migration)) {
    const sql = readFileSync(migration, "utf8");
    if (sql.includes("v_taxable_excl") && sql.includes("p_discount")) {
      r.pass("0044 migration: discount before VAT on taxable excl");
    } else {
      r.fail("0044 migration", "missing taxable excl discount math");
    }
  } else {
    r.fail("0044 migration", "file missing");
  }

  if (purchasePage && purchasePage.includes("purchaseDisplayTitle")) {
    r.fail("PurchasePage", "should not import purchaseDisplayTitle (PO hidden from form)");
  }

  const purchaseDisplay = readSrc("lib/purchaseDisplay.ts");
  if (purchaseDisplay && purchaseDisplay.includes("purchaseDisplayTitle") && !purchaseDisplay.includes("purchaseNo")) {
    r.pass("purchaseDisplay.ts hides PO from labels");
  } else if (purchaseDisplay) {
    r.fail("purchaseDisplay.ts", "missing or exposes purchaseNo");
  }

  if (detailPage && detailPage.includes("PurchaseBillView")) {
    r.pass("PurchaseDetailPage uses PurchaseBillView");
  } else if (detailPage) {
    r.fail("PurchaseDetailPage bill view", "missing PurchaseBillView");
  }

  const mig0014 = resolve(APP, "supabase/migrations/0014_supplier_invoice_no.sql");
  if (existsSync(mig0014)) {
    r.pass("migration 0014_supplier_invoice_no.sql present");
  } else {
    r.fail("migration 0014", "missing file");
  }

  const mig0015 = resolve(APP, "supabase/migrations/0015_purchase_invoice_immutable.sql");
  if (existsSync(mig0015)) {
    r.pass("migration 0015_purchase_invoice_immutable.sql present");
  } else {
    r.fail("migration 0015", "missing file");
  }

  const mig0017 = resolve(APP, "supabase/migrations/0017_purchase_vat.sql");
  if (existsSync(mig0017)) {
    r.pass("migration 0017_purchase_vat.sql present");
  } else {
    r.fail("migration 0017", "missing file");
  }

  if (purchasePage && purchasePage.includes("Buy excl.")) {
    r.pass("PurchasePage buy price excl VAT field");
  } else if (purchasePage) {
    r.fail("PurchasePage VAT entry", "missing Buy excl.");
  }

  if (purchasePage && purchasePage.includes("productPurchasePriceSignature")) {
    r.pass("PurchasePage refreshes line buy price when product catalog changes");
  } else if (purchasePage) {
    r.fail("PurchasePage catalog price sync", "missing productPurchasePriceSignature");
  }

  const purchaseBill = readSrc("components/app/PurchaseBillView.tsx");
  if (purchaseBill && purchaseBill.includes("Purchase invoice")) {
    r.pass("PurchaseBillView component exists");
  } else if (purchaseBill) {
    r.fail("PurchaseBillView", "missing");
  }

  if (
    purchaseBill &&
    purchaseBill.includes("billLineQtyDisplay") &&
    !purchaseBill.includes(">UOM<")
  ) {
    r.pass("PurchaseBillView merged qty + UOM (no separate UOM column)");
  } else if (purchaseBill) {
    r.fail("PurchaseBillView qty column", "expected billLineQtyDisplay without UOM column");
  }

  if (purchasePage && !purchasePage.includes("InvoiceNoField")) {
    r.pass("PurchasePage invoice field without mic component");
  } else if (purchasePage) {
    r.fail("PurchasePage mic", "still uses InvoiceNoField");
  }

  if (purchasePage && purchasePage.includes("incl. ${vatPct}% VAT")) {
    r.pass("PurchasePage total label includes VAT %");
  } else if (purchasePage) {
    r.fail("PurchasePage VAT label", "missing incl. % VAT on total");
  }

  if (
    purchaseBill &&
    purchaseBill.includes("grid-cols-2") &&
    purchaseBill.includes("supplierTaxId") &&
    !purchaseBill.includes("purchaseDisplaySubtitle")
  ) {
    r.pass("PurchaseBillView compact supplier + invoice header");
  } else if (purchaseBill) {
    r.fail("PurchaseBillView header", "expected merged two-column layout");
  }

  if (detailPage && !detailPage.includes("Edit updates lines and stock")) {
    r.pass("PurchaseDetailPage no dev footer note");
  } else if (detailPage) {
    r.fail("PurchaseDetailPage footer", "unprofessional footer still present");
  }

  const productForm = readSrc("pages/products/ProductFormPage.tsx");
  if (
    productForm &&
    productForm.includes("Buy price excl. VAT") &&
    productForm.includes("addVatToExclPrice(buyPrice") &&
    !productForm.includes("Sell price must be greater than 0")
  ) {
    r.pass("ProductFormPage buy excl VAT + optional sell price");
  } else if (productForm) {
    r.fail("ProductFormPage pricing", "buy excl / optional sell regression");
  }

  if (
    productForm?.includes("numericPercentProps") &&
    productForm.includes("Markup (%)") &&
    productForm.includes("nullable") &&
    productForm.includes("showZero")
  ) {
    r.pass("ProductFormPage decimal markup % (nullable, showZero)");
  } else if (productForm) {
    r.fail("ProductFormPage markup", "numericPercentProps / nullable / showZero missing");
  }

  if (
    productForm?.includes("HSN code (optional)") &&
    productForm.includes("hsn_code: hsnCode.trim()")
  ) {
    r.pass("ProductFormPage optional HSN code field");
  } else if (productForm) {
    r.fail("ProductFormPage HSN", "optional HSN field missing");
  }

  if (domainLive?.includes("hsn_code") && domainLive.includes("hsnCode")) {
    r.pass("domainLive product hsn_code mapping");
  } else if (domainLive) {
    r.fail("domainLive hsn_code", "missing");
  }

  const columns = readSrc("lib/export/columns.ts");
  if (columns?.includes('"hsn_code"')) {
    r.pass("export PRODUCT_COLUMNS includes hsn_code");
  } else if (columns) {
    r.fail("export columns hsn_code", "missing");
  }

  if (existsSync(resolve(APP, "supabase/migrations/0034_product_hsn_code.sql"))) {
    r.pass("migration 0034_product_hsn_code.sql");
  } else {
    r.fail("migration 0034", "missing");
  }

  if (domainLive && domainLive.includes("rate_excl")) {
    r.pass("domainLive purchase lines use rate_excl");
  } else if (domainLive) {
    r.fail("domainLive rate_excl", "missing");
  }

  const taxLib = readSrc("lib/tax.ts");
  if (taxLib && taxLib.includes("getVatPct") && taxLib.includes("splitInclusiveAmount")) {
    r.pass("lib/tax.ts helpers");
  } else if (taxLib) {
    r.fail("lib/tax.ts", "missing helpers");
  }
}

async function runLiveChecks() {
  const { supabase } = await createAuthedClient(APP);
  r.pass("live.auth", "signed in");

  const { data: suppliers, error: sErr } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("is_active", true)
    .limit(5);
  if (sErr) throw sErr;
  if (!suppliers?.length) {
    r.fail("live.suppliers", "no active suppliers — add one or run seed:demo");
    return;
  }
  r.pass("live.suppliers", `${suppliers.length} row(s)`);
  const probeSupplierId = suppliers[0].id;

  const { error: rpcProbe } = await supabase.rpc("update_purchase", {
    p_purchase_id: "00000000-0000-0000-0000-000000000000",
    p_supplier_id: probeSupplierId,
    p_purchase_date: new Date().toISOString().slice(0, 10),
    p_lines: [],
    p_notes: null,
  });
  if (rpcProbe?.message?.includes("Could not find the function")) {
    r.fail("live.update_purchase.rpc", "Run migration 0013_update_purchase.sql in Supabase");
  } else if (rpcProbe?.message?.includes("Purchase not found")) {
    r.pass("live.update_purchase.rpc", "callable");
  } else if (!rpcProbe) {
    r.fail("live.update_purchase.rpc", "unexpected success on fake id");
  } else {
    r.pass("live.update_purchase.rpc", rpcProbe.message.slice(0, 60));
  }

  const { data: purchases, error: pErr } = await supabase
    .from("purchases")
    .select(
      "id, purchase_no, supplier_invoice_no, purchase_date, total, supplier_id, paid, payment_status, suppliers(name)",
    )
    .order("purchase_date", { ascending: false })
    .limit(20);
  if (pErr?.message?.includes("supplier_invoice_no")) {
    r.pass("live.purchases.0014", "column missing — run 0014_supplier_invoice_no.sql in Supabase");
    const legacy = await supabase
      .from("purchases")
      .select(
        "id, purchase_no, purchase_date, total, supplier_id, paid, payment_status, suppliers(name)",
      )
      .order("purchase_date", { ascending: false })
      .limit(5);
    if (legacy.error) throw legacy.error;
    r.pass("live.purchases.legacy_select", `${legacy.data?.length ?? 0} row(s) without supplier_invoice_no`);
    if (!legacy.data?.length) {
      r.pass("live.purchase.detail", "skip — no purchases");
      return;
    }
    const pid = legacy.data[0].id;
    const detail = await supabase
      .from("purchases")
      .select("id, purchase_no, purchase_date, total, supplier_id, paid, payment_status, subtotal, notes, suppliers(name)")
      .eq("id", pid)
      .maybeSingle();
    if (detail.error) r.fail("live.purchase.detail", detail.error.message);
    else if (detail.data) r.pass("live.purchase.detail", `id=${String(pid).slice(0, 8)}`);
    else r.fail("live.purchase.detail", "not found");
    return;
  }
  if (pErr) throw pErr;
  r.pass("live.purchases.supplier_invoice_no column", "readable");

  const rows = purchases ?? [];
  if (!rows.length) {
    r.pass("live.purchases.list", "0 rows (skip detail checks — record a purchase in app)");
    return;
  }

  const first = rows[0];
  if (first.supplier_id == null) {
    r.fail("live.purchases.supplier_id", "column missing on row");
  } else {
    r.pass("live.purchases.supplier_id", first.supplier_id.slice(0, 8));
  }

  const status = first.payment_status;
  if (status === "paid" || status === "partial" || status === "unpaid") {
    r.pass("live.purchases.payment_status", status);
  } else {
    r.fail("live.purchases.payment_status", String(status));
  }

  const supplierId = first.supplier_id;
  const forSupplier = rows.filter((p) => p.supplier_id === supplierId);
  r.pass("live.filter.bySupplier", `${forSupplier.length} purchase(s) for first supplier`);

  const { data: items, error: iErr } = await supabase
    .from("purchase_items")
    .select("product_id, qty, rate, total, products(name)")
    .eq("purchase_id", first.id);
  if (iErr) throw iErr;
  if (!items?.length) {
    r.fail("live.purchase_items", "no lines on latest purchase");
  } else {
    r.pass("live.purchase_items", `${items.length} line(s) on ${first.purchase_no}`);
  }

  const { data: header, error: hErr } = await supabase
    .from("purchases")
    .select("id, subtotal, notes")
    .eq("id", first.id)
    .maybeSingle();
  if (hErr) throw hErr;
  if (header) {
    r.pass("live.purchase.header", `subtotal=${header.subtotal}`);
  } else {
    r.fail("live.purchase.header", "not found");
  }
}

runSourceChecks();

if (wantLive) {
  try {
    await runLiveChecks();
  } catch (e) {
    r.fail("live.exception", e instanceof Error ? e.message : String(e));
  }
} else {
  r.pass("live.skip", "pass --live for Supabase checks");
}

const fails = r.summary();
process.exit(fails > 0 ? 1 : 0);
