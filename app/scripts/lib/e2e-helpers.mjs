/**
 * Shared helpers for Havmor E2E scripts (API + UI).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/** Load VITE_* from .env.local, or from process.env if the file is missing. */
export function loadEnvFile(path) {
  const anonOrPublishable = (o) =>
    o.VITE_SUPABASE_ANON_KEY || o.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  const fromProcess = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (!existsSync(path)) {
    const key = anonOrPublishable(fromProcess);
    if (fromProcess.VITE_SUPABASE_URL && key) {
      return {
        VITE_SUPABASE_URL: fromProcess.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: key,
      };
    }
    throw new Error(
      `Missing ${path}\n` +
        "  cp .env.example .env.local\n" +
        "  Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY (Supabase → API)",
    );
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  const key = anonOrPublishable(env);
  if (env.VITE_SUPABASE_URL && key) {
    env.VITE_SUPABASE_ANON_KEY = key;
  }
  return env;
}

export function loadCreds(credPath) {
  if (existsSync(credPath)) {
    const raw = readFileSync(credPath, "utf8");
    /** Last wins — create-e2e-user-and-test.mjs appends new blocks; do not use stale first pair. */
    let email;
    let password;
    for (const line of raw.split("\n")) {
      const em = line.match(/^E2E_EMAIL=(.+)$/);
      if (em) email = em[1].trim();
      const pw = line.match(/^E2E_PASSWORD=(.+)$/);
      if (pw) password = pw[1].trim();
    }
    if (email && password) return { email, password };
  }
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (email && password) return { email, password };
  throw new Error(
    "Missing E2E credentials. Run: node scripts/create-e2e-user-and-test.mjs\n" +
      "  Or set E2E_EMAIL and E2E_PASSWORD (or add them to app/.e2e-credentials.local)",
  );
}

export function createE2eReporter(title) {
  const results = [];
  return {
    results,
    pass(name, detail = "") {
      results.push({ name, ok: true, detail });
      console.log("✓", name, detail ? `— ${detail}` : "");
    },
    fail(name, detail) {
      results.push({ name, ok: false, detail });
      console.error("✗", name, detail);
    },
    assertEq(actual, expected, name) {
      if (actual !== expected) this.fail(name, `expected ${expected}, got ${actual}`);
      else this.pass(name, String(actual));
    },
    assertClose(actual, expected, name, tol = 0.02) {
      const a = Number(actual);
      const e = Number(expected);
      if (Number.isNaN(a) || Number.isNaN(e) || Math.abs(a - e) > tol) {
        this.fail(name, `expected ${e}, got ${a}`);
      } else this.pass(name, String(a));
    },
    summary() {
      console.log(`\n=== ${title} ===\n`);
      const fails = results.filter((r) => !r.ok);
      console.log("\n--- Results ---");
      for (const r of results) {
        console.log(r.ok ? "✓" : "✗", r.name, r.detail ? `— ${r.detail}` : "");
      }
      console.log(`\n${results.length - fails.length}/${results.length} passed\n`);
      return fails.length;
    },
  };
}

/**
 * Service-role client (bypasses RLS). Use only in trusted local/CI scripts — never in the browser.
 * Requires SUPABASE_SERVICE_ROLE_KEY in app/.env.local or process.env.
 */
export function loadAdminClient(appDir) {
  const env = loadEnvFile(resolve(appDir, ".env.local"));
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "loadAdminClient: set SUPABASE_SERVICE_ROLE_KEY in app/.env.local (or env) along with VITE_SUPABASE_URL",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Prefer explicit UUID, then TENANT_ID env, else the tenant for the signed-in E2E user. */
export async function resolveTenantId(appDir, explicitTenantId) {
  const fromEnv = process.env.TENANT_ID?.trim();
  const id = (explicitTenantId || fromEnv || "").trim();
  if (id) return id;
  const { tenantId } = await createAuthedClient(appDir);
  return tenantId;
}

export async function createAuthedClient(appDir) {
  const env = loadEnvFile(resolve(appDir, ".env.local"));
  const creds = loadCreds(resolve(appDir, ".e2e-credentials.local"));
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { data: auth, error } = await supabase.auth.signInWithPassword(creds);
  if (error) throw new Error(`signIn: ${error.message}`);
  const { data: tu } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!tu?.tenant_id) throw new Error("No tenant_users row");
  return { supabase, tenantId: tu.tenant_id, userId: auth.user.id };
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Parse bill/UI amounts: "Rs. 576", "NPR 1,093", "576" → number */
export function parseNpr(text) {
  if (!text) return NaN;
  const cleaned = String(text)
    .trim()
    .replace(/^(?:NPR|Rs\.?)\s*/i, "")
    .replace(/,/g, "");
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}
