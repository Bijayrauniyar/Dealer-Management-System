/**
 * Stock picker + backdated purchase/sale bill dates (unit + optional live Supabase).
 *
 * Usage:
 *   npm run e2e:stock              # unit tests only
 *   npm run e2e:stock:live         # unit + live RPC/DB checks
 *
 * Live requires app/.env.local + app/.e2e-credentials.local (or E2E_EMAIL/PASSWORD).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  productStockStatus,
  productPickerOptionMeta,
  buildSaleProductPickerOptions,
} from "./lib/stock-picker.mjs";
import { createE2eReporter, createAuthedClient, today as todayIso } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("Stock picker + bill/purchase dates");

function addDays(isoDate, deltaDays) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function runUnitTests() {
  const today = todayIso();
  const yesterday = addDays(today, -1);
  r.pass("dates.today", today);
  r.pass("dates.yesterday", yesterday);

  const pOut = { id: "a", name: "A", onHand: 0, minQty: 5, uom: "PCS", sellingPrice: 100 };
  const pLow = { id: "b", name: "B", onHand: 3, minQty: 10, uom: "PCS", sellingPrice: 200 };
  const pOk = { id: "c", name: "C", onHand: 50, minQty: 5, uom: "PCS", sellingPrice: 300 };

  r.assertEq(productStockStatus(pOut), "out", "unit.stock.out");
  r.assertEq(productStockStatus(pLow), "low", "unit.stock.low");
  r.assertEq(productStockStatus(pOk), "in_stock", "unit.stock.in_stock");

  r.assertEq(productPickerOptionMeta(pOut).disabled, true, "unit.picker.outDisabled");
  r.assertEq(
    productPickerOptionMeta(pOut, { allowOutOfStockSelect: true }).disabled,
    false,
    "unit.picker.editException",
  );
  r.assertEq(productPickerOptionMeta(pOk).tone, "default", "unit.picker.inTone");
  r.assertEq(productPickerOptionMeta(pLow).tone, "low", "unit.picker.lowTone");

  const opts = buildSaleProductPickerOptions([pOut, pLow, pOk], ["a"]);
  r.assertEq(opts.find((o) => o.id === "a")?.disabled, false, "unit.picker.lineAllowsOut");
  r.assertEq(opts.find((o) => o.id === "b")?.disabled, false, "unit.picker.lowSelectable");
  r.assertEq(opts.find((o) => o.id === "c")?.disabled, false, "unit.picker.inSelectable");
  r.assertEq(opts.find((o) => o.id === "a")?.tone, "out", "unit.picker.outToneVisible");
  r.assertEq(opts[opts.length - 1].id, "a", "unit.picker.outSortedLast");

  const subOut = productPickerOptionMeta(pOut).sub;
  if (!subOut.includes("Out of stock") || !subOut.includes("0 PCS")) {
    r.fail("unit.picker.outSub", subOut);
  } else r.pass("unit.picker.outSub", subOut);
}

async function stockForProduct(supabase, productId) {
  const { data, error } = await supabase
    .from("v_stock")
    .select("closing_stock")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(`v_stock: ${error.message}`);
  return Number(data?.closing_stock ?? 0);
}

async function runLiveTests() {
  const today = todayIso();
  const yesterday = addDays(today, -1);
  const stamp = Date.now();

  let supabase;
  let tenantId;
  try {
    ({ supabase, tenantId } = await createAuthedClient(APP));
  } catch (e) {
    r.fail("live.auth", e instanceof Error ? e.message : String(e));
    return;
  }
  r.pass("live.auth", tenantId.slice(0, 8));

  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .maybeSingle();
  if (tErr) r.fail("live.tenant", tErr.message);
  else if (tenant?.status !== "active") r.fail("live.tenant", `status=${tenant?.status}`);
  else r.pass("live.tenant", "active");

  const { data: cust, error: cErr } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: `E2E StockCust ${stamp}`,
      phone: "9800000001",
      area: "E2E",
    })
    .select("id")
    .single();
  if (cErr) {
    r.fail("live.customer", cErr.message);
    return;
  }
  const customerId = cust.id;
  r.pass("live.customer", customerId.slice(0, 8));

  const { data: supp, error: sErr } = await supabase
    .from("suppliers")
    .insert({
      tenant_id: tenantId,
      name: `E2E StockSup ${stamp}`,
      phone: "9800000002",
    })
    .select("id")
    .single();
  if (sErr) {
    r.fail("live.supplier", sErr.message);
    return;
  }
  const supplierId = supp.id;
  r.pass("live.supplier", supplierId.slice(0, 8));

  const { data: prod, error: pErr } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      code: `E2E-STK-${stamp}`,
      name: `E2E Stock SKU ${stamp}`,
      category: "Test",
      unit: "PCS",
      purchase_price: 50,
      sale_price: 80,
      mrp: 100,
      discount_pct: 0,
      vat_applicable: false,
      min_qty: 10,
      opening_stock: 0,
      is_active: true,
    })
    .select("id, unit, sale_price, min_qty")
    .single();
  if (pErr) {
    r.fail("live.product", pErr.message);
    return;
  }
  const productId = prod.id;
  r.pass("live.product", productId.slice(0, 8));

  let onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 0, "live.stock.initialZero");

  const productRow = {
    id: productId,
    name: `E2E Stock SKU ${stamp}`,
    onHand,
    minQty: Number(prod.min_qty ?? 10),
    uom: prod.unit ?? "PCS",
    sellingPrice: Number(prod.sale_price ?? 80),
  };
  r.assertEq(productStockStatus(productRow), "out", "live.picker.statusBeforePurchase");
  r.assertEq(
    buildSaleProductPickerOptions([productRow], []).find((o) => o.id === productId)?.disabled,
    true,
    "live.picker.disabledBeforePurchase",
  );

  // Past purchase
  const { data: purPastRows, error: purPastErr } = await supabase.rpc("record_purchase", {
    p_purchase_date: yesterday,
    p_supplier_id: supplierId,
    p_lines: [{ product_id: productId, qty: 20, rate_excl: 50 }],
    p_notes: `e2e-stock-past-pur-${stamp}`,
  });
  if (purPastErr) r.fail("live.purchase.past.rpc", purPastErr.message);
  else {
    const purPast = Array.isArray(purPastRows) ? purPastRows[0] : purPastRows;
    const purchaseId = purPast?.purchase_id;
    r.pass("live.purchase.past.rpc", purPast?.purchase_no ?? "ok");

    const { data: purRow, error: purReadErr } = await supabase
      .from("purchases")
      .select("purchase_date")
      .eq("id", purchaseId)
      .maybeSingle();
    if (purReadErr) r.fail("live.purchase.past.date", purReadErr.message);
    else r.assertEq(purRow?.purchase_date, yesterday, "live.purchase.past.date");
  }

  onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 20, "live.stock.afterPastPurchase");

  productRow.onHand = onHand;
  r.assertEq(productStockStatus(productRow), "in_stock", "live.picker.statusAfterPurchase");

  // Present purchase
  const { data: purTodayRows, error: purTodayErr } = await supabase.rpc("record_purchase", {
    p_purchase_date: today,
    p_supplier_id: supplierId,
    p_lines: [{ product_id: productId, qty: 5, rate_excl: 50 }],
    p_notes: `e2e-stock-today-pur-${stamp}`,
  });
  if (purTodayErr) r.fail("live.purchase.today.rpc", purTodayErr.message);
  else {
    const purToday = Array.isArray(purTodayRows) ? purTodayRows[0] : purTodayRows;
    const { data: purRow, error: purReadErr } = await supabase
      .from("purchases")
      .select("purchase_date")
      .eq("id", purToday?.purchase_id)
      .maybeSingle();
    if (purReadErr) r.fail("live.purchase.today.date", purReadErr.message);
    else r.assertEq(purRow?.purchase_date, today, "live.purchase.today.date");
    r.pass("live.purchase.today.rpc", purToday?.purchase_no ?? "ok");
  }

  onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 25, "live.stock.afterTodayPurchase");

  // Past sale bill
  const { data: salePastRows, error: salePastErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: yesterday,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 3, rate: 80 }],
    p_paid: 0,
    p_notes: `e2e-stock-past-sale-${stamp}`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  let pastBillId;
  if (salePastErr) r.fail("live.sale.past.rpc", salePastErr.message);
  else {
    const row = Array.isArray(salePastRows) ? salePastRows[0] : salePastRows;
    pastBillId = row?.bill_id;
    const { data: billRow, error: billReadErr } = await supabase
      .from("sales_bills")
      .select("bill_date")
      .eq("id", pastBillId)
      .maybeSingle();
    if (billReadErr) r.fail("live.sale.past.date", billReadErr.message);
    else r.assertEq(billRow?.bill_date, yesterday, "live.sale.past.date");
    r.pass("live.sale.past.rpc", row?.bill_no ?? "ok");
  }

  onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 22, "live.stock.afterPastSale");

  // Present sale bill
  const { data: saleTodayRows, error: saleTodayErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: today,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 2, rate: 80 }],
    p_paid: 0,
    p_notes: `e2e-stock-today-sale-${stamp}`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (saleTodayErr) r.fail("live.sale.today.rpc", saleTodayErr.message);
  else {
    const row = Array.isArray(saleTodayRows) ? saleTodayRows[0] : saleTodayRows;
    const { data: billRow, error: billReadErr } = await supabase
      .from("sales_bills")
      .select("bill_date")
      .eq("id", row?.bill_id)
      .maybeSingle();
    if (billReadErr) r.fail("live.sale.today.date", billReadErr.message);
    else r.assertEq(billRow?.bill_date, today, "live.sale.today.date");
    r.pass("live.sale.today.rpc", row?.bill_no ?? "ok");
  }

  onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 20, "live.stock.afterTodaySale");

  // Edit bill: change date + picker exception for line product at low stock
  productRow.onHand = onHand;
  r.assertEq(productStockStatus(productRow), "in_stock", "live.picker.stillInStockAt20");

  if (!pastBillId) {
    r.fail("live.sale.amendDate.rpc", "skipped — past sale bill not created");
  }
  const { error: updErr } = await supabase.rpc("update_sales_bill", {
    p_bill_id: pastBillId,
    p_customer_id: customerId,
    p_bill_date: addDays(yesterday, -2),
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 3, rate: 80 }],
    p_notes: `e2e-stock-amend-${stamp}`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (updErr) r.fail("live.sale.amendDate.rpc", updErr.message);
  else {
    const twoDaysAgo = addDays(yesterday, -2);
    const { data: billRow, error: billReadErr } = await supabase
      .from("sales_bills")
      .select("bill_date")
      .eq("id", pastBillId)
      .maybeSingle();
    if (billReadErr) r.fail("live.sale.amendDate.read", billReadErr.message);
    else r.assertEq(billRow?.bill_date, twoDaysAgo, "live.sale.amendDate.read");
    r.pass("live.sale.amendDate.rpc", twoDaysAgo);
  }

  r.assertEq(
    buildSaleProductPickerOptions([productRow], [productId]).find((o) => o.id === productId)?.disabled,
    false,
    "live.picker.editLineSelectable",
  );

  // Drain stock → out + disabled
  const { data: drainRows, error: drainErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: today,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 20, rate: 80 }],
    p_paid: 0,
    p_notes: `e2e-stock-drain-${stamp}`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (drainErr) r.fail("live.sale.drain.rpc", drainErr.message);
  else {
    const row = Array.isArray(drainRows) ? drainRows[0] : drainRows;
    r.pass("live.sale.drain.rpc", row?.bill_no ?? "ok");
  }

  onHand = await stockForProduct(supabase, productId);
  r.assertEq(onHand, 0, "live.stock.afterDrain");

  const { error: oversellErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: today,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 1, rate: 80 }],
    p_paid: 0,
    p_notes: `e2e-stock-oversell-${stamp}`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (!oversellErr) r.fail("live.sale.oversell.rpc", "expected Insufficient stock");
  else if (!/insufficient stock/i.test(oversellErr.message)) {
    r.fail("live.sale.oversell.rpc", oversellErr.message);
  } else r.pass("live.sale.oversell.rpc", "blocked");
  productRow.onHand = 0;
  r.assertEq(productStockStatus(productRow), "out", "live.picker.outAfterDrain");
  r.assertEq(
    buildSaleProductPickerOptions([productRow], []).find((o) => o.id === productId)?.disabled,
    true,
    "live.picker.disabledWhenOut",
  );
  r.assertEq(
    buildSaleProductPickerOptions([productRow], [productId]).find((o) => o.id === productId)?.disabled,
    false,
    "live.picker.exceptionWhenOnBill",
  );

  await supabase.auth.signOut({ scope: "local" });
  r.pass("live.signOut");
}

console.log("\n=== Stock picker + bill/purchase dates ===\n");
runUnitTests();
if (wantLive) {
  await runLiveTests();
} else {
  r.pass("live.skip", "pass --live for Supabase purchase/sale date + v_stock checks");
}

const fails = r.summary();
process.exit(fails ? 1 : 0);
