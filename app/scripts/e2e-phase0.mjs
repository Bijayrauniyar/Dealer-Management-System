/**
 * Phase 0 gate — Tier A + B + C automated checks.
 *
 * Usage:
 *   npm run e2e:phase0           # all source checks (no login)
 *   npm run e2e:phase0:live      # + Tier A/B/C live DB checks (+ stock:live for Tier B oversell)
 *
 * When you change Tier A/B/C features, routes, migrations, or patterns.tsx:
 * update e2e-tier-a.mjs | e2e-tier-b.mjs | e2e-tier-c.mjs in the same PR.
 * See docs/backend/phase1-use-cases-and-tests.md § Keeping tests in sync.
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const wantLive = process.argv.includes("--live");

const suites = [
  { name: "Tier A", script: "e2e-tier-a.mjs" },
  { name: "Tier B", script: "e2e-tier-b.mjs" },
  { name: "Tier C", script: "e2e-tier-c.mjs" },
];

console.log(`\n=== Phase 0 (${wantLive ? "source + live" : "source only"}) ===\n`);

let failed = false;
for (const { name, script } of suites) {
  console.log(`--- ${name} ---\n`);
  const args = ["scripts/" + script];
  if (wantLive) args.push("--live");
  const res = spawnSync(process.execPath, args, { cwd: APP, stdio: "inherit", env: process.env });
  if (res.status !== 0) {
    failed = true;
    console.error(`\n✗ ${name} failed (exit ${res.status ?? "signal"})\n`);
  } else {
    console.log(`\n✓ ${name} passed\n`);
  }
}

if (failed) {
  console.error("Phase 0 e2e: FAILED");
  process.exit(1);
}
console.log("Phase 0 e2e: all tiers passed");
process.exit(0);
