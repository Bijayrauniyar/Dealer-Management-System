/**
 * GET notify-platform-inquiry health (Resend configured?).
 * Usage: node scripts/test-contact-email-health.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
const url = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
if (!url) {
  console.error("Set VITE_SUPABASE_URL in .env.local");
  process.exit(1);
}

const healthUrl = `${url}/functions/v1/notify-platform-inquiry`;
const res = await fetch(healthUrl);
const body = await res.json();

console.log("GET", healthUrl);
console.log("Status:", res.status);
console.log(JSON.stringify(body, null, 2));

if (res.ok && body.resend_configured) {
  console.log("\nOK — email function ready.");
  process.exit(0);
}

console.error("\nNot ready — run: npm run setup:contact-email");
process.exit(1);
