/**
 * Phase 0 Tier C — shell, support, Share, migrations 0025/0026, Home tabs.
 *
 * Usage:
 *   npm run e2e:tier-c           # source + route wiring (no login)
 *   npm run e2e:tier-c:live      # + live DB column checks + customer PAN/VAT round-trip
 *
 * Env: app/.env.local (+ .e2e-credentials.local for --live)
 *
 * On Tier C / shell / patterns / bill actions: add/update checks here (same PR).
 * See docs/backend/phase1-use-cases-and-tests.md § Keeping tests in sync.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter, createAuthedClient } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const MIG = resolve(APP, "supabase/migrations");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("Phase 0 Tier C");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

function readMig(name) {
  const p = resolve(MIG, name);
  if (!existsSync(p)) {
    r.fail(`migration ${name}`, "missing");
    return "";
  }
  r.pass(`migration ${name} present`);
  return readFileSync(p, "utf8");
}

function runSourceChecks() {
  readMig("0025_tenant_support_contacts.sql");
  readMig("0026_customer_tax_ids.sql");

  const mig26 = readFileSync(resolve(MIG, "0026_customer_tax_ids.sql"), "utf8");
  if (mig26.includes("pan_number") && mig26.includes("vat_number")) {
    r.pass("0026 adds customers.pan_number + vat_number");
  } else {
    r.fail("0026 schema", "expected pan_number, vat_number");
  }

  const router = readSrc("routes/AppRouter.tsx");
  if (router) {
    for (const path of ["reports", "support", 'path="more"']) {
      if (router.includes(path)) r.pass(`AppRouter ${path}`);
      else r.fail(`AppRouter ${path}`, "missing");
    }
    if (router.includes('Navigate to="/app/home?tab=customers"')) {
      r.pass("AppRouter /app/customers → Home customers tab");
    } else {
      r.fail("AppRouter customers redirect", "missing");
    }
    if (router.includes('Navigate to="/app/home?tab=stock"')) {
      r.pass("AppRouter /app/stock → Home stock tab");
    } else {
      r.fail("AppRouter stock redirect", "missing");
    }
  }

  const nav = readSrc("config/appNavigation.ts");
  if (nav) {
    if (nav.includes("isHomeTabActive") && nav.includes("isCustomersTabActive")) {
      r.pass("appNavigation tab active helpers");
    } else {
      r.fail("appNavigation", "missing tab helpers");
    }
    if (nav.includes("/app/support") && nav.includes("BikriKhata support")) {
      r.pass("drawer Support → /app/support");
    } else {
      r.fail("drawer support link", "missing");
    }
  }

  const shell = readSrc("components/layout/AppShell.tsx");
  if (shell) {
    if (shell.includes('label: "Home"') && shell.includes('label: "Reports"')) {
      r.pass("AppShell bottom tabs Home + Reports");
    } else {
      r.fail("AppShell tabs", "missing labels");
    }
    if (shell.includes("/app/home?tab=customers") && shell.includes("/app/home?tab=stock")) {
      r.pass("AppShell Customers + Inventory tab URLs");
    } else {
      r.fail("AppShell tab URLs", "missing query tabs");
    }
    if (shell.includes("AppNavDrawer")) {
      r.pass("AppShell mounts AppNavDrawer");
    } else {
      r.fail("AppShell drawer", "missing");
    }
  }

  const drawer = readSrc("components/layout/AppNavDrawer.tsx");
  if (drawer && drawer.includes("NAV_DRAWER_GROUPS")) {
    r.pass("AppNavDrawer uses NAV_DRAWER_GROUPS");
  }

  const supportPage = readSrc("pages/support/SupportPage.tsx");
  if (supportPage && supportPage.includes("PLATFORM_SUPPORT")) {
    r.pass("SupportPage uses PLATFORM_SUPPORT");
  } else if (supportPage) {
    r.fail("SupportPage", "missing PLATFORM_SUPPORT");
  }

  const settings = readSrc("pages/settings/SettingsPage.tsx");
  if (settings) {
    if (!settings.includes('id: "support"') && !settings.includes('label: "Support"')) {
      r.pass("Settings has no Support tab");
    } else {
      r.fail("Settings Support tab", "should be menu-only");
    }
  }

  const billDetail = readSrc("pages/bills/BillDetailPage.tsx");
  if (billDetail) {
    if (billDetail.includes("PageActionBar") && billDetail.includes('label: "Share"')) {
      r.pass("BillDetailPage Share via PageActionBar");
    } else {
      r.fail("BillDetailPage Share", "missing PageActionBar Share");
    }
    if (!billDetail.includes("WhatsApp")) {
      r.pass("BillDetailPage no WhatsApp label");
    } else {
      r.fail("BillDetailPage WhatsApp", "should be Share only");
    }
    if (billDetail.includes('variant: "primary"') && billDetail.includes("Collect")) {
      r.pass("BillDetailPage Collect uses primary variant");
    } else {
      r.fail("BillDetailPage Collect", "missing primary Collect");
    }
  }

  const home = readSrc("pages/home/HomePage.tsx");
  if (home) {
    if (
      home.includes("SegmentedTabs") &&
      home.includes("searchParams") &&
      home.includes('tab: t')
    ) {
      r.pass("HomePage SegmentedTabs + URL sync");
    } else {
      r.fail("HomePage tabs", "missing SegmentedTabs or searchParams tab sync");
    }
    if (home.includes("ListBrowsePanel")) {
      r.pass("HomePage ListBrowsePanel browse");
    } else {
      r.fail("HomePage browse", "missing ListBrowsePanel");
    }
  }

  const patterns = readSrc("components/app/patterns.tsx");
  if (patterns && patterns.includes("ListPageHeader") && patterns.includes("FormPageHeader")) {
    r.pass("patterns.tsx reusable chrome");
  } else if (patterns) {
    r.fail("patterns.tsx", "incomplete exports");
  }

  const customerForm = readSrc("pages/customers/CustomerFormPage.tsx");
  if (customerForm) {
    if (customerForm.includes("Customer PAN") && customerForm.includes("Customer VAT")) {
      r.pass("CustomerFormPage PAN/VAT fields");
    } else {
      r.fail("CustomerFormPage tax fields", "missing");
    }
    if (customerForm.includes("/app/home?tab=customers")) {
      r.pass("CustomerForm save → Home customers tab");
    } else {
      r.fail("CustomerForm redirect", "expected /app/home?tab=customers");
    }
  }

  const domainHooks = readSrc("store/domainHooks.ts");
  if (domainHooks && domainHooks.includes("pan_number")) {
    r.pass("domainHooks maps pan_number / vat_number");
  } else if (domainHooks) {
    r.fail("domainHooks tax ids", "missing");
  }

  const readme = readFileSync(resolve(APP, "supabase/README.txt"), "utf8");
  if (readme.includes("0025") && readme.includes("0026")) {
    r.pass("supabase/README.txt documents 0025 + 0026");
  } else {
    r.fail("README migrations", "missing 0025/0026 steps");
  }
}

async function runLiveChecks() {
  const stamp = Date.now().toString(36).toUpperCase();
  let supabase;
  let tenantId;
  try {
    ({ supabase, tenantId } = await createAuthedClient(APP));
    r.pass("live.auth + tenant", tenantId.slice(0, 8));
  } catch (e) {
    r.fail("live.auth", e.message);
    return;
  }

  const colChecks = [
    {
      name: "0026 customers.pan_number,vat_number",
      run: () => supabase.from("customers").select("id, pan_number, vat_number").limit(1),
    },
    {
      name: "0025 tenant_settings.support_*",
      run: () =>
        supabase
          .from("tenant_settings")
          .select("support_phone, support_email, support_whatsapp")
          .eq("tenant_id", tenantId)
          .limit(1),
    },
  ];
  for (const c of colChecks) {
    const { error } = await c.run();
    if (error) {
      const missing = /column|does not exist|Could not find/i.test(error.message);
      r.fail(c.name, missing ? `NOT APPLIED — ${error.message}` : error.message);
    } else {
      r.pass(c.name);
    }
  }

  const pan = `PAN${stamp.slice(0, 6)}`;
  const vat = `VAT${stamp.slice(0, 6)}`;
  const custName = `E2E Tax ${stamp}`;

  const { data: inserted, error: insErr } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: custName,
      phone: "9800000001",
      area: "E2E",
      credit_limit: 10000,
      opening_balance: 0,
      pan_number: pan,
      vat_number: vat,
    })
    .select("id, pan_number, vat_number")
    .single();

  if (insErr) {
    r.fail("live.customer insert pan/vat", insErr.message);
    return;
  }
  if (inserted?.pan_number === pan && inserted?.vat_number === vat) {
    r.pass("live.customer insert pan/vat round-trip");
  } else {
    r.fail("live.customer insert", `got pan=${inserted?.pan_number} vat=${inserted?.vat_number}`);
  }

  const { error: delErr } = await supabase.from("customers").delete().eq("id", inserted.id);
  if (delErr) r.fail("live.customer cleanup", delErr.message);
  else r.pass("live.customer cleanup");
}

console.log(`\n=== Phase 0 Tier C (${wantLive ? "source + live" : "source only"}) ===\n`);
runSourceChecks();
if (wantLive) await runLiveChecks();
process.exit(r.summary());
