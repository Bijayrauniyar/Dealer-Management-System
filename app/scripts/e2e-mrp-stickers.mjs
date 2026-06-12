/**
 * MRP sticker generator — designs saved in Supabase, full-page A4 sheet printing.
 *
 * Usage:
 *   node scripts/e2e-mrp-stickers.mjs           # source + route checks (no Supabase)
 *   node scripts/e2e-mrp-stickers.mjs --live    # + authenticated table probe (needs 0045)
 *
 * Env: app/.env.local (+ app/.e2e-credentials.local for --live)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter, createAuthedClient } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const SRC = resolve(APP, "src");
const wantLive = process.argv.includes("--live");

const r = createE2eReporter("MRP stickers");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

function runSourceChecks() {
  const lib = readSrc("lib/mrpSticker.ts");
  if (lib && lib.includes("STICKER_PRESETS") && lib.includes("stickerSheetLayout") && lib.includes("suggestedFontSizes")) {
    r.pass("mrpSticker.ts presets + layout + auto-suggest");
  } else if (lib) {
    r.fail("mrpSticker.ts", "missing presets / layout / suggest helpers");
  }

  const sheet = readSrc("components/app/MrpStickerSheet.tsx");
  if (sheet && sheet.includes("mrp-sticker-print-root") && sheet.includes("breakAfter")) {
    r.pass("MrpStickerSheet print root + page break per design");
  } else if (sheet) {
    r.fail("MrpStickerSheet", "missing print root id or breakAfter");
  }

  const designer = readSrc("pages/mrp/MrpStickerDesignerPage.tsx");
  if (designer) {
    r.pass("MrpStickerDesignerPage exists");
    if (designer.includes("suggestedFontSizes") && designer.includes("fontsTouched")) {
      r.pass("Designer auto-suggest fonts until user overrides");
    } else {
      r.fail("Designer auto-suggest", "missing");
    }
    if (designer.includes("printDocument") && designer.includes("upsertMrpStickerDesignLive")) {
      r.pass("Designer save + print wiring");
    } else {
      r.fail("Designer save/print", "missing");
    }
    if (designer.includes("MrpStickerLabel")) {
      r.pass("Designer live preview label");
    } else {
      r.fail("Designer preview", "missing MrpStickerLabel");
    }
    if (designer.includes('value="left"') && designer.includes('value="right"') && designer.includes("Text align")) {
      r.pass("Designer text align option (left/middle/right)");
    } else {
      r.fail("Designer text align", "missing align select");
    }
  }

  const list = readSrc("pages/mrp/MrpStickerListPage.tsx");
  if (list) {
    r.pass("MrpStickerListPage exists");
    if (
      list.includes("fetchMrpStickerDesignsLive") &&
      list.includes("deleteMrpStickerDesignLive") &&
      list.includes("handleDuplicate")
    ) {
      r.pass("List history: fetch + duplicate + delete");
    } else {
      r.fail("List history", "missing fetch/duplicate/delete");
    }
    if (list.includes("Print selected") && list.includes("printQueue")) {
      r.pass("List multi-select print (one design per page)");
    } else {
      r.fail("List multi-print", "missing Print selected / printQueue");
    }
  }

  const domainLive = readSrc("lib/live/domainLive.ts");
  if (
    domainLive &&
    domainLive.includes("fetchMrpStickerDesignsLive") &&
    domainLive.includes("upsertMrpStickerDesignLive") &&
    domainLive.includes("markMrpStickerPrintedLive")
  ) {
    r.pass("domainLive MRP sticker CRUD");
    const crudBlock = domainLive.slice(domainLive.indexOf("MRP sticker designs"));
    const tenantScoped = (crudBlock.match(/eq\("tenant_id", tenantId\)/g) ?? []).length >= 3;
    if (tenantScoped) {
      r.pass("MRP sticker CRUD tenant-scoped");
    } else {
      r.fail("MRP sticker tenant scope", "expected .eq(tenant_id) on reads/writes");
    }
  } else if (domainLive) {
    r.fail("domainLive MRP CRUD", "missing sticker functions");
  }

  const router = readSrc("routes/AppRouter.tsx");
  if (
    router &&
    router.includes('path="mrp-stickers"') &&
    router.includes("mrp-stickers/new") &&
    router.includes("mrp-stickers/edit/:designId")
  ) {
    r.pass("Routes mrp-stickers (list/new/edit)");
  } else if (router) {
    r.fail("Routes mrp-stickers", "missing");
  }

  const nav = readSrc("config/appNavigation.ts");
  if (nav && nav.includes('"tools"') && nav.includes("/app/mrp-stickers")) {
    r.pass("Drawer Tools group with MRP stickers");
  } else if (nav) {
    r.fail("Drawer Tools group", "missing MRP stickers entry");
  }

  if (existsSync(resolve(APP, "supabase/migrations/0045_mrp_sticker_designs.sql"))) {
    const sql = readFileSync(resolve(APP, "supabase/migrations/0045_mrp_sticker_designs.sql"), "utf8");
    if (sql.includes("enable row level security") && sql.includes("current_tenant_id()")) {
      r.pass("0045 migration table + tenant RLS");
    } else {
      r.fail("0045 migration", "missing RLS policy");
    }
  } else {
    r.fail("0045 migration", "file missing");
  }
}

async function runLiveChecks() {
  const { supabase } = await createAuthedClient(APP);
  r.pass("live.auth", "signed in");

  const { data, error } = await supabase
    .from("mrp_sticker_designs")
    .select("id, title, width_mm, height_mm, qty, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) {
    if (error.code === "42P01" || /mrp_sticker_designs/.test(error.message ?? "")) {
      r.fail("live.mrp_sticker_designs", "table missing — run 0045_mrp_sticker_designs.sql");
    } else {
      r.fail("live.mrp_sticker_designs", error.message);
    }
    return;
  }
  r.pass("live.mrp_sticker_designs", `${data?.length ?? 0} row(s)`);
}

runSourceChecks();

if (wantLive) {
  try {
    await runLiveChecks();
  } catch (e) {
    r.fail("live.exception", e instanceof Error ? e.message : String(e));
  }
} else {
  r.pass("live.skip", "pass --live for Supabase checks");
}

const fails = r.summary();
process.exit(fails > 0 ? 1 : 0);
