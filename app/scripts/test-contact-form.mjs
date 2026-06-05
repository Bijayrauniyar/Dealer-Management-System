/**
 * Test landing contact form → platform_inquiries.
 * Usage: node scripts/test-contact-form.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Missing app/.env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key || url.includes("YOUR_PROJECT")) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const testRow = {
  full_name: "E2E Contact Test",
  email: `test+${Date.now()}@example.com`,
  phone: "+9779800000000",
  business_name: "Test Co",
  business_type: "Distributor",
  message: "automated test — safe to delete",
  inquiry_purpose: "Book a demo",
  source: "test-script",
};

console.log("Supabase:", url.replace(/https:\/\/([^.]+).*/, "$1…"));

const { data: rpcId, error: rpcErr } = await supabase.rpc("submit_platform_inquiry", {
  p_payload: testRow,
});

if (!rpcErr && rpcId) {
  console.log("OK via RPC — id:", rpcId);
  process.exit(0);
}

console.log("RPC failed:", rpcErr?.message ?? "no id");

const { data, error } = await supabase.from("platform_inquiries").insert(testRow).select("id").single();

if (error) {
  console.error("INSERT failed:", error.message);
  console.error("\nFix: Supabase SQL Editor → run migrations 0027, 0028, 0029");
  console.error("  app/supabase/migrations/0027_platform_inquiries.sql");
  console.error("  app/supabase/migrations/0028_platform_inquiries_insert_policy.sql");
  console.error("  app/supabase/migrations/0029_platform_inquiries_purpose.sql");
  process.exit(1);
}

console.log("OK via INSERT — id:", data.id);
