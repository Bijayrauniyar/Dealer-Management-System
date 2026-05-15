/**
 * Live Supabase test with credentials (no browser).
 * Usage: npm run e2e:live
 * Credentials: app/.e2e-credentials.local (from create-e2e-user-and-test.mjs) or E2E_EMAIL / E2E_PASSWORD.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadCreds, loadEnvFile } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

let email;
let password;
try {
  ({ email, password } = loadCreds(resolve(APP, ".e2e-credentials.local")));
} catch {
  email = process.env.E2E_EMAIL;
  password = process.env.E2E_PASSWORD;
}
if (!email || !password) {
  console.error(
    "Missing credentials. Run: node scripts/create-e2e-user-and-test.mjs\n" +
      "Or set E2E_EMAIL and E2E_PASSWORD in the environment.",
  );
  process.exit(1);
}

const env = loadEnvFile(resolve(APP, ".env.local"));

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const results = [];
const pass = (name, detail = "") => results.push({ name, ok: true, detail });
const fail = (name, detail) => {
  results.push({ name, ok: false, detail });
  console.error("FAIL:", name, detail);
};

console.log("Signing in…");
const { data: auth, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
if (signErr) {
  fail("signIn", signErr.message);
  printSummary();
  process.exit(1);
}
pass("signIn", `user ${auth.user.id.slice(0, 8)}…`);

const { data: tu, error: tuErr } = await supabase
  .from("tenant_users")
  .select("tenant_id, role")
  .eq("user_id", auth.user.id)
  .maybeSingle();
if (tuErr || !tu?.tenant_id) fail("tenant_users", tuErr?.message ?? "no row");
else pass("tenant_users", tu.tenant_id.slice(0, 8));

let tenantStatus = null;
if (tu?.tenant_id) {
  const { data: t, error: tErr } = await supabase.from("tenants").select("status").eq("id", tu.tenant_id).maybeSingle();
  tenantStatus = t?.status ?? null;
  if (tErr) fail("tenants.status", tErr.message);
  else pass("tenants.status", tenantStatus ?? "null");
}

if (tenantStatus !== "active") {
  fail("tenant active", `status is "${tenantStatus}" — run: update tenants set status='active' where id='${tu?.tenant_id}'`);
}

const { data: settings, error: se } = await supabase.from("tenant_settings").select("tenant_id").eq("tenant_id", tu.tenant_id).maybeSingle();
if (se) fail("tenant_settings read", se.message);
else if (!settings) fail("tenant_settings read", "no row");
else pass("tenant_settings read");

const { data: products, error: pe } = await supabase.from("products").select("id").limit(5);
if (pe) fail("products read", pe.message);
else pass("products read", `${products?.length ?? 0} rows (RLS ok)`);

const { error: expErr } = await supabase.rpc("record_expense", {
  p_expense_date: new Date().toISOString().slice(0, 10),
  p_category: "Miscellaneous",
  p_amount: 1,
  p_paid_by: null,
  p_notes: "e2e-smoke",
});
if (expErr) fail("record_expense RPC", expErr.message);
else pass("record_expense RPC");

await supabase.auth.signOut({ scope: "local" });
pass("signOut");

function printSummary() {
  console.log("\n--- Results ---");
  for (const r of results) console.log(r.ok ? "✓" : "✗", r.name, r.detail ? `— ${r.detail}` : "");
  const nFail = results.filter((r) => !r.ok).length;
  process.exit(nFail ? 1 : 0);
}

printSummary();
