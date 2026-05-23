# Product naming brief — paste into ChatGPT for name + branch ideas

**Status:** **Deferred** — decide name first, then rebrand in app/docs (see [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) § Deferred — product name & branding).

**Purpose:** We need a **generic product name** (not tied to one brand like Havmor) for a dealer/distributor management web app built for **Nepal**. Use this document as full context, then suggest: product name options (English + Nepali-friendly), tagline/subtitle, repo/package rename strategy, and Git branch naming conventions.

---

## Current branding (to replace)

| Place | Current text |
|-------|----------------|
| Login / Register screen | **DealerOS** (large title, teal) |
| Subtitle | **Havmor Distributor Panel** |
| npm package | `havmor-dms` |
| GitHub folder / repo | `havmor` |
| Docs / internal | “Havmor DMS” |

**Problem:** “DealerOS” sounds like a US SaaS placeholder; “Havmor” is one ice-cream distributor client — the product should work for **any** FMCG / cold-chain / general distributor in Nepal.

---

## What we are building (one paragraph)

A **multi-tenant Progressive Web App (PWA)** for **dealers and distributors** to run day-to-day operations: **sales bills (Karobar-style print/PDF)**, **stock on hand**, **purchases from suppliers**, **customer payments and credit**, **returns**, **expenses**, **damages**, **company overview and capital**, with **Supabase** (Postgres + Auth + RLS) and **RPCs** for money and inventory. Currency and UX assume **Nepal (NPR, Bikram Sambat dates in places, local payment modes: Cash, Credit, UPI-style labels)**. Each dealer company is a **tenant** (signup → approval → isolated data).

---

## Who uses it

- **Primary:** Distributor / dealer owner or accountant at a warehouse or depot (often mobile + desktop).
- **Geography:** Nepal first; may expand to similar South Asian distributor workflows.
- **Vertical:** Started with **ice cream / FMCG** (Havmor pilot) but name should fit **any** product category (groceries, beverages, hardware, pharma-lite, etc.).
- **Language:** UI is **English** today; users may prefer a **Nepali subtitle or dual label** on login (e.g. English product name + नेपाली tagline).

---

## Core capabilities already shipped (Phase 1)

| Module | What it does |
|--------|----------------|
| **Sales bills** | Line items, pack/PCS UOM, MRP/discount, VAT, bill-level discount, print + PDF, edit existing bills |
| **Stock** | Live `v_stock` (purchases − sales − damage + returns); stock page + low-stock alerts |
| **Sale product picker** | Shows all products; **out of stock** visible but not selectable; **low stock** warning; edit-bill exception for lines already on bill |
| **Purchases** | Supplier purchase with **invoice date** (including **past dates**) |
| **Payments** | Customer payment with FIFO allocation to open bills |
| **Returns** | Goods return linked to bills |
| **Supplier payments** | Pay supplier against purchases |
| **Products / customers / suppliers** | CRUD, categories, min stock thresholds |
| **Expenses & damages** | Operational costs and stock write-off |
| **Home / dashboard** | KPIs, aging receivables, overdue bills, period sales |
| **Company / capital** | Overview and capital entries (live) |
| **Settings** | Per-tenant branding, bill prefix, VAT defaults |
| **Auth** | Email login, tenant registration, roles (`owner`, `accountant`) |

**Tech:** React 19, TypeScript, Vite 7, Tailwind, TanStack Query, Supabase migrations `0001`–`0011`, deploy via **Netlify**.

---

## Recent work (context for “what we’re trying to do”)

1. **Bill print/PDF** — Karobar-style layout, correct line totals vs pack MRP, footer discount rules.
2. **Backdated documents** — Sales and purchases can use **past bill/invoice dates** (saved correctly in DB).
3. **Stock-aware sale picker** — UX guard so users don’t pick OOS products on **new** bills (today’s stock only; not historical “as of bill date” yet).
4. **Deferred (backlog)** — Block oversell in database; optional **stock as-of bill date** for backdated entry.
5. **Automated tests** — `e2e:bill`, `e2e:stock:live`, `e2e:stock-bill` (unit + live Supabase).

---

## Naming constraints (please respect)

- **Generic** — not “Havmor”, not “IceCream”, not one brand.
- **Memorable in Nepal** — easy to say in Nepali and English; avoid obscure English-only puns.
- **Short** — 1–2 words for app title; optional Nepali subtitle.
- **Available-ish** — prefer names unlikely to conflict with global giants (avoid “ERP”, “SAP”, “Tally” clones).
- **PWA / mobile** — name should work on home-screen icon and login header.
- **White-label ready** — tenant `tenant_settings` can hold logo/business name; **product name** is the platform brand.
- **Repo/package** — suggest mapping: e.g. product **“X”** → repo `x-dms`, npm `@org/x-dms`, folder still `app/`.

---

## Nepali / bilingual angles (ideas to refine — not final)

Consider names or taglines that evoke **stock (स्टक / माल)**, **bill (बिल / खर्च विवरण)**, **dealer (वितरक / डिलर)**, **shop/warehouse (गोदाम / पसल)**, **account (हिसाब / लेखा)**:

| Concept | Nepali (Devanagari) | Romanized |
|---------|---------------------|-----------|
| Stock / goods | माल, स्टक | maal, stock |
| Bill / invoice | बिल, रसिद | bill, rasid |
| Dealer / distributor | वितरक, डिलर | vitrak, dealer |
| Account / ledger | हिसाब, लेखा | hisab, lekha |
| Warehouse | गोदाम | godam |
| Sell / sales | बिक्री | bikri |
| Buy / purchase | खरिद | kharid |

**Style options:**

- **English primary + Nepali subtitle** — e.g. “StockBill” / *वितरक हिसाब*
- **Nepali-primary brand** — e.g. “HisabDesk”, “Godam”, “Vitrak” (check tone — “Godam” alone may sound informal)
- **Hybrid** — “DealerHisab”, “MaalKhata”, “BikriKhata” (खाता = ledger/account book)

We are **not** requiring Devanagari in the logo yet; optional subtitle on login is enough for v1.

---

## What we want from ChatGPT

Please provide:

1. **12–20 product name candidates** grouped by style: (A) English professional, (B) Nepal-local / bilingual, (C) short modern tech, (D) descriptive (Stock+Bill+Dealer).
2. For **top 5**, give: meaning, pros/cons in Nepal market, suggested **login subtitle** (English + optional Nepali), and **one-line pitch** for distributors.
3. **Repo & package rename plan** — e.g. keep monorepo folder `havmor` vs rename to `dealer-hisab`; npm package name; Netlify site title; env/app id if any.
4. **Git branch naming** for ongoing work — examples: `feature/stock-picker`, `fix/purchase-backdate`, `release/v0.2.0`; and whether to use a **codename** branch prefix matching the new product name.
5. **What NOT to pick** — names too close to Tally, Busy, Marg, Zoho, or generic “DMS” only.

---

## Technical identifiers today (for rename impact)

| Identifier | Current value |
|------------|----------------|
| Git repo | `havmor` |
| npm `package.json` name | `havmor-dms` |
| Login title | `DealerOS` |
| Login subtitle | `Havmor Distributor Panel` |
| PWA manifest | (check `vite.config.ts` — likely “Havmor” or Vite default) |
| Supabase project | Separate; no rename required for product rebrand |

Files to update after a name is chosen: `LoginPage.tsx`, `RegisterPage.tsx`, `index.html`, PWA manifest in `vite.config.ts`, `README.md`, `docs/LLM_CONTEXT.md`, `package.json`, optional `tenant_settings` default product string.

---

## Pilot context (optional — do not use in product name)

First production pilot is a **Havmor ice-cream distributor** in Nepal. The software is intended to become a **reusable platform** for other dealers. Havmor stays a **client/tenant business name** in settings, not the product brand.

---

## Sample prompt closing (you can append)

> Given the brief above, recommend a **default product name** for v1 launch in Nepal, a **runner-up**, and a **safe English-only fallback** for international README. Include branch name examples for our next tasks: stock-as-of-date (deferred), DB oversell block (deferred), and white-label tenant branding.

---

*Generated for naming discussion — 2026-05-23. Update this file when the product name is decided.*
