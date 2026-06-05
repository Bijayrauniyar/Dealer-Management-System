/**
 * One-shot setup: Resend secrets + deploy Edge Function + platform_system_config URL.
 *
 * Prerequisites:
 *   - supabase login && supabase link (in app/)
 *   - Migration 0033 applied (SQL Editor or supabase db push)
 *   - RESEND_API_KEY in env or app/.env.local
 *
 * Usage:
 *   cd app && npm run setup:contact-email
 *   RESEND_API_KEY=re_xxx npm run setup:contact-email
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const envPath = resolve(appRoot, ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: appRoot, stdio: "inherit", ...opts });
  if (r.status !== 0) {
    console.error(`\nFailed: ${cmd} (exit ${r.status ?? "signal"})`);
    process.exit(r.status ?? 1);
  }
}

const env = loadEnv();
const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const resendKey = env.RESEND_API_KEY || "";
const notifyTo = env.INQUIRY_NOTIFY_TO || "support.bikrikhata@gmail.com";
const resendFrom = env.RESEND_FROM || "BikriKhata <onboarding@resend.dev>";
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT")) {
  console.error("Set VITE_SUPABASE_URL in app/.env.local");
  process.exit(1);
}

if (!resendKey || !resendKey.startsWith("re_")) {
  console.error(
    "Set RESEND_API_KEY=re_… in app/.env.local or env before running.\n" +
      "Get a key at https://resend.com/api-keys",
  );
  process.exit(1);
}

console.log("BikriKhata contact email setup");
console.log("Project:", supabaseUrl.replace(/https:\/\/([^.]+).*/, "$1"));
console.log("Notify:", notifyTo);

run("npx", ["supabase", "secrets", "set", `RESEND_API_KEY=${resendKey}`]);
run("npx", ["supabase", "secrets", "set", `INQUIRY_NOTIFY_TO=${notifyTo}`]);
run("npx", ["supabase", "secrets", "set", `RESEND_FROM=${resendFrom}`]);
run("npx", ["supabase", "functions", "deploy", "notify-platform-inquiry", "--no-verify-jwt"]);

if (serviceKey) {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from("platform_system_config").upsert(
    { key: "supabase_project_url", value: supabaseUrl, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) {
    console.warn("\nCould not set platform_system_config:", error.message);
    console.warn("Run migration 0033 in SQL Editor, then:");
    console.warn(
      `  insert into platform_system_config (key, value) values ('supabase_project_url', '${supabaseUrl}') on conflict (key) do update set value = excluded.value;`,
    );
  } else {
    console.log("\nOK — platform_system_config.supabase_project_url set.");
  }
} else {
  console.warn("\nNo SUPABASE_SERVICE_ROLE_KEY — set URL manually after migration 0033:");
  console.warn(
    `  insert into platform_system_config (key, value) values ('supabase_project_url', '${supabaseUrl}') on conflict (key) do update set value = excluded.value;`,
  );
}

const healthUrl = `${supabaseUrl}/functions/v1/notify-platform-inquiry`;
try {
  const res = await fetch(healthUrl);
  const body = await res.json();
  console.log("\nEdge function health:", body);
  if (!body.resend_configured) {
    console.warn("WARN: resend_configured is false — re-check supabase secrets.");
  }
} catch (e) {
  console.warn("Could not reach edge function health:", e.message);
}

console.log("\nDone. Ensure migration 0033 is applied (pg_net trigger).");
console.log("Test: npm run test:contact-form — then check", notifyTo, "and Resend Logs.");
