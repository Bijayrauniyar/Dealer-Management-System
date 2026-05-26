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
    if (
      suppliersPage.includes('navigate("/app/supplier-payments/new"') &&
      suppliersPage.includes("onViewInvoices") &&
      suppliersPage.includes("/invoices")
    ) {
      r.pass("SuppliersPage wires payment + invoices navigation");
    } else {
      r.fail("SuppliersPage navigation", "missing expected navigate calls");
    }
    if (suppliersPage.includes("stopPropagation")) {
      r.pass("SuppliersPage stopPropagation on action buttons");
    } else {
      r.fail("SuppliersPage stopPropagation", "missing");
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
    .select("id, purchase_no, purchase_date, total, supplier_id, paid, payment_status, suppliers(name)")
    .order("purchase_date", { ascending: false })
    .limit(20);
  if (pErr) throw pErr;

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
