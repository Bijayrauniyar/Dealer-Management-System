/**
 * Curated demo dataset for a single tenant (Phase 1 tables).
 * Uses the same RPCs as production (`create_sales_bill`, `record_purchase`, …).
 */

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {object} opts
 * @param {import("@supabase/supabase-js").SupabaseClient} opts.supabase - JWT session (tenant owner)
 * @param {string} opts.tenantId
 * @param {string} opts.billDate - YYYY-MM-DD
 * @param {string} opts.stamp - short unique suffix for codes/names (e.g. from Date.now().toString(36))
 */
export async function runDemoSeed({ supabase, tenantId, billDate, stamp }) {
  const prefix = `DEMO-${stamp}`;

  const { error: se } = await supabase
    .from("tenant_settings")
    .update({
      bill_footer: `Thank you — ${prefix}`,
      invoice_prefix: "DEMO",
    })
    .eq("tenant_id", tenantId);
  if (se) throw new Error(`demo seed settings: ${se.message}`);

  const products = [
    {
      code: `${prefix}-VAN`,
      name: `Demo Vanilla 500ml ${stamp}`,
      category: "Ice cream",
      unit: "PCS",
      purchase_price: 200,
      sale_price: 280,
      mrp: 320,
      opening_stock: 0,
      min_qty: 10,
      is_active: true,
    },
    {
      code: `${prefix}-CHO`,
      name: `Demo Chocolate cup ${stamp}`,
      category: "Ice cream",
      unit: "PCS",
      purchase_price: 45,
      sale_price: 65,
      mrp: 80,
      opening_stock: 0,
      min_qty: 24,
      is_active: true,
    },
    {
      code: `${prefix}-STR`,
      name: `Demo Strawberry bar ${stamp}`,
      category: "Ice cream",
      unit: "PCS",
      purchase_price: 35,
      sale_price: 50,
      mrp: 60,
      opening_stock: 0,
      min_qty: 20,
      is_active: true,
    },
  ];

  const productRows = [];
  for (const p of products) {
    const { data, error } = await supabase
      .from("products")
      .insert({ tenant_id: tenantId, ...p })
      .select("id")
      .single();
    if (error) throw new Error(`demo product ${p.code}: ${error.message}`);
    productRows.push({ ...p, id: data.id });
  }

  const [vanId, choId, strId] = [productRows[0].id, productRows[1].id, productRows[2].id];

  const schemeStart = addDays(billDate, -30);
  const schemeEnd = addDays(billDate, 90);
  const { error: schemeErr } = await supabase.from("scheme_tracker").insert([
    {
      tenant_id: tenantId,
      scheme_name: `${prefix} Vanilla buy-10-get-1`,
      product_id: vanId,
      buy_qty: 10,
      free_qty: 1,
      start_date: schemeStart,
      end_date: schemeEnd,
      is_active: true,
    },
    {
      tenant_id: tenantId,
      scheme_name: `${prefix} Chocolate buy-20-get-2`,
      product_id: choId,
      buy_qty: 20,
      free_qty: 2,
      start_date: schemeStart,
      end_date: schemeEnd,
      is_active: true,
    },
  ]);
  if (schemeErr) throw new Error(`demo schemes: ${schemeErr.message}`);

  const { data: c1, error: c1e } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: `Demo Retail ${stamp}`,
      phone: "9801111001",
      area: "Demo Ward",
      credit_limit: 100_000,
      opening_balance: 0,
    })
    .select("id")
    .single();
  if (c1e) throw new Error(`demo customer retail: ${c1e.message}`);

  const { data: c2, error: c2e } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: `Demo Wholesale ${stamp}`,
      phone: "9801111002",
      area: "Demo Route B",
      credit_limit: 500_000,
      opening_balance: 0,
    })
    .select("id")
    .single();
  if (c2e) throw new Error(`demo customer wholesale: ${c2e.message}`);

  const { data: supRow, error: sErr } = await supabase
    .from("suppliers")
    .insert({
      tenant_id: tenantId,
      name: `Demo Suppliers Co ${stamp}`,
      phone: "9802222001",
      payable_opening: 0,
    })
    .select("id")
    .single();
  if (sErr) throw new Error(`demo supplier: ${sErr.message}`);

  const supplierId = supRow.id;
  const retailId = c1.id;
  const wholesaleId = c2.id;

  const poQty = 120;
  const poRate = 200;
  const { data: purRows, error: purErr } = await supabase.rpc("record_purchase", {
    p_purchase_date: billDate,
    p_supplier_id: supplierId,
    p_lines: [{ product_id: vanId, qty: poQty, rate: poRate }],
    p_notes: `${prefix} opening-stock PO`,
  });
  if (purErr) throw new Error(`demo purchase: ${purErr.message}`);
  const purchaseRow = Array.isArray(purRows) ? purRows[0] : purRows;
  const purchaseId = purchaseRow?.purchase_id;

  const saleDiscount = 100;
  const saleVat = 117;
  const saleExtra = 30;
  const subtotal = 8 * 280;
  const expectedTotal = subtotal - saleDiscount + saleVat + saleExtra;
  const paidAtBill = 600;

  const { data: saleRows, error: saleErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: retailId,
    p_bill_date: billDate,
    p_payment_mode: "Credit",
    p_discount: saleDiscount,
    p_items: [{ product_id: vanId, qty: 8, rate: 280 }],
    p_paid: paidAtBill,
    p_notes: `${prefix} credit sale`,
    p_vat_amount: saleVat,
    p_extra_charges: saleExtra,
  });
  if (saleErr) throw new Error(`demo sale: ${saleErr.message}`);
  const saleRow = Array.isArray(saleRows) ? saleRows[0] : saleRows;
  const billId = saleRow?.bill_id;

  const payExtra = 400;
  const { error: payErr } = await supabase.rpc("apply_customer_payment", {
    p_payment_date: billDate,
    p_customer_id: retailId,
    p_amount: payExtra,
    p_mode: "Cash",
    p_notes: `${prefix} allocation`,
    p_allocations: [{ bill_id: billId, amount: payExtra }],
  });
  if (payErr) throw new Error(`demo payment: ${payErr.message}`);

  const { data: pur2, error: pur2e } = await supabase.rpc("record_purchase", {
    p_purchase_date: billDate,
    p_supplier_id: supplierId,
    p_lines: [
      { product_id: choId, qty: 80, rate: 45 },
      { product_id: vanId, qty: 20, rate: 200 },
    ],
    p_notes: `${prefix} mixed PO`,
  });
  if (pur2e) throw new Error(`demo purchase 2: ${pur2e.message}`);

  const supplierPay = 15_000;
  const { error: spErr } = await supabase.rpc("apply_supplier_payment", {
    p_payment_date: billDate,
    p_supplier_id: supplierId,
    p_amount: supplierPay,
    p_notes: `${prefix} supplier pay`,
  });
  if (spErr) throw new Error(`demo supplier payment: ${spErr.message}`);

  const { error: retErr } = await supabase.rpc("apply_goods_return", {
    p_return_date: billDate,
    p_customer_id: retailId,
    p_bill_id: billId,
    p_credit_amount: 200,
    p_lines: [{ product_id: vanId, return_qty: 1, reason: "Demo return", credit_note_amount: 0 }],
    p_notes: `${prefix} return`,
  });
  if (retErr) throw new Error(`demo return: ${retErr.message}`);

  const { error: dmgErr } = await supabase.rpc("record_damage", {
    p_damage_date: billDate,
    p_product_id: vanId,
    p_qty: 2,
    p_reason: "Demo damage",
    p_cost: 400,
    p_notes: `${prefix}`,
  });
  if (dmgErr) throw new Error(`demo damage: ${dmgErr.message}`);

  const { error: expErr } = await supabase.rpc("record_expense", {
    p_expense_date: billDate,
    p_category: "Transport",
    p_amount: 1200,
    p_paid_by: "Owner",
    p_notes: `${prefix} fuel`,
  });
  if (expErr) throw new Error(`demo expense: ${expErr.message}`);

  const { error: capErr } = await supabase.from("capital_entries").insert({
    tenant_id: tenantId,
    name: `Demo owner capital ${stamp}`,
    category: "owner_capital",
    entry_date: billDate,
    amount: 250_000,
    current_value: 250_000,
    notes: `${prefix}`,
  });
  if (capErr) throw new Error(`demo capital: ${capErr.message}`);

  const { data: cashBill, error: cashErr } = await supabase.rpc("create_sales_bill", {
    p_customer_id: wholesaleId,
    p_bill_date: billDate,
    p_payment_mode: "Cash",
    p_discount: 0,
    p_items: [
      { product_id: choId, qty: 10, rate: 65 },
      { product_id: productRows[2].id, qty: 12, rate: 50 },
    ],
    p_paid: 10 * 65 + 12 * 50,
    p_notes: `${prefix} cash sale`,
    p_vat_amount: 0,
    p_extra_charges: 0,
  });
  if (cashErr) throw new Error(`demo cash sale: ${cashErr.message}`);

  return {
    prefix,
    expectedPrimarySaleTotal: expectedTotal,
    paidAtBill,
    payExtra,
    purchaseId,
    billId,
    productIds: productRows.map((p) => p.id),
    customerIds: [retailId, wholesaleId],
    supplierId,
    saleMeta: { subtotal, discount: saleDiscount, vat: saleVat, extra: saleExtra },
    cashBill: Array.isArray(cashBill) ? cashBill[0] : cashBill,
  };
}
