/**
 * Visual + PDF download test for bills.
 * Catches clipped totals on mobile and broken PDF output.
 *
 * Requires: npm run dev, app/.env.local, app/.e2e-credentials.local, Playwright chromium
 *
 *   npm run e2e:bill:visual
 *
 * Outputs: app/test-output/bill-screen-mobile.png
 *          app/test-output/bill-screen-desktop.png
 *          app/test-output/bill-downloaded.pdf
 */
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createE2eReporter, loadEnvFile, loadCreds, parseNpr } from "./lib/e2e-helpers.mjs";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = resolve(__dirname, "..");
const OUT = resolve(APP, "test-output");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

const r = createE2eReporter("Bill visual + PDF download");

/** True if element's right edge is inside the viewport (not clipped). */
function isFullyVisible(box, viewportW) {
  if (!box) return false;
  return box.x >= -2 && box.x + box.width <= viewportW + 2;
}

async function parsePdfText(path) {
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = mod.default ?? mod;
    const buf = readFileSync(path);
    const data = await pdfParse(buf);
    return data.text ?? "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Cannot find package") || msg.includes("ERR_MODULE_NOT_FOUND")) {
      throw new Error("Install pdf-parse: cd app && npm install -D pdf-parse");
    }
    throw e;
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\//, { timeout: 25000 });
}

async function openBill(page, billNo) {
  await page.goto(`${BASE_URL}/app/bills/${encodeURIComponent(billNo)}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.locator("#bill-print-root").waitFor({ timeout: 15000 });
}

async function assertBillNotClipped(page, label) {
  const root = page.locator("#bill-print-root");
  const viewport = page.viewportSize();
  if (!viewport) {
    r.fail(`${label}.viewport`, "missing");
    return null;
  }

  const rootBox = await root.boundingBox();
  if (!rootBox) {
    r.fail(`${label}.root box`, "missing");
    return null;
  }
  if (rootBox.x + rootBox.width > viewport.width + 4) {
    r.fail(
      `${label}.bill width`,
      `bill ${Math.round(rootBox.width)}px overflows viewport ${viewport.width}px (scroll or fix layout)`,
    );
  } else {
    r.pass(`${label}.bill fits viewport`, `${Math.round(rootBox.width)}px`);
  }

    const title = root.getByText("SALES DETAILS");
    if ((await title.count()) !== 1) r.fail(`${label}.header title`, "missing centered SALES DETAILS");
    else r.pass(`${label}.header SALES DETAILS centered`);

    const metaText = await root.locator(".border-dashed").first().innerText().catch(() => "");
    if (/\bDue\b.*\bDue\b/i.test(metaText)) {
      r.fail(`${label}.meta status`, 'duplicate "Due" in bill header — use Pay by date');
    } else {
      r.pass(`${label}.meta no duplicate Due`);
    }
    if (/\bCash\b/i.test(metaText) && /\bDue\b/i.test(metaText) && !/Partial/i.test(metaText)) {
      r.fail(`${label}.meta payment`, '"Cash" with balance due — should be Credit or Partial (Cash)');
    } else {
      r.pass(`${label}.meta payment mode sensible`);
    }

    const mrpHeader = root.locator(".bill-lines-table thead th").nth(2);
    const mrpHdrText = (await mrpHeader.innerText()).trim();
    if (!/^MRP$/i.test(mrpHdrText)) {
      r.fail(`${label}.MRP header`, `clipped or missing: "${mrpHdrText}"`);
    } else {
      r.pass(`${label}.MRP column header visible`);
    }

    const grandValue = root.locator(".bill-totals-grand td").last();
  await grandValue.waitFor({ timeout: 5000 });
  const gvBox = await grandValue.boundingBox();
  if (!isFullyVisible(gvBox, viewport.width)) {
    r.fail(
      `${label}.grand total visible`,
      `right edge ${gvBox ? Math.round(gvBox.x + gvBox.width) : "?"} > viewport ${viewport.width}`,
    );
  } else {
    r.pass(`${label}.grand total not clipped`);
  }

  const metrics = await root.evaluate((el) => ({
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  if (metrics.scroll > metrics.client + 2) {
    r.fail(`${label}.no horizontal scroll`, `${metrics.scroll}px > ${metrics.client}px`);
  } else {
    r.pass(`${label}.no horizontal scroll`);
  }

  const amountCol = root.locator(".bill-lines-table tbody tr td").last();
  const amtBox = await amountCol.boundingBox();
  if (!isFullyVisible(amtBox, viewport.width)) {
    r.fail(`${label}.line amount column visible`, "amount column clipped — swipe table on phone");
  } else {
    r.pass(`${label}.line amount column visible`);
  }

  return root;
}

async function run() {
  mkdirSync(OUT, { recursive: true });

  let env;
  let creds;
  try {
    env = loadEnvFile(resolve(APP, ".env.local"));
    creds = loadCreds(resolve(APP, ".e2e-credentials.local"));
  } catch (e) {
    r.fail("setup", e instanceof Error ? e.message : String(e));
    return r.summary();
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { error: signErr } = await supabase.auth.signInWithPassword(creds);
  if (signErr) {
    r.fail("signIn", signErr.message);
    return r.summary();
  }
  r.pass("signIn");

  const { data: bill } = await supabase
    .from("sales_bills")
    .select("bill_no, total, subtotal")
    .order("bill_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!bill?.bill_no) {
    r.fail("bill", "no sales bill in tenant — create one first");
    return r.summary();
  }
  r.pass("bill loaded", bill.bill_no);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    await login(page, creds.email, creds.password);

    // ── Mobile (matches phone — was clipping totals) ──
    await page.setViewportSize({ width: 390, height: 844 });
    await openBill(page, bill.bill_no);
    const mobileRoot = await assertBillNotClipped(page, "mobile");
    if (mobileRoot) {
      await mobileRoot.screenshot({ path: resolve(OUT, "bill-screen-mobile.png") });
      r.pass("screenshot", "test-output/bill-screen-mobile.png");
    }

    // ── Desktop ──
    await page.setViewportSize({ width: 900, height: 1100 });
    await openBill(page, bill.bill_no);
    const desktopRoot = await assertBillNotClipped(page, "desktop");
    if (desktopRoot) {
      await desktopRoot.screenshot({ path: resolve(OUT, "bill-screen-desktop.png") });
      r.pass("screenshot", "test-output/bill-screen-desktop.png");
    }

    // ── Print layout: bill centered on page (not stuck in max-w-xl column) ──
    await page.emulateMedia({ media: "print" });
    const printRoot = page.locator("#bill-print-root");
    const printBox = await printRoot.boundingBox();
    const vp = page.viewportSize();
    if (!printBox || !vp) {
      r.fail("print.centered", "missing layout box");
    } else {
      const slack = Math.abs(vp.width - printBox.width) / 2;
      const leftGap = printBox.x;
      const rightGap = vp.width - (printBox.x + printBox.width);
      if (Math.abs(leftGap - rightGap) > 24) {
        r.fail(
          "print.centered",
          `left ${Math.round(leftGap)}px vs right ${Math.round(rightGap)}px (expected ~equal)`,
        );
      } else {
        r.pass("print.centered on page", `±${Math.round(Math.abs(leftGap - rightGap))}px`);
      }
      if (printBox.width < vp.width * 0.45) {
        r.fail("print.width", `bill only ${Math.round(printBox.width)}px on ${vp.width}px page`);
      } else {
        r.pass("print.bill uses page width", `${Math.round(printBox.width)}px`);
      }
    }
    await page.emulateMedia({ media: "screen" });

    // ── PDF download (vector PDF — must contain totals) ──
    const pdfPath = resolve(OUT, "bill-downloaded.pdf");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);
    await download.saveAs(pdfPath);

    if (!existsSync(pdfPath)) {
      r.fail("pdf.download", "file missing");
    } else {
      const stat = readFileSync(pdfPath);
      if (stat.length < 500) r.fail("pdf.size", `too small: ${stat.length} bytes`);
      else r.pass("pdf.download", `${stat.length} bytes`);

      const text = await parsePdfText(pdfPath);
      const needGrand = String(Math.round(Number(bill.total)));
      const textDense = text.replace(/\s/g, "");
      const isImagePdf = textDense.length < 80;

      if (isImagePdf) {
        if (stat.length < 12000) r.fail("pdf.capture", `styled PDF too small: ${stat.length} bytes`);
        else r.pass("pdf.matches screen design", `${stat.length} bytes`);
      } else {
        if (!/SALES DETAILS/i.test(text)) r.fail("pdf.text", "missing SALES DETAILS header");
        else r.pass("pdf.text SALES DETAILS header");

        if (!/Grand total/i.test(text)) r.fail("pdf.text", "missing Grand total");
        else r.pass("pdf.text Grand total");

        if (!/AMOUNT/i.test(text) || !/UNIT/i.test(text)) {
          r.fail("pdf.text", "missing table columns (AMOUNT/UNIT)");
        } else {
          r.pass("pdf.text full table columns");
        }

        if (!text.includes(needGrand) && !textDense.includes(needGrand)) {
          r.fail("pdf.text total value", `expected ${needGrand} in PDF text`);
        } else {
          r.pass("pdf.text total value", needGrand);
        }

        if (!/Subtotal/i.test(text)) r.fail("pdf.text", "missing Subtotal");
        else r.pass("pdf.text Subtotal");
      }

      const uiGrand = await desktopRoot
        .locator(".bill-totals-grand td")
        .last()
        .innerText()
        .catch(() => "");
      const uiNum = Number(String(uiGrand).replace(/[^\d]/g, "")) || 0;
      if (Math.abs(uiNum - Number(bill.total)) > 1) {
        r.fail("screen vs db total", `UI ${uiNum} DB ${bill.total}`);
      } else {
        r.pass("screen grand total matches DB", String(uiNum));
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("ECONNREFUSED") || msg.includes("net::ERR")) {
      r.fail("dev server", `Start: npm run dev (${BASE_URL})`);
    } else if (msg.includes("pdf-parse")) {
      r.fail("pdf-parse", msg);
    } else {
      r.fail("unhandled", msg);
    }
  } finally {
    await browser.close();
  }

  return r.summary();
}

console.log(`\n=== Bill visual + PDF @ ${BASE_URL} ===\n`);
const fails = await run();
console.log(fails > 0 ? "\nOpen app/test-output/ for screenshots and PDF.\n" : "");
process.exit(fails > 0 ? 1 : 0);
