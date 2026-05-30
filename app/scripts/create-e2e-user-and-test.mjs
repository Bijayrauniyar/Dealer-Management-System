/**
 * Creates a fresh Supabase auth user + tenant, activates if service role available, runs smoke tests.
 * Usage: node scripts/create-e2e-user-and-test.mjs
 * Optional: SUPABASE_SERVICE_ROLE_KEY in app/.env.local (never commit) to auto-activate tenant.
 */
import { appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

const env = loadEnvFile(resolve(APP, ".env.local"));
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY in app/.env.local",
  );
  process.exit(1);
}

const stamp = Date.now();
const email = `bikrikhata.e2e.${stamp}@gmail.com`;
const password = `BikriKhataE2E!${String(stamp).slice(-6)}`;

const supabase = createClient(url, anon);
const admin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

const results = [];
const ok = (n, d = "") => results.push({ n, ok: true, d });
const bad = (n, d) => {
  results.push({ n, ok: false, d });
  console.error("FAIL:", n, d);
};

console.log("\n=== Creating E2E test user ===\n");
console.log("Email:   ", email);
console.log("Password:", password);
console.log("(Save these — shown once)\n");

const { data: signUp, error: signUpErr } = await supabase.auth.signUp({ email, password });
if (signUpErr) {
  bad("auth.signUp", signUpErr.message);
  summary();
  process.exit(1);
}
if (!signUp.session) {
  bad("auth.signUp session", "No session — disable Confirm email in Supabase Auth settings");
  summary();
  process.exit(1);
}
ok("auth.signUp", signUp.user.id.slice(0, 8));

const { error: rpcErr } = await supabase.rpc("signup_tenant", {
  p_business_name: "E2E Test Shop",
  p_owner_name: "E2E Tester",
  p_phone: "9800000001",
  p_city: "Birgunj",
});
if (rpcErr) {
  bad("signup_tenant", rpcErr.message);
  summary();
  process.exit(1);
}
ok("signup_tenant");

const { data: tu } = await supabase
  .from("tenant_users")
  .select("tenant_id")
  .eq("user_id", signUp.user.id)
  .maybeSingle();
const tenantId = tu?.tenant_id;
if (!tenantId) {
  bad("tenant_users", "no row after signup_tenant");
  summary();
  process.exit(1);
}
ok("tenant_users", tenantId.slice(0, 8));

let { data: tenant } = await supabase.from("tenants").select("status").eq("id", tenantId).maybeSingle();
ok("tenants read", tenant?.status ?? "?");

if (tenant?.status !== "active") {
  if (admin) {
    const { error: actErr } = await admin.from("tenants").update({ status: "active" }).eq("id", tenantId);
    if (actErr) bad("activate tenant (service role)", actErr.message);
    else {
      ok("activate tenant (service role)", "active");
      tenant = { status: "active" };
    }
  } else {
    console.warn(
      "\nWARN: Tenant is pending. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (local only) or run in SQL Editor:\n",
      `  update tenants set status = 'active' where id = '${tenantId}';\n`,
    );
  }
}

// Re-sign-in fresh client
await supabase.auth.signOut({ scope: "local" });
const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
if (signInErr) {
  bad("signIn", signInErr.message);
  summary();
  process.exit(1);
}
ok("signIn");

const { data: settings } = await supabase.from("tenant_settings").select("name").eq("tenant_id", tenantId).maybeSingle();
if (!settings) bad("tenant_settings", "missing");
else ok("tenant_settings", settings.name);

const { error: pe } = await supabase.from("products").select("id").limit(1);
if (pe) bad("products RLS", pe.message);
else ok("products RLS");

const { error: expErr } = await supabase.rpc("record_expense", {
  p_expense_date: new Date().toISOString().slice(0, 10),
  p_category: "Miscellaneous",
  p_amount: 1,
  p_paid_by: null,
  p_notes: "e2e-create-script",
});
if (expErr) bad("record_expense", expErr.message);
else ok("record_expense");

if (tenant?.status !== "active") {
  console.warn("\nNOTE: UI login will show Pending until you run the SQL above or add service role key.\n");
}

await supabase.auth.signOut({ scope: "local" });
ok("signOut");

// Write credentials for local dev (gitignored)
const credPath = resolve(__dirname, "../.e2e-credentials.local");
appendFileSync(
  credPath,
  `\n# ${new Date().toISOString()}\nE2E_EMAIL=${email}\nE2E_PASSWORD=${password}\nTENANT_ID=${tenantId}\n`,
);
console.log("\nCredentials appended to app/.e2e-credentials.local (gitignored)\n");

function summary() {
  console.log("\n--- Results ---");
  for (const r of results) console.log(r.ok ? "✓" : "✗", r.n, r.d ? `— ${r.d}` : "");
  const fails = results.filter((r) => !r.ok).length;
  if (!fails && tenant?.status === "active") {
    console.log("\n✓ E2E user ready. Log in at http://localhost:5173/login with the email/password above.\n");
  }
  process.exit(fails ? 1 : tenant?.status === "active" ? 0 : 2);
}

summary();
