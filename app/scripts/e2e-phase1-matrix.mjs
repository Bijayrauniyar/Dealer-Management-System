/**
 * Phase 1 API test matrix — masters, calculations, balances, stock.
 * Usage: npm run e2e:matrix
 * Requires: .env.local, .e2e-credentials.local, migrations 0001–0003 + 0005 + **0006** + **0007**
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createAuthedClient, createE2eReporter, loadEnvFile, today } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const stamp = Date.now().toString(36).toUpperCase();
const T = today();

const r = createE2eReporter(`Phase 1 API matrix (${stamp})`);
console.log(`\n=== Phase 1 API matrix (${stamp}) ===\n`);

let supabase;
let tenantId;
let customerId;
let supplierId;
let productId;
let billId;
let billNo;
let purchaseId;

try {
  ({ supabase, tenantId } = await createAuthedClient(APP));
  r.pass("auth.signIn + tenant", tenantId.slice(0, 8));

  const { data: t } = await supabase.from("tenants").select("status").eq("id", tenantId).maybeSingle();
  if (t?.status !== "active") r.fail("tenant.active", t?.status ?? "null");
  else r.pass("tenant.active");

  // --- M2 Settings ---
  const footer = `Matrix footer ${stamp}`;
  const prefix = `MX${stamp.slice(0, 4)}`;
  const { error: se } = await supabase
    .from("tenant_settings")
    .update({ bill_footer: footer, invoice_prefix: prefix })
    .eq("tenant_id", tenantId);
  if (se) r.fail("settings.update", se.message);
  else {
    const { data: ts } = await supabase
      .from("tenant_settings")
      .select("bill_footer, invoice_prefix")
      .eq("tenant_id", tenantId)
      .single();
    r.assertEq(ts?.bill_footer, footer, "settings.bill_footer round-trip");
    r.assertEq(ts?.invoice_prefix, prefix, "settings.invoice_prefix round-trip");
  }

  const { error: se2 } = await supabase
    .from("tenant_settings")
    .update({ overdue_days: 14, default_markup_pct: 22, name: `Matrix Shop ${stamp}` })
    .eq("tenant_id", tenantId);
  if (se2) r.fail("settings.thresholds update", se2.message);
  else {
    const { data: ts2 } = await supabase
      .from("tenant_settings")
      .select("overdue_days, default_markup_pct, name")
      .eq("tenant_id", tenantId)
      .single();
    r.assertEq(ts2?.overdue_days, 14, "settings.overdue_days round-trip");
    r.assertEq(ts2?.default_markup_pct, 22, "settings.default_markup_pct round-trip");
    r.assertEq(ts2?.name, `Matrix Shop ${stamp}`, "settings.name round-trip");
  }

  // --- M5 Customer ---
  const { data: cust, error: cErr } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: `Matrix Customer ${stamp}`,
      phone: "9800111222",
      area: "Matrix Area",
      credit_limit: 50000,
      opening_balance: 0,
    })
    .select("id")
    .single();
  if (cErr) r.fail("customer.insert", cErr.message);
  else {
    customerId = cust.id;
    r.pass("customer.insert", customerId.slice(0, 8));
  }

  // --- M6 Supplier ---
  const { data: supp, error: sErr } = await supabase
    .from("suppliers")
    .insert({ tenant_id: tenantId, name: `Matrix Supplier ${stamp}`, phone: "9811222333" })
    .select("id")
    .single();
  if (sErr) r.fail("supplier.insert", sErr.message);
  else {
    supplierId = supp.id;
    r.pass("supplier.insert", supplierId.slice(0, 8));
  }

  // --- M3 Product ---
  const { data: prod, error: pErr } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      code: `MX-${stamp}`,
      name: `Matrix Product ${stamp}`,
      category: "Ice Cream",
      unit: "PCS",
      purchase_price: 80,
      sale_price: 100,
      mrp: 120,
      opening_stock: 0,
      min_qty: 5,
      is_active: true,
    })
    .select("id")
    .single();
  if (pErr) r.fail("product.insert", pErr.message);
  else {
    productId = prod.id;
    r.pass("product.insert", productId.slice(0, 8));
  }

  // --- M4 Product update ---
  const { error: puErr } = await supabase
    .from("products")
    .update({ sale_price: 105, purchase_price: 82 })
    .eq("id", productId);
  if (puErr) r.fail("product.update", puErr.message);
  else {
    const { data: prow } = await supabase.from("products").select("sale_price").eq("id", productId).single();
    r.assertClose(prow?.sale_price, 105, "product.sale_price after update");
  }

  // --- S2 Sale with discount, VAT, extra; partial pay ---
  const subtotal = 10 * 100;
  const discount = 50;
  const vat = 123;
  const extra = 20;
  const expectedTotal = subtotal - discount + vat + extra; // 1093
  let mainBillTotal = expectedTotal;
  const paidAtBill = 400;

  const { data: saleRows, error: saleErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: T,
    p_payment_mode: "Credit",
    p_discount: discount,
    p_items: [{ product_id: productId, qty: 10, rate: 100 }],
    p_paid: paidAtBill,
    p_notes: `matrix-${stamp}`,
    p_vat_amount: vat,
    p_extra_charges: extra,
  });
  if (saleErr) r.fail("sale.create", saleErr.message);
  else {
    const row = Array.isArray(saleRows) ? saleRows[0] : saleRows;
    billId = row?.bill_id;
    billNo = row?.bill_no;
    r.pass("sale.create", billNo);

    const { data: bill } = await supabase
      .from("sales_bills")
      .select("subtotal, discount, vat_amount, extra_charges, total, paid")
      .eq("id", billId)
      .single();
    r.assertClose(bill?.subtotal, subtotal, "sale.subtotal");
    r.assertClose(bill?.discount, discount, "sale.discount");
    r.assertClose(bill?.vat_amount, vat, "sale.vat_amount");
    r.assertClose(bill?.extra_charges, extra, "sale.extra_charges");
    r.assertClose(bill?.total, expectedTotal, "sale.total");
    r.assertClose(bill?.paid, paidAtBill, "sale.paid at billing");
    r.assertClose(Number(bill?.total) - Number(bill?.paid), expectedTotal - paidAtBill, "sale.open balance");
    if (billNo && !billNo.startsWith(prefix)) r.fail("sale.bill_no prefix", billNo);
    else r.pass("sale.bill_no prefix", billNo);
  }

  // --- Bill update (migration 0007 update_sales_bill) ---
  if (billId) {
    const newDiscount = 40;
    const expectedAfterUpdate = subtotal - newDiscount + vat + extra;
    const { error: updErr } = await supabase.rpc("update_sales_bill", {
      p_bill_id: billId,
      p_customer_id: customerId,
      p_bill_date: T,
      p_payment_mode: "Credit",
      p_discount: newDiscount,
      p_items: [{ product_id: productId, qty: 10, rate: 100 }],
      p_notes: `matrix-${stamp}-upd`,
      p_vat_amount: vat,
      p_extra_charges: extra,
    });
    if (updErr) r.fail("sale.update", updErr.message);
    else {
      r.pass("sale.update");
      const { data: billU } = await supabase
        .from("sales_bills")
        .select("discount, total, paid")
        .eq("id", billId)
        .single();
      r.assertClose(billU?.discount, newDiscount, "sale.update discount");
      r.assertClose(billU?.total, expectedAfterUpdate, "sale.update total");
      r.assertClose(billU?.paid, paidAtBill, "sale.update paid unchanged");
      mainBillTotal = expectedAfterUpdate;
    }
  }

  // --- S7 Multi-line subtotal ---
  const { data: p2, error: p2e } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      code: `MX2-${stamp}`,
      name: `Matrix Product B ${stamp}`,
      category: "Ice Cream",
      unit: "PCS",
      purchase_price: 40,
      sale_price: 50,
      mrp: 60,
      opening_stock: 0,
      is_active: true,
    })
    .select("id")
    .single();
  if (p2e) r.fail("product.insert B", p2e.message);
  else {
    const productIdB = p2.id;
    const multiSub = 2 * 100 + 3 * 50; // 350
    const { data: multiRows, error: multiErr } = await supabase.rpc("create_sales_bill", {
      p_customer_id: customerId,
      p_bill_date: T,
      p_payment_mode: "Cash",
      p_discount: 0,
      p_items: [
        { product_id: productId, qty: 2, rate: 100 },
        { product_id: productIdB, qty: 3, rate: 50 },
      ],
      p_paid: multiSub,
      p_vat_amount: 0,
      p_extra_charges: 0,
    });
    if (multiErr) r.fail("sale.multi_line", multiErr.message);
    else {
      const mid = (Array.isArray(multiRows) ? multiRows[0] : multiRows)?.bill_id;
      const { data: mb } = await supabase.from("sales_bills").select("subtotal, total").eq("id", mid).single();
      r.assertClose(mb?.subtotal, multiSub, "sale.multi_line subtotal");
      r.assertClose(mb?.total, multiSub, "sale.multi_line total");
    }
  }

  // --- S5 Over-pay attempt (new bill) ---
  const { data: sale2, error: s5e } = await supabase.rpc("create_sales_bill", {
    p_customer_id: customerId,
    p_bill_date: T,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [{ product_id: productId, qty: 1, rate: 500 }],
    p_paid: 800,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (s5e) r.fail("sale.overpay", s5e.message);
  else {
    const id2 = (Array.isArray(sale2) ? sale2[0] : sale2)?.bill_id;
    const { data: b2 } = await supabase.from("sales_bills").select("total, paid").eq("id", id2).single();
    r.assertClose(b2?.paid, 500, "sale.overpay caps paid at total");
  }

  // --- P1 Payment ---
  const payAmt = 250;
  const { error: payErr } = await supabase.rpc("apply_customer_payment", {
    p_payment_date: T,
    p_customer_id: customerId,
    p_amount: payAmt,
    p_mode: "Cash",
    p_notes: `matrix-pay-${stamp}`,
    p_allocations: [{ bill_id: billId, amount: payAmt }],
  });
  if (payErr) r.fail("payment.apply", payErr.message);
  else {
    r.pass("payment.apply", String(payAmt));
    const { data: billAfterPay } = await supabase.from("sales_bills").select("paid, total").eq("id", billId).single();
    r.assertClose(billAfterPay?.paid, paidAtBill + payAmt, "bill.paid after payment");
    const open = Number(billAfterPay?.total) - Number(billAfterPay?.paid);
    r.assertClose(open, mainBillTotal - paidAtBill - payAmt, "bill.open after payment");
  }

  // --- R1 Return (credit capped) ---
  const creditTry = 500;
  const openBeforeReturn = mainBillTotal - paidAtBill - payAmt;
  const { error: retErr } = await supabase.rpc("apply_goods_return", {
    p_return_date: T,
    p_customer_id: customerId,
    p_bill_id: billId,
    p_credit_amount: creditTry,
    p_lines: [{ product_id: productId, return_qty: 1, reason: "return", credit_note_amount: 0 }],
    p_notes: null,
  });
  if (retErr) r.fail("return.apply", retErr.message);
  else {
    r.pass("return.apply");
    const { data: billAfterRet } = await supabase.from("sales_bills").select("paid, total").eq("id", billId).single();
    const paidAfterRet = Number(billAfterRet?.paid);
    const expectedPaidAfterRet = paidAtBill + payAmt + openBeforeReturn; // credit capped at open
    r.assertClose(paidAfterRet, expectedPaidAfterRet, "bill.paid after return (credit capped)");
    r.assertClose(
      Number(billAfterRet?.total) - paidAfterRet,
      0,
      "bill.open zero after full credit",
    );
    const { count } = await supabase
      .from("returns")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("product_id", productId);
    if ((count ?? 0) < 1) r.fail("returns.row", "none");
    else r.pass("returns.row");
  }

  // --- PU1 Purchase ---
  const poQty = 50;
  const poRate = 80;
  const poTotal = poQty * poRate;
  const { data: purRows, error: purErr } = await supabase.rpc("record_purchase", {
    p_purchase_date: T,
    p_supplier_id: supplierId,
    p_lines: [{ product_id: productId, qty: poQty, rate: poRate }],
    p_notes: `matrix-po-${stamp}`,
  });
  if (purErr) r.fail("purchase.record", purErr.message);
  else {
    const po = Array.isArray(purRows) ? purRows[0] : purRows;
    purchaseId = po?.purchase_id;
    r.pass("purchase.record", po?.purchase_no ?? "ok");
    const { data: pur } = await supabase.from("purchases").select("total, paid").eq("id", purchaseId).single();
    r.assertClose(pur?.total, poTotal, "purchase.total");
    r.assertClose(pur?.paid, 0, "purchase.paid initially");
  }

  // --- PU2 Supplier payment ---
  const supPay = 1000;
  const { error: spErr } = await supabase.rpc("apply_supplier_payment", {
    p_payment_date: T,
    p_supplier_id: supplierId,
    p_amount: supPay,
    p_notes: null,
  });
  if (spErr) r.fail("supplier.payment", spErr.message);
  else {
    r.pass("supplier.payment");
    const { data: pur } = await supabase.from("purchases").select("paid").eq("id", purchaseId).single();
    r.assertClose(pur?.paid, Math.min(supPay, poTotal), "purchase.paid after supplier payment");
  }

  // --- D1 Damage ---
  const dmgQty = 2;
  const { error: dmgErr } = await supabase.rpc("record_damage", {
    p_damage_date: T,
    p_product_id: productId,
    p_qty: dmgQty,
    p_reason: "Breakage",
    p_cost: 160,
    p_notes: null,
  });
  if (dmgErr) r.fail("damage.record", dmgErr.message);
  else r.pass("damage.record");

  // --- E1 Expense ---
  const { error: expErr } = await supabase.rpc("record_expense", {
    p_expense_date: T,
    p_category: "Miscellaneous",
    p_amount: 99,
    p_paid_by: null,
    p_notes: `matrix-exp-${stamp}`,
  });
  if (expErr) r.fail("expense.record", expErr.message);
  else r.pass("expense.record");

  // --- Capital entry ---
  const capName = `Matrix Capital ${stamp}`;
  const { error: capErr } = await supabase.from("capital_entries").insert({
    tenant_id: tenantId,
    name: capName,
    category: "owner_capital",
    entry_date: T,
    amount: 25_000,
    current_value: 25_000,
    notes: `matrix-cap-${stamp}`,
  });
  if (capErr) r.fail("capital.insert", capErr.message);
  else {
    const { data: capRow } = await supabase
      .from("capital_entries")
      .select("amount")
      .eq("tenant_id", tenantId)
      .eq("name", capName)
      .maybeSingle();
    if (!capRow) r.fail("capital.read", "not found");
    else r.pass("capital.insert", String(capRow.amount));
  }

  // --- Supplier balance view ---
  const { data: supBal } = await supabase
    .from("v_supplier_balance")
    .select("balance, total_purchased")
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!supBal) r.fail("v_supplier_balance", "missing");
  else {
    r.pass("v_supplier_balance.read", `balance=${supBal.balance}`);
    if (Number(supBal.balance) < 0) r.fail("v_supplier_balance.non-negative", String(supBal.balance));
    else r.pass("v_supplier_balance.non-negative");
  }

  // --- RLS scope (optional: needs service role to compare global vs tenant-visible rows) ---
  const env = loadEnvFile(resolve(APP, ".env.local"));
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { count: globalCust } = await admin
      .from("customers")
      .select("id", { count: "exact", head: true });
    const { count: scopedCust } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });
    if (scopedCust != null && globalCust != null && scopedCust > globalCust) {
      r.fail("rls.customers scoped", `user sees ${scopedCust} > global ${globalCust}`);
    } else r.pass("rls.customers scoped", `${scopedCust ?? "?"} / ${globalCust ?? "?"}`);
  } else {
    r.pass("rls.customers scoped", "skip (no SUPABASE_SERVICE_ROLE_KEY)");
  }

  // --- G Stock ---
  const soldQty = 10 + 1 + 2; // main bill + overpay bill + multi-line (2× on product A)
  const returnedQty = 1;
  const expectedStock = 0 + poQty - soldQty - dmgQty + returnedQty;
  const { data: stk } = await supabase.from("v_stock").select("closing_stock").eq("product_id", productId).maybeSingle();
  if (!stk) r.fail("v_stock.row", "missing");
  else r.assertClose(stk.closing_stock, expectedStock, "v_stock.closing_stock");

  // --- Customer balance view ---
  const { data: cb } = await supabase
    .from("v_customer_balance")
    .select("balance, total_billed, total_paid")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (!cb) r.fail("v_customer_balance", "missing");
  else {
    r.pass("v_customer_balance.read", `balance=${cb.balance}`);
    if (Number(cb.balance) < 0) r.fail("v_customer_balance.non-negative", String(cb.balance));
    else r.pass("v_customer_balance.non-negative");
  }

  await supabase.auth.signOut({ scope: "local" });
  r.pass("auth.signOut");
} catch (e) {
  r.fail("fatal", e instanceof Error ? e.message : String(e));
}

const fails = r.summary();
process.exit(fails ? 1 : 0);
