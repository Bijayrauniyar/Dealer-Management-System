/**
 * Insert active buy-X-get-Y schemes on existing products (for manual / UI testing).
 *
 * Usage (from app/):
 *   npm run seed:schemes
 *
 * Creates:
 *   - Product 1: buy 10 get 1 (same UOM)
 *   - Product 2: buy 20 get 2 (same UOM)
 *   - Pack product: buy 1 Box get 1 PCS free (needs migration 0012_scheme_uom.sql)
 *
 * Requires E2E credentials (.e2e-credentials.local or E2E_EMAIL / E2E_PASSWORD).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAuthedClient, today } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");

const SCHEME_NAME_PREFIX = "Test scheme";

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parsePackConversion(raw, baseUnit) {
  if (!raw || typeof raw !== "object") return null;
  const packUom = (raw.pack_uom ?? raw.packUom ?? "").trim();
  const factor = Math.round(Number(raw.factor ?? raw.piecesPerPack ?? 0));
  const base = (baseUnit ?? "PCS").trim();
  if (!packUom || packUom === base || factor < 2) return null;
  return { packUom, baseUom: base };
}

async function findPackProduct(supabase) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, unit, uom_conversion")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(`products: ${error.message}`);
  for (const p of data ?? []) {
    const conv = parsePackConversion(p.uom_conversion, p.unit);
    if (conv) return { id: p.id, name: p.name, ...conv };
  }
  return null;
}

export async function seedSchemesForTenant(supabase, tenantId, billDate = today()) {
  const startDate = addDays(billDate, -30);
  const endDate = addDays(billDate, 90);

  const { data: products, error: pe } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name")
    .limit(3);
  if (pe) throw new Error(`products: ${pe.message}`);
  if (!products?.length) {
    throw new Error("No active products — add products first or run npm run seed:demo");
  }

  const { error: delErr } = await supabase
    .from("scheme_tracker")
    .delete()
    .eq("tenant_id", tenantId)
    .like("scheme_name", `${SCHEME_NAME_PREFIX}%`);
  if (delErr) throw new Error(`clear old test schemes: ${delErr.message}`);

  const rows = [
    {
      tenant_id: tenantId,
      scheme_name: `${SCHEME_NAME_PREFIX} — ${products[0].name}`,
      product_id: products[0].id,
      buy_qty: 10,
      free_qty: 1,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    },
  ];

  if (products[1]) {
    rows.push({
      tenant_id: tenantId,
      scheme_name: `${SCHEME_NAME_PREFIX} — ${products[1].name}`,
      product_id: products[1].id,
      buy_qty: 20,
      free_qty: 2,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });
  }

  const packProduct = await findPackProduct(supabase);
  if (packProduct) {
    rows.push({
      tenant_id: tenantId,
      scheme_name: `${SCHEME_NAME_PREFIX} — 1 ${packProduct.packUom} → 1 ${packProduct.baseUom} free`,
      product_id: packProduct.id,
      buy_qty: 1,
      free_qty: 1,
      buy_uom: packProduct.packUom,
      free_uom: packProduct.baseUom,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });
  }

  let inserted;
  const full = await supabase
    .from("scheme_tracker")
    .insert(rows)
    .select("id, scheme_name, product_id, buy_qty, free_qty, buy_uom, free_uom, start_date, end_date");
  if (full.error?.message?.includes("buy_uom")) {
    const legacy = rows.map(({ buy_uom, free_uom, ...r }) => r);
    const leg = await supabase
      .from("scheme_tracker")
      .insert(legacy)
      .select("id, scheme_name, product_id, buy_qty, free_qty, start_date, end_date");
    if (leg.error) throw new Error(`insert schemes: ${leg.error.message}`);
    inserted = leg.data;
    if (packProduct) {
      console.warn(
        "\n⚠ Box→piece scheme skipped — run migration app/supabase/migrations/0012_scheme_uom.sql in Supabase SQL editor, then npm run seed:schemes again.\n",
      );
    }
  } else {
    if (full.error) throw new Error(`insert schemes: ${full.error.message}`);
    inserted = full.data;
  }

  return { startDate, endDate, billDate, schemes: inserted ?? [], packProduct };
}

async function main() {
  const { supabase, tenantId } = await createAuthedClient(APP);
  const billDate = today();
  const result = await seedSchemesForTenant(supabase, tenantId, billDate);

  console.log(`Tenant ${tenantId}`);
  console.log(`Active ${result.startDate} → ${result.endDate} (today ${result.billDate})`);
  for (const s of result.schemes) {
    const uom =
      s.buy_uom || s.free_uom
        ? ` (buy ${s.buy_qty} ${s.buy_uom ?? "?"}, free ${s.free_qty} ${s.free_uom ?? "?"})`
        : `: buy ${s.buy_qty} get ${s.free_qty} free`;
    console.log(`  • ${s.scheme_name}${uom}`);
  }
  if (result.packProduct) {
    console.log(
      `\nBox→piece: New bill → ${result.packProduct.name} → UOM ${result.packProduct.packUom} → qty 1 → +1 ${result.packProduct.baseUom} FOC line on bill`,
    );
  }
  console.log("\nBill print: paid row + next row with FOC label, amount 0");
  console.log("Try: Home → Stock → On scheme");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
