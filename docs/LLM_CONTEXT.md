# Havmor DMS — context for local AI (Gemma, Codex, Claude, etc.)

**Navigate:** [Docs hub](README.md) · [Gemma 4 system prompt](GEMMA_SYSTEM_PROMPT.md) · [Project README](../README.md) · [Data model](backend/data-model.md) · [E2E tests](backend/phase1-use-cases-and-tests.md) · [Deploy](deployment.md)

**Last updated:** 2026-05-26

**Gemma 4 26B:** paste **[GEMMA_SYSTEM_PROMPT.md](GEMMA_SYSTEM_PROMPT.md)** into System instructions, then attach this file each session.

Use this file as the **full handbook** when working offline. It is a snapshot of the repo — not your chat history. Refresh it after big changes (see [§ Maintenance](#maintenance-update-this-file)).

---

## 1. What this project is

**Havmor DMS** — dealer/distributor web app (Nepal): sales bills, stock, purchases, customer payments, returns, expenses, company reporting.

| Layer | Stack |
|-------|--------|
| UI | React 19, TypeScript, Vite 7, Tailwind 3, React Router 6 |
| State | TanStack React Query (`app/src/store/domainHooks.ts`) |
| Backend | Supabase: Postgres, Auth, RLS, **RPCs** for money/stock |
| Deploy | GitHub → **Netlify** (`netlify.toml`, build from `app/`) |
| E2E | Node scripts + Playwright (`app/scripts/`) |

**Requires env:** `app/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No offline demo without them.

---

## 2. Repository layout

```
havmor/
├── app/                         # npm package: havmor-dms (all app code here)
│   ├── src/
│   │   ├── pages/               # Route screens (sales, bills, products, …)
│   │   ├── components/          # Shared UI (layout, forms, BillPrintView)
│   │   ├── routes/              # AppRouter
│   │   ├── store/domainHooks.ts # React Query → domainLive
│   │   ├── domain/types.ts      # Sale, Product, Customer, …
│   │   └── lib/
│   │       ├── live/domainLive.ts   # Supabase reads/writes (main data layer)
│   │       ├── billDisplay.ts       # Bill labels, discount display rules
│   │       ├── saleLineMath.ts      # Line amounts, effective rate for RPC
│   │       ├── uom.ts               # Pack/PCS pricing, RPC line items
│   │       ├── printBill.ts           # Print via hidden iframe
│   │       ├── billExport.ts          # PDF download / share
│   │       ├── billPdfCapture.ts      # html2canvas → PDF
│   │       └── billPdfDocument.ts     # Vector PDF fallback
│   ├── scripts/                 # e2e-*.mjs, check-tailwind-classes.mjs
│   └── supabase/migrations/     # 0001 … 0011 (ordered SQL)
├── docs/                        # Human + AI documentation
└── netlify.toml
```

**Always run npm commands from `app/`:** `cd app && npm run …`

### All app routes (`app/src/routes/AppRouter.tsx`)

| Route | Page | Purpose |
|-------|------|---------|
| `/login`, `/register` | Login, Register | Auth; register calls `signup_tenant` |
| `/pending-approval`, `/no-tenant` | Pending, NoTenant | Tenant gate |
| `/app/home` | HomePage | Dashboard, KPIs, quick links |
| `/app/home/aging/:bucket` | AgingDetailPage | Receivables aging |
| `/app/home/overdue` | OverduePage | Overdue bills |
| `/app/home/outstanding` | OutstandingBillsPage | Open bills list |
| `/app/home/period/:type` | PeriodListPage | Period sales list |
| `/app/sales/new` | SaleEntryPage | New bill |
| `/app/sales/edit/:billNo` | SaleEntryPage | Edit bill (`update_sales_bill`) |
| `/app/bills/:billNo` | BillDetailPage | View, print, PDF, share |
| `/app/payments/new` | PaymentPage | Customer payment FIFO |
| `/app/returns/new` | ReturnPage | Goods return |
| `/app/purchases/new` | PurchasePage | Stock in |
| `/app/supplier-payments/new` | SupplierPaymentPage | Pay supplier |
| `/app/expenses/new` | ExpensePage | Expense |
| `/app/damages/new` | DamagePage | Stock damage |
| `/app/daily-cash` | DailyCashPage | Daily cash (partial wiring) |
| `/app/schemes/new` | SchemePage | Promotional scheme UI |
| `/app/products`, `…/new`, `…/edit/:id` | Products, ProductFormPage | Product CRUD |
| `/app/customers`, `…/new`, `…/edit/:id`, `/:id` | Customers, forms, detail | Customer CRUD |
| `/app/suppliers`, `…/new` | Suppliers, SupplierFormPage | Suppliers |
| `/app/stock` | StockPage | Stock on hand (`v_stock`) |
| `/app/dashboard` | DashboardPage | Charts |
| `/app/company` | CompanyOverviewPage | Company KPIs |
| `/app/capital`, `/app/capital/new` | Capital list / entry | Capital (live) |
| `/app/more` | MorePage | Nav hub |
| `/app/settings` | SettingsPage | `tenant_settings` |

### Feature → primary files (where to edit)

| Feature | UI | Data / logic |
|---------|-----|----------------|
| Sales bill | `pages/sales/SaleEntryPage.tsx` | `domainLive.commitSaleLive`, `saleLineMath`, `uom` |
| Bill view/print/PDF | `pages/bills/BillDetailPage.tsx`, `BillPrintView.tsx` | `billDisplay`, `printBill`, `billExport`, `billPdfCapture` |
| Payment | `pages/payments/PaymentPage.tsx` | `commitPaymentLive` |
| Return | `pages/returns/ReturnPage.tsx` | `commitReturnLive` |
| Purchase | `pages/purchases/PurchasePage.tsx` | `commitPurchaseLive` |
| Supplier payment | `pages/supplier-payment/SupplierPaymentPage.tsx` | `commitSupplierPaymentLive` |
| Product | `pages/products/ProductFormPage.tsx` | `upsertProductLive` |
| Customer | `pages/customers/CustomerFormPage.tsx` | `upsertCustomerLive` |
| Settings | `pages/settings/SettingsPage.tsx` | `fetchTenantSettingsLive`, settings save |
| Home / outstanding | `pages/home/*` | `fetchSalesLive`, `deriveOutstandingBills` |
| Auth | `pages/LoginPage.tsx`, `lib/auth.tsx` | Supabase Auth |
| Shared hooks | — | `store/domainHooks.ts` |
| Types | — | `domain/types.ts`, `domain/defaults.ts` |

### `domainLive.ts` exports (main entry points)

`fetchProductsLive`, `fetchCustomersLive`, `fetchSalesLive`, `fetchPaymentsLive`, `fetchDomainBundle`, `commitSaleLive`, `commitPaymentLive`, `commitReturnLive`, `commitPurchaseLive`, `commitSupplierPaymentLive`, `upsertProductLive`, `upsertCustomerLive`, `recordExpenseLive`, `recordDamageLive`, `fetchTenantSettingsLive`, `insertCapitalEntryLive`, `peekNextBillNoLive`, …

### E2E scripts (`app/scripts/`)

| Script | Role |
|--------|------|
| `e2e-supabase-smoke.mjs` | Schema smoke |
| `e2e-supabase-live.mjs` | Login + reads |
| `e2e-phase1-matrix.mjs` | Full API matrix |
| `e2e-bill-print.mjs` | Bill math + source checks |
| `e2e-bill-visual.mjs` | Screenshots + PDF (needs dev) |
| `ui-e2e-phase1.mjs` | Playwright UI flows |
| `tenant-seed.mjs` | Demo data |
| `check-tailwind-classes.mjs` | CI lint guard |

### End-to-end workflows (for AI tasks)

| Goal | Steps |
|------|--------|
| **Bug fix** | Reproduce → grep related RPC/page → minimal fix in `domainLive` or page → `deploy:check` + targeted `e2e:*` |
| **UI-only** | Page + components → `lint:tailwind` via `deploy:check` |
| **New DB field** | Migration `00XX_*.sql` → apply on Supabase → `domainLive` + `types.ts` → form → matrix test |
| **Bill change** | `billDisplay` / `BillPrintView` / `index.css` → `e2e:bill` (+ `e2e:bill:visual` if layout) |
| **Deploy** | `deploy:check` → commit → `git push origin main` → Netlify; confirm `VITE_*` on Netlify |

---

## 3. Architecture rules (do not break these)

1. **Money and stock** → Supabase **RPCs** (`create_sales_bill`, `update_sales_bill`, `apply_customer_payment`, `record_purchase`, …). Never “fix” totals only in the UI without matching the RPC payload.
2. **Data layer** → `domainLive.ts` for DB; pages use `domainHooks.ts`. Avoid new raw `supabase.from()` calls in pages unless following an existing pattern.
3. **Forms** → mostly `useState` on pages (not react-hook-form in practice).
4. **Styling** → Tailwind; run `npm run lint:tailwind` — invalid semantic classes fail CI.
5. **Scope** → smallest correct diff; match naming and style of surrounding code.
6. **Secrets** → never commit `.env.local`, service role keys, or `Havmor Management.xlsx`.
7. **Git** → commit only when the user asks; focus commit message on **why**.

---

## 4. Migrations (apply in order)

See `app/supabase/README.txt` for copy-paste steps.

| File | Purpose |
|------|---------|
| 0001–0003 | Core schema, settings, Phase 1 RPCs |
| 0005–0007 | Operations, `update_sales_bill` |
| 0008 | `products.uom_prices` |
| 0009 | `products.uom_conversion` |
| 0010 | `sales_items.unit`, stock in PCS |
| 0011 | `min_qty_pack` on products |

---

## 5. Commands (verification)

| Command | When |
|---------|------|
| `npm run dev` | Local UI http://localhost:5173 |
| `npm run deploy:check` | **Before push** — lint + tsc + build |
| `npm run e2e:smoke` | Schema / RPC smoke |
| `npm run e2e:live` | Login + reads (needs `.e2e-credentials.local`) |
| `npm run e2e:matrix` | Full API math, stock, payments |
| `npm run e2e:bill` | Bill math + source checks (no server) |
| `npm run e2e:bill:visual` | Needs `dev` + Playwright; screenshots + PDF |
| `npm run e2e:ui` | Full UI E2E (needs `dev`) |

**Bill-only change:** `deploy:check` + `e2e:bill` (add `e2e:bill:visual` if layout/print/PDF changed).

---

## 6. Sales bill — business logic

### Line amount (what customer sees on bill)

- **`billLineAmount()`** / **`lineAmountFromMrp()`** in `app/src/lib/saleLineMath.ts`
- MRP path: `round(qty × mrp × (1 − discountPct/100))`
- DB stores **`rate`** so `qty × rate` = line amount → **`effectiveRateForRpc()`**
- Pack/UOM: `app/src/lib/uom.ts` — `linePricingForProduct`, `saleLineToRpcItem`; product has `uom_prices`, `uom_conversion`; line has `unit` (e.g. Box)

### Bill-level vs line-level discount (display)

Logic in **`app/src/lib/billDisplay.ts`**:

| Type | Where it shows |
|------|----------------|
| **Bill-level** (% or flat from sale form) | Totals only: Subtotal → Discount (n%) → VAT → Grand total |
| **Line-level** (product `discount_pct`) | **DISC%** column on lines only |

- **`billShowsFooterDiscount(sale)`** — footer discount row
- **`billShowsLineDiscColumn(lines, sale)`** — hide DISC% column when bill-level discount is set
- **`fetchSalesLive()`** infers percent vs flat from `subtotal` and `discount` when loading old bills

### Totals (UI + server)

```
subtotal = Σ line amounts
afterDiscount = subtotal − bill discount
taxBase = afterDiscount + billTermsAmount
vat = round(taxBase × 13%) if tenant VAT registered (see tenantChargesVat)
grandTotal = taxBase + vat
balance = grandTotal − paidNow
```

### Payment labels on bill

- **`billPaymentModeDisplay`** — Credit / Partial (Cash) / Cash / Paid (not “Cash” on unpaid credit)
- **`billPaymentStatusLabel`** — one “Due {date}”, no duplicate Due badge

---

## 7. Bill UI / print / PDF (important files)

| File | Role |
|------|------|
| `app/src/components/app/BillPrintView.tsx` | Screen + print HTML; `#bill-print-root`, `.bill-print-a4` |
| `app/src/index.css` | `@page`, print, `.bill-pdf-capture`, `.bill-lines-table`, `.bill-totals-rule` |
| `app/src/lib/printBill.ts` | Print in **hidden iframe** (empty title → no bill no. in browser print header) |
| `app/src/lib/billExport.ts` | Download / share PDF |
| `app/src/lib/billPdfCapture.ts` | html2canvas capture (matches colored screen) |
| `app/src/pages/bills/BillDetailPage.tsx` | Print / PDF / Share buttons |
| `app/src/pages/sales/SaleEntryPage.tsx` | Sale form, MRP lines, bill discount |

### Current bill table layout

- Columns: **S.N. | Particulars (centered) | MRP | Unit | Qty | [Disc%] | Amt**
- Line cell padding: `.bill-lines-table .bill-cell-inner` (extra space above bottom border)
- Grand total separator: row **`.bill-totals-rule`** + **`.bill-totals-rule-line`** — rule cell must **not** use Tailwind `p-0` (it kills spacing)
- Print dialog (user): turn **off** “Headers and footers”; turn **on** “Background graphics”
- A4: content ~186mm wide; `@page` margin ~18mm top

### CSS pitfalls (learned)

- `p-0` on totals cells overrides custom padding → VAT line touches separator
- `border: none !important` on all `.bill-totals-table td` hides borders — use dedicated classes for rule row
- Prefer structural spacing (rule row padding) over only `border-top` on grand row

---

## 8. Key RPCs and domainLive entry points

| Action | RPC / function |
|--------|----------------|
| Create bill | `commitSaleLive` → `create_sales_bill` |
| Edit bill | `commitSaleLive` (edit) → `update_sales_bill` |
| Customer payment | `commitPaymentLive` → `apply_customer_payment` |
| Return | `commitReturnLive` → `apply_goods_return` |
| Purchase | `commitPurchaseLive` → `record_purchase` |
| Load sales | `fetchSalesLive` |

Full schema: `docs/backend/data-model.md`

---

## 9. How to use this file with local models

### Setup (once)

1. Clone repo: `/path/to/havmor`
2. **Gemma 4 26B:** copy system text from **[GEMMA_SYSTEM_PROMPT.md](GEMMA_SYSTEM_PROMPT.md)** (the fenced block).
3. Attach **`docs/LLM_CONTEXT.md`** every session (this handbook).
4. Other models (Codex, Claude): use GEMMA prompt + this file, or GEMMA prompt alone for small tasks.

### Every new task (better context)

Give the model **four layers** (small models need less noise):

| Layer | What to paste / attach |
|-------|-------------------------|
| 1. Handbook | This file (`LLM_CONTEXT.md`) or §3–§7 only |
| 2. Task | One clear sentence: “Fix X in bill totals spacing” |
| 3. Scope | Exact files: max 3–5 paths |
| 4. Proof | “Run `cd app && npm run deploy:check && npm run e2e:bill`” |

**Example task prompt:**

```text
Task: Add 2px more space below VAT row before the grand-total line.
Scope: only app/src/index.css and app/src/components/app/BillPrintView.tsx
Rules: docs/LLM_CONTEXT.md §7; do not change discount logic or RPCs.
Verify: npm run deploy:check && npm run e2e:bill
```

### Model-specific tips

| Tool | Tip |
|------|-----|
| **Gemma 4 26B** | Shorter prompts; attach only changed files; use §7 for bill work |
| **Codex / CLI** | Point cwd at `app/`; pass file paths explicitly |
| **Claude (local)** | Paste `git diff` after your edits when updating this doc |

### What NOT to attach

- Whole `node_modules/`, `dist/`, `.env.local`
- Entire `data-model.md` unless doing schema work (link instead)
- Long chat logs — summarize in 3 bullets

---

## 10. Maintenance — update this file

### When to update

Update after **big** changes:

- New migration
- Bill/print/PDF behavior change
- New npm script or deploy step
- New rule (“always do X / never Y”)

Skip updates for typos or one-line fixes.

### Option A — Ask Gemma / local LLM to update

Paste this **maintenance prompt** (fill in brackets):

```text
Maintain docs/LLM_CONTEXT.md for Havmor DMS.

1. Read the current docs/LLM_CONTEXT.md.
2. Read these changed files (or git diff):
   [LIST PATHS, e.g. app/src/components/app/BillPrintView.tsx]
3. Update ONLY outdated sections. Keep structure (§1–§11).
4. Add one bullet under "## Changelog" with date YYYY-MM-DD and a short summary.
5. Do NOT invent features. If unsure, write "verify in code".
6. Output the full updated markdown file.

Hard rules: RPCs for money/stock; billDisplay.ts for discount display;
tests before release: deploy:check, e2e:bill for bill changes.
```

**You must review** the output before committing — local models can hallucinate.

### Option B — Quick manual changelog

Add one line under **Changelog** yourself:

```markdown
- 2026-05-21 — Bill print iframe, footer discount rules, totals spacing.
```

### Option C — Cursor / cloud agent

> “Update docs/LLM_CONTEXT.md to match the last commit; add changelog entry.”

---

## 11. Deeper docs (read when needed)

| Doc | Use for |
|-----|---------|
| [README.md](../README.md) | Onboarding, features |
| [backend/data-model.md](backend/data-model.md) | Tables, RPC formulas |
| [backend/phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md) | E2E matrix |
| [deployment.md](deployment.md) | Netlify, env vars |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Planned work |
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) | **Pain-first roadmap** — what to build for clients now (not feature count) |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Phase 2-E export design (**deferred** — reporting / migration / backup) |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Product name & rebrand (**deferred** — ChatGPT brief) |

### What to build next (read first)

Use **[PHASE_ROADMAP.md](PHASE_ROADMAP.md)** for launch scope (Phase 0–3). **Next implementation target: Phase 0** — app shell (side menu, tabs, Support section, header Settings + notifications), tabbed Settings, export P0, rebrand, opening stock UI, INV-1.

Use **[PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md)** before adding Phase 2+ features. Priority: export for accountant, categories/rebrand for 2nd tenant, paginate sales load — not van stock / Tally / barcode until a client asks. Schemes: save + auto-apply on sales (`schemeApply.ts`); test with `npm run seed:schemes`.

### Deferred backlog (address later)

**Deferred register** — [DEFERRED_WORK.md](DEFERRED_WORK.md): **INV-1** (DB oversell), **INV-2** (stock vs bill date), **SUP-1**, **EXP-1**, **BRAND-1**, optional **MIG-0012**. Effort estimates, touchpoints, acceptance criteria. Summaries also in [backend/BACKEND-TODO.md § Deferred](backend/BACKEND-TODO.md). **Not** scheme-deploy blockers.

**Data export (Phase 2-E)** — spec only, not built: [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) · checklist [BACKEND-TODO § 2-E](backend/BACKEND-TODO.md). Reporting CSV, migration ZIP, backup; `papaparse` unused. Do not implement until prioritized.

**Product name & branding** — [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) · [BACKEND-TODO § Deferred — branding](backend/BACKEND-TODO.md). Replace DealerOS / Havmor panel subtitle with generic Nepal distributor brand; Havmor remains pilot **tenant** name in settings only.

---

## Changelog (newest first)

- **2026-05-26** — `PHASE_ROADMAP.md` §4.1: Phase **1.0** (SF-0 salesman-on-invoice or ORD+full convert) vs **1.1** (partial, login, PO); van/visit → Phase 3.
- **2026-05-26** — `PHASE_ROADMAP.md` §4.1: Phase 1 Tier D — Sigma-style orders, salesman, IRD sales/purchase reports.
- **2026-05-26** — `PHASE_ROADMAP.md`: **Tier A/B/C** for Phase 0 (must / should / nice); **Tier D** → Phase 1–3 map (§7).
- **2026-05-26** — `PHASE_ROADMAP.md`: manual stock adjustment + Settings toggle moved to **Phase 0** (STK-0d–0f, ~3–7 days); orders stay Phase 1.
- **2026-05-26** — Added `docs/PHASE_ROADMAP.md`: Phase 0–3 launch plan; Phase 0 includes professional UI (side menu Masters/Entry/Reports/Support, sticky tabs Home/Customers/Inventory/Reports, header Settings + notifications QA, tabbed Settings). Linked from README, GTM, PRODUCT_EVOLUTION, BACKEND-TODO.
- **2026-05-26** — Product markup %: empty field stays empty (Settings default only in hint); explicit `0` shows `0`; refresh button applies Settings default.
- **2026-05-26** — Decimal inputs: `numericMoneyProps` / `numericPercentProps` / `numericQtyProps` on prices, %, and qty fields; integers kept for days, min-stock, scheme counts, pieces-per-pack.
- **2026-05-26** — Markup % accepts decimals (e.g. 4.5) on Product form + Settings; migration `0018_default_markup_decimal.sql`.
- **2026-05-26** — NPR amounts: decimal input (paisa) on prices/payments via `NumericInput` + `numericMoneyProps`; `npr`/`nprNum` show up to 2 dp; `roundMoney` in tax/sale/purchase math (`money.ts`).
- **2026-05-26** — Bill letterhead: `sellerContactLine` dedupes repeated place names (e.g. Nepal in address + province + country); Settings hints on address fields.
- **2026-05-26** — `GTM_NEPAL.md` §5: Nepal VAT/IRD bill field audit, compliance levels A/B, product compliance pack (export P0, Tax Invoice title P1).
- **2026-05-26** — GTM + PRODUCT_EVOLUTION: stock model (purchase-driven IN vs adjustment later), Nepal E-Billing complement; see `docs/GTM_NEPAL.md`.
- **2026-05-26** — Added `docs/GTM_NEPAL.md`: Nepal ICP, SaaS pricing draft, positioning, USP/AI, must-haves, open questions for strategy.
- **2026-05-20** — Purchases/products VAT UX: buy excl. on product + purchase lines; optional sell; invoice text-only; `PurchaseBillView` compact header + supplier VAT; `default_vat_pct` in Settings. See `docs/PURCHASE_REFERENCE_NUMBERS.md`.
- **2026-05-20** — `DEFERRED_WORK.md`: maintainable backlog register (INV-1/INV-2 effort, touchpoints, acceptance); docs hub + BACKEND-TODO link.
- **2026-05-23** — `PRODUCT_EVOLUTION.md`: client pain-first roadmap; BACKEND-TODO § Now links pains to work.
- **2026-05-23** — Product naming & branding added to deferred backlog (`PRODUCT_NAMING_BRIEF.md`, BACKEND-TODO).
- **2026-05-23** — Phase 2-E data export documented as **deferred** (`DATA_EXPORT_SPEC.md`, BACKEND-TODO, README, data-model); implement later.
- **2026-05-23** — Added `DATA_EXPORT_SPEC.md` + BACKEND-TODO Phase 2-E (reporting CSV, full-tenant ZIP backup, migration columns).
- **2026-05-23** — `e2e:stock` / `e2e:stock:live` / `e2e:stock-bill`: purchase & sale past/today dates, `v_stock`, picker unit + live tests.
- **2026-05-21** — Deferred backlog: DB oversell block + bill-date stock picker (see BACKEND-TODO § Deferred).
- **2026-05-21** — Sale product picker: in-stock / low-stock / out-of-stock rows (`stockAlert.ts`, `EntityPicker`); out-of-stock not selectable; purchase saves chosen invoice date.
- **2026-05-21** — Added `GEMMA_SYSTEM_PROMPT.md`; expanded LLM_CONTEXT with routes, feature→file map, domainLive index, E2E scripts, end-to-end workflows.
- **2026-05-21** — Bill print/PDF: Karobar-style layout, `billDisplay` discount rules, iframe print, Unit before Qty, line padding, totals rule spacing, `e2e:bill` + `e2e:bill:visual` (commit `580028a`).
- **2026-05-21** — Initial `LLM_CONTEXT.md` + push `b0e6818`.

---

*End of LLM_CONTEXT.md — keep this file under ~500 lines; link out for schema details.*
