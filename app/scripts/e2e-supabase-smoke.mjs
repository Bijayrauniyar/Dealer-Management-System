/**
 * Headless Supabase smoke test (no browser). Logs to debug session file.
 * Usage: node scripts/e2e-supabase-smoke.mjs
 * Optional: E2E_EMAIL=... E2E_PASSWORD=... for auth + tenant profile checks
 */
import { appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadCreds, loadEnvFile } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const LOG_PATH = resolve(APP, ".e2e-smoke.log");

function log(hypothesisId, location, message, data = {}) {
  const line = JSON.stringify({
    sessionId: "8d753e",
    hypothesisId,
    location,
    message,
    data,
    runId: "smoke-script",
    timestamp: Date.now(),
  });
  try {
    appendFileSync(LOG_PATH, line + "\n");
  } catch {
    // ignore log file errors (read-only env, etc.)
  }
  console.log(`[${hypothesisId}] ${message}`, data);
}

const env = loadEnvFile(resolve(APP, ".env.local"));
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  log("H3", "smoke", "missing env", { hasUrl: !!url, hasAnon: !!anon });
  process.exit(1);
}

const supabase = createClient(url, anon);

log("H3", "smoke", "env ok", { urlHost: new URL(url).host });

const tables = ["tenant_users", "tenants", "tenant_settings", "sales_bills", "products", "capital_entries"];
let tableFails = 0;
for (const t of tables) {
  const { error, count } = await supabase.from(t).select("*", { count: "exact", head: true });
  if (error) tableFails++;
  log("H5", "smoke", `table ${t}`, { ok: !error, error: error?.message ?? null, count });
}

const uomChecks = [
  {
    name: "products.uom_prices,uom_conversion",
    run: () => supabase.from("products").select("uom_prices, uom_conversion").limit(1),
    hint: "0008 + 0009",
  },
  {
    name: "sales_items.unit",
    run: () => supabase.from("sales_items").select("unit").limit(1),
    hint: "0010",
  },
];
for (const { name, run, hint } of uomChecks) {
  const { error } = await run();
  if (error) {
    tableFails++;
    log("H5", "smoke", `uom column ${name}`, {
      ok: false,
      error: error.message,
      hint: `Apply migration ${hint}`,
    });
  } else {
    log("H5", "smoke", `uom column ${name}`, { ok: true });
  }
}

const { error: rpcProbe } = await supabase.rpc("signup_tenant", {
  p_business_name: "x",
  p_owner_name: "y",
  p_phone: "",
  p_city: "",
});
log("H4", "smoke", "signup_tenant callable (unauthenticated expected fail)", {
  code: rpcProbe?.code ?? null,
  message: rpcProbe?.message ?? null,
});

let email;
let password;
try {
  ({ email, password } = loadCreds(resolve(APP, ".e2e-credentials.local")));
} catch {
  email = process.env.E2E_EMAIL;
  password = process.env.E2E_PASSWORD;
}
if (email && password) {
  const { data: auth, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  log("H3", "smoke", "signIn", { ok: !signErr, error: signErr?.message ?? null, userId: auth.user?.id?.slice(0, 8) });
  if (auth.user) {
    const { data: tu, error: tuErr } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    log("H1", "smoke", "tenant_users for user", {
      tenantId: tu?.tenant_id?.slice(0, 8) ?? null,
      role: tu?.role ?? null,
      error: tuErr?.message ?? null,
    });
    if (tu?.tenant_id) {
      const { data: tenant, error: tErr } = await supabase.from("tenants").select("status").eq("id", tu.tenant_id).maybeSingle();
      log("H2", "smoke", "tenant status", { status: tenant?.status ?? null, error: tErr?.message ?? null });
    }
  }
} else {
  log("H3", "smoke", "skip signIn", { hint: "Run create-e2e-user-and-test.mjs or set E2E_EMAIL/E2E_PASSWORD" });
}

console.log("\nSmoke test finished. See", LOG_PATH);
process.exit(tableFails > 0 ? 1 : 0);
