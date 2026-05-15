/**
 * Phase 1 full flow test (same RPCs / tables the UI uses).
 * Usage: node scripts/e2e-phase1-full.mjs
 * Credentials: app/.e2e-credentials.local or E2E_EMAIL + E2E_PASSWORD
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const stamp = Date.now().toString(36).toUpperCase();
const today = new Date().toISOString().slice(0, 10);

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function loadCreds() {
  const credPath = resolve(__dirname, "../.e2e-credentials.local");
  if (existsSync(credPath)) {
    const raw = readFileSync(credPath, "utf8");
    const email = raw.match(/^E2E_EMAIL=(.+)$/m)?.[1]?.trim();
    const password = raw.match(/^E2E_PASSWORD=(.+)$/m)?.[1]?.trim();
    if (email && password) return { email, password };
  }
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (email && password) return { email, password };
  throw new Error("Set E2E_EMAIL/E2E_PASSWORD or create app/.e2e-credentials.local");
}

const env = loadEnvFile(resolve(__dirname, "../.env.local"));
const { email, password } = loadCreds();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const results = [];
const pass = (name, detail = "") => results.push({ name, ok: true, detail });
const fail = (name, detail) => {
  results.push({ name, ok: false, detail });
  console.error("FAIL:", name, detail);
};

let tenantId = "";
let customerId = "";
let supplierId = "";
let productId = "";
let billId = "";
let billNo = "";

console.log(`\n=== Phase 1 full E2E (${stamp}) ===\n`);

const { data: auth, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
if (signErr) {
  fail("1. signIn", signErr.message);
  printSummary();
  process.exit(1);
}
pass("1. signIn", auth.user.id.slice(0, 8));

const { data: tu, error: tuErr } = await supabase
  .from("tenant_users")
  .select("tenant_id")
  .eq("user_id", auth.user.id)
  .maybeSingle();
if (tuErr || !tu?.tenant_id) fail("2. tenant_users", tuErr?.message ?? "missing");
else {
  tenantId = tu.tenant_id;
  pass("2. tenant_users", tenantId.slice(0, 8));
}

const { data: t } = await supabase.from("tenants").select("status").eq("id", tenantId).maybeSingle();
if (t?.status !== "active") fail("2b. tenant active", `status=${t?.status}`);
else pass("2b. tenant active");

const testPrefix = `E2E${stamp}`;
const { error: setErr } = await supabase
  .from("tenant_settings")
  .update({ invoice_prefix: testPrefix, bill_footer: `Footer ${stamp}` })
  .eq("tenant_id", tenantId);
if (setErr) fail("3. settings update", setErr.message);
else pass("3. settings update", `prefix ${testPrefix}`);

const { data: cust, error: cErr } = await supabase
  .from("customers")
  .insert({
    tenant_id: tenantId,
    name: `E2E Customer ${stamp}`,
    phone: "9800000000",
    area: "Test Area",
    route: "Route A",
  })
  .select("id")
  .single();
if (cErr) fail("4. customer insert", cErr.message);
else {
  customerId = cust.id;
  pass("4. customer insert", customerId.slice(0, 8));
}

const { data: supp, error: sErr } = await supabase
  .from("suppliers")
  .insert({
    tenant_id: tenantId,
    name: `E2E Supplier ${stamp}`,
    phone: "9811111111",
  })
  .select("id")
  .single();
if (sErr) fail("5. supplier insert", sErr.message);
else {
  supplierId = supp.id;
  pass("5. supplier insert", supplierId.slice(0, 8));
}

const { data: prod, error: pErr } = await supabase
  .from("products")
  .insert({
    tenant_id: tenantId,
    code: `P-${stamp}`,
    name: `E2E Vanilla ${stamp}`,
    category: "Ice Cream",
    unit: "PCS",
    purchase_price: 80,
    sale_price: 100,
    mrp: 120,
    discount_pct: 0,
    vat_applicable: false,
    min_qty: 10,
    is_active: true,
  })
  .select("id")
  .single();
if (pErr) fail("6. product insert", pErr.message);
else {
  productId = prod.id;
  pass("6. product insert", productId.slice(0, 8));
}

const { data: saleRows, error: saleErr } = await supabase.rpc("create_sales_bill", {
  p_customer_id: customerId,
  p_bill_date: today,
  p_payment_mode: "Cash",
  p_discount: 0,
  p_items: [{ product_id: productId, qty: 10, rate: 100 }],
  p_paid: 500,
  p_notes: `e2e-sale-${stamp}`,
  p_vat_amount: 0,
  p_extra_charges: 0,
});
if (saleErr) fail("7. create_sales_bill", saleErr.message);
else {
  const row = Array.isArray(saleRows) ? saleRows[0] : saleRows;
  billId = row?.bill_id;
  billNo = row?.bill_no;
  pass("7. create_sales_bill", billNo);
}

const { error: payErr } = await supabase.rpc("apply_customer_payment", {
  p_payment_date: today,
  p_customer_id: customerId,
  p_amount: 200,
  p_mode: "Cash",
  p_notes: `e2e-pay-${stamp}`,
  p_allocations: [{ bill_id: billId, amount: 200 }],
});
if (payErr) fail("8. apply_customer_payment", payErr.message);
else pass("8. apply_customer_payment");

const { error: retErr } = await supabase.rpc("apply_goods_return", {
  p_return_date: today,
  p_customer_id: customerId,
  p_bill_id: billId,
  p_credit_amount: 100,
  p_lines: [{ product_id: productId, return_qty: 1, reason: "return", credit_note_amount: 0 }],
  p_notes: null,
});
if (retErr) fail("9. apply_goods_return", retErr.message);
else pass("9. apply_goods_return");

const { data: purRows, error: purErr } = await supabase.rpc("record_purchase", {
  p_purchase_date: today,
  p_supplier_id: supplierId,
  p_lines: [{ product_id: productId, qty: 50, rate: 80 }],
  p_notes: `e2e-po-${stamp}`,
});
if (purErr) fail("10. record_purchase", purErr.message);
else {
  const po = Array.isArray(purRows) ? purRows[0] : purRows;
  pass("10. record_purchase", po?.purchase_no ?? "ok");
}

const { error: spErr } = await supabase.rpc("apply_supplier_payment", {
  p_payment_date: today,
  p_supplier_id: supplierId,
  p_amount: 1000,
  p_notes: `e2e-sup-pay-${stamp}`,
});
if (spErr) fail("11. apply_supplier_payment", spErr.message);
else pass("11. apply_supplier_payment");

const { error: expErr } = await supabase.rpc("record_expense", {
  p_expense_date: today,
  p_category: "Miscellaneous",
  p_amount: 250,
  p_paid_by: null,
  p_notes: `e2e-exp-${stamp}`,
});
if (expErr) fail("12. record_expense", expErr.message);
else pass("12. record_expense");

const { error: dmgErr } = await supabase.rpc("record_damage", {
  p_damage_date: today,
  p_product_id: productId,
  p_qty: 2,
  p_reason: "Breakage",
  p_cost: 160,
  p_notes: `e2e-dmg-${stamp}`,
});
if (dmgErr) fail("13. record_damage", dmgErr.message);
else pass("13. record_damage");

const checks = [
  ["sales_bills", { bill_no: billNo }],
  ["sales_items", { product_id: productId }],
  ["payments", { customer_id: customerId }],
  ["purchases", { supplier_id: supplierId }],
  ["expenses", { category: "Miscellaneous" }],
  ["damages", { product_id: productId }],
];
for (const [table, filter] of checks) {
  const { data, error } = await supabase.from(table).select("id").match(filter).limit(1);
  if (error) fail(`14. verify ${table}`, error.message);
  else if (!data?.length) fail(`14. verify ${table}`, "no row");
  else pass(`14. verify ${table}`);
}

await supabase.auth.signOut({ scope: "local" });
pass("15. signOut");

function printSummary() {
  console.log("\n--- Results ---");
  for (const r of results) console.log(r.ok ? "✓" : "✗", r.name, r.detail ? `— ${r.detail}` : "");
  const nFail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - nFail}/${results.length} passed\n`);
  process.exit(nFail ? 1 : 0);
}

printSummary();
