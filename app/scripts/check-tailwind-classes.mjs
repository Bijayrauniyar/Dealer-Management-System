/**
 * Fail if invalid Tailwind classes slip in (semantic *-DEFAULT, surface-raised, etc.).
 * Usage: node scripts/check-tailwind-classes.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");

const PATTERNS = [
  {
    name: "semantic *-DEFAULT (use bg-danger not bg-danger-DEFAULT)",
    re: /\b(?:bg|text|border|ring|fill|stroke|outline|divide|decoration|accent|caret|shadow)-(?:danger|warning|success|info|primary|muted)-DEFAULT\b/,
  },
  {
    name: "border-border-DEFAULT (use border-border-subtle)",
    re: /\bborder-border-DEFAULT\b/,
  },
  {
    name: "bg-surface-raised (use bg-surface-card)",
    re: /\bbg-surface-raised\b/,
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js|css)$/.test(name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8");
  const rel = relative(join(ROOT, ".."), file);
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) hits.push({ file: rel, rule: name });
    re.lastIndex = 0;
  }
}

if (hits.length === 0) {
  console.log("check-tailwind-classes: OK (no invalid semantic *-DEFAULT / surface-raised)");
  process.exit(0);
}

console.error("check-tailwind-classes: invalid Tailwind classes found:\n");
for (const h of hits) console.error(`  ${h.file} — ${h.rule}`);
process.exit(1);
