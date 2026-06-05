# BikriKhata — context for local AI (Gemma, Codex, Claude, etc.)

**Navigate:** [Docs hub](README.md) · **[FIRST_LAUNCH](FIRST_LAUNCH.md)** · **[BACKLOG](BACKLOG.md)** · [Project README](../README.md) · [Data model](backend/data-model.md) · [E2E tests](backend/phase1-use-cases-and-tests.md) · [Deploy](deployment.md)

**Last updated:** 2026-05-26 (Phase 0 **A + B + C** complete — prod sign-off; launch docs consolidated)

**Gemma 4 26B:** paste **[archive/GEMMA_SYSTEM_PROMPT.md](archive/GEMMA_SYSTEM_PROMPT.md)** into System instructions, then attach this file each session.

Use this file as the **full handbook** when working offline. It is a snapshot of the repo — not your chat history. Refresh it after big changes (see [§ Maintenance](#maintenance-update-this-file)).

---

## 1. What this project is

**BikriKhata** ([bikrikhata.com](https://bikrikhata.com)) — dealer/distributor web app (Nepal): sales bills, stock, purchases, customer payments, returns, expenses, company reporting.

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
bikrikhata/                      # repo root (local clone path may differ)
├── app/                         # npm package: bikrikhata (all app code here)
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
| `/` | Landing (via `PublicHomeGate`) | Marketing for all; signed-in with **valid license** → `/app/home`; expired/pending can browse site |
| `/privacy`, `/terms`, `/faq` | Privacy, Terms, FAQ | P0 public (`pages/marketing/`) |
| `/login`, `/register` | Login, Register | Auth; register calls `signup_tenant` + links to legal |
| `/pending-approval`, `/no-tenant` | Pending, NoTenant | Tenant gate |
| `/app/home` | HomePage | Dashboard, KPIs, quick links |
| `/app/home/aging/:bucket` | AgingDetailPage | Receivables aging |
| `/app/home/overdue` | OverduePage | Overdue bills |
| `/app/home/outstanding` | OutstandingBillsPage | Open bills list |
| `/app/home/period/:type` | PeriodListPage | Period sales list |
| `/app/sales/new` | SaleEntryPage | Sales invoice (new) |
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
2. **Dealer data accuracy** → One workspace per login. All domain reads in `domainLive.ts` must filter `.eq("tenant_id", …)` from `getTenantIdForCurrentUser()` (bundle key `["domain", "v2"]`). Never remove tenant filters for `super_admin`. License SQL only updates `tenants` — not customers/products/stock. Full guardrail: `.cursor/rules/tenant-data-integrity.mdc` · troubleshooting: [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md).
3. **Data layer** → `domainLive.ts` for DB; pages use `domainHooks.ts`. Avoid new raw `supabase.from()` calls in pages unless following an existing pattern.
4. **Forms** → mostly `useState` on pages (not react-hook-form in practice).
5. **Styling** → Tailwind; run `npm run lint:tailwind` — invalid semantic classes fail CI.
6. **Scope** → smallest correct diff; match naming and style of surrounding code.
7. **Secrets** → never commit `.env.local`, service role keys, or client Excel workbooks with real business data.
8. **Git** → commit only when the user asks; focus commit message on **why**.

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

1. Clone repo: `/path/to/bikrikhata` (or your local folder name)
2. **Gemma 4 26B:** copy system text from **[archive/GEMMA_SYSTEM_PROMPT.md](archive/GEMMA_SYSTEM_PROMPT.md)** (the fenced block).
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
Maintain docs/LLM_CONTEXT.md for BikriKhata.

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
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | BikriKhata branding (**shipped**) |
| [AI_AGENT.md](AI_AGENT.md) | **Agents: read order** (FIRST_LAUNCH → BACKLOG → this file) |
| [FIRST_LAUNCH.md](FIRST_LAUNCH.md) | Launch P0/P1/P2 checklist |
| [BACKLOG.md](BACKLOG.md) | Deferred feature IDs |
| [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md) | Phase 0 complete (one page) |

### What to build next (read first)

**[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** — P0 before ads. **Phase 0 complete (2026-05-26).**

**[PHASE_ROADMAP.md](PHASE_ROADMAP.md)** — strategy Phase 1–3. **[PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md)** — pain-first why.

### Deferred backlog (address later)

**[BACKLOG.md](BACKLOG.md)** — **INV-2**, **SUP-1**, **IMP-0/1/2**, UI-1, ORD-*, etc. Historical tier checklists: `docs/archive/YOUR_TURN_*.md` only.

**Data export** — Tier A shipped (`lib/export/*`, Settings → Export); **IMP-0** = full tenant ZIP (Phase 2): [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md).

**Product branding** — **BikriKhata** in `app/src/config/productBrand.ts` ([bikrikhata.com](https://bikrikhata.com)). Shop legal name on bills = **Settings** (`tenant_settings`), not product brand.

---

## Changelog (newest first)

- **2026-05-26** — Contact form success: **Send on WhatsApp** with pre-filled inquiry (`inquiryWhatsappPrefill`); renewal-specific thank-you copy; gate pages show WhatsApp number.
- **2026-05-26** — L8 contact email: migration `0033` + `npm run setup:contact-email` (optional inbox alert alongside form + WhatsApp button).
- **2026-05-26** — Landing: 6 feature cards (added **Reports and analytics**); `PLAN_INCLUDES` adds salesman + dashboard/analytics line.
- **2026-05-26** — Landing Features footer: **See pricing** link only (NPR amount stays on `#pricing` block).
- **2026-05-26** — Landing copy pass: B2B once in hero; removed Who/Roadmap band and How-it-works trial box; phone-first wording (`productBrand`, `marketingAudience`, FAQ).
- **2026-05-26** — Landing restructure: outcome pillars (`ProductModuleGrid`), generic B2B/units/audit copy; `PLAN_INCLUDES` + `launchPricing.ts` value prop; removed `KeyFeaturesSection` from page.
- **2026-05-26** — Marketing layout: tighter section spacing, centered FAQ/contact columns, `scroll-padding-top` + hash scroll fix for nav jumps.
- **2026-05-26** — Landing pain cards: full-sentence copy, **customers** not dealers/pasal; section eyebrow “Why teams switch”.
- **2026-05-26** — Auth copy unified: **Log in** / **Log out** everywhere (login, register, marketing, license gate, settings); FAQ updated.
- **2026-05-26** — Marketing + license footer: `MarketingSessionControl` shows **Log out** when session exists; `/login` shows “Already signed in” + log out.
- **2026-05-26** — `PublicHomeGate`: expired/pending logins can browse `/`, `/privacy`, `/faq` without `?landing=1`; app routes still blocked at `/license-expired`.
- **2026-05-26** — Tenant data integrity guardrail: `.cursor/rules/tenant-data-integrity.mdc`, TENANT_ACTIVATION §, `e2e:p0` checks `domainLive` tenant_id filters — do not change dealer data scope without explicit need.
- **2026-05-26** — Launch price configurable in `app/src/config/launchPricing.ts` (`LAUNCH_PRICE_NPR_PER_YEAR`, currently **2999**); marketing, FAQ, legal, license gate use same helpers.
- **2026-05-26** — `/license-expired` and `/pending-approval`: compact sign-in-style gate (one screen), professional copy, WhatsApp + Call/Email/Contact row.
- **2026-05-26** — `/contact` route for signed-in renew/trial; `/?landing=1` shows marketing when logged in.
- **2026-05-26** — Domain reads scoped by `tenant_id` in app (fixes `super_admin` seeing merged E2E + Freshment Zone lists); `DOMAIN_QUERY_KEY` v2.
- **2026-05-26** — TENANT_ACTIVATION: “demo / test names” troubleshooting (tenant_id vs login, seed/e2e data, reset-data).
- **2026-05-26** — Fix empty Home lists when data exists in DB: `tenant_settings` fetch scoped by tenant (fixes `super_admin` breaking domain bundle); shared `tenantUser.ts`; customer select fallback without 0026 columns; Home shows load error + retry.
- **2026-05-26** — In-app subscription: Settings **Subscription** card (plan, end date, days left); banner for trial (always) and paid (≤30 days); bell notification + once-per-day popup when ≤30 days (`LICENSE_RENEWAL_WARN_DAYS`).
- **2026-05-26** — `/license-expired`: trial vs subscription message; Call/WhatsApp/email/contact (`PlatformSupportGateActions`); trial banner urgent links ≤3 days.
- **2026-05-26** — [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md): copy-paste SQL blocks (pending list, approve, monthly/annual, extend).
- **2026-05-26** — `0032_license_ops_sql_editor.sql`: `can_manage_tenant_license()` — `approve_tenant` works in Dashboard SQL (postgres); app still needs `super_admin`.
- **2026-05-26** — `0031_tenant_license_days.sql`: `approve_tenant(id, days)`, `set_tenant_subscription(id, plan, days)`, `extend_tenant_license(id, extra_days)`.
- **2026-05-26** — LIC-1: `0030_tenant_license.sql`, self-signup on (`PUBLIC_SIGNUP_ENABLED`), trial starts on `approve_tenant` (7 days), `/pending-approval` + `/license-expired`, `set_tenant_subscription`; docs `TENANT_ACTIVATION.md`.
- **2026-05-26** — Terms, Privacy, FAQ aligned to pilot onboarding (contact form, 7-day trial, annual price from `launchPricing.ts`); FAQ adds self-signup Q.
- **2026-05-26** — Marketing mobile pass: hero uses `mobile-dashboard.png` below `md`, responsive tokens/safe-area, shorter trial CTA on small screens, `HeroMarketingScreenshot`.
- **2026-05-26** — Landing: no figcaption under hero dashboard; `#why` pain cards are linked tiles (icons, hover, “See features” → `#product`).
- **2026-05-26** — Pricing `PLAN_INCLUDES` checklist reviewed against shipped app (sales/purchase edit, schemes, stock adjustment, exports); clearer professional wording.
- **2026-05-26** — Marketing hero: no logo lockup (nav only); dashboard frame URL `bikrikhata.com/app/dashboard`; capture targets `/app/dashboard`.
- **2026-05-26** — `desktop-dashboard.png` capture: menu open (all nav features), period sales seeded above purchases, Shree Bajrang Traders branding; 1440×900 viewport.
- **2026-05-26** — Marketing hero layout: headline + CTAs, full-width `desktop-dashboard.png`, pain cards in `#why`; `DesktopScreenshotFrame`.
- **2026-05-26** — Marketing hero screenshot: `mobile-dashboard.png` (Business Dashboard); capture script seeds today/period sales + `Shree Bajrang Traders` branding; bill PNG stays on key-features row 1.
- **2026-05-26** — `PublicSignupCta` merges `marketingBtnPrimary` with custom classes (hero trial was unstyled text); nav menu: Book a demo + Log in only (no Free trial / Request access header button).
- **2026-05-26** — Trial CTA consolidated: full headline button on hero + pricing only; footer “Free trial” → `/?intent=trial#contact`; `TrialContactLink` for inline links.
- **2026-05-26** — Contact trial purpose `Start Your FREE 1-Week Trial Today` (`LAUNCH_TRIAL_CTA_HEADLINE`, `/?intent=trial#contact`).
- **2026-05-26** — Self-service `/register` enabled; pending until `approve_tenant`; marketing may still use contact CTAs.
- **2026-05-26** — Marketing landing: SaaS-style nav (Product · Pricing · FAQ), `PLAN_INCLUDES` + module grid, mobile phone frames (`mobile-*.svg` with screen labels).
- **2026-05-26** — Marketing copy: `MARKETING_NEPAL_ICP` (distributors, dealers & stockists); hero VAT+bill discount bill; 2 screens (stock, purchase); mobile-first callout; removed credit showcase.
- **2026-05-26** — Landing Phase 0: MeroDokan-style 3 key features + 4-step how-it-work; 1-week trial copy (`LAUNCH_TRIAL_DAYS`); dropped duplicate screen/distributor sections. Trial enforcement: BACKLOG LIC-1.
- **2026-05-26** — Hero pain cards: natural Nepali problem titles + English answers (not literal translation).
- **2026-05-26** — Hero bill caption + capture: bill detail with Share/Print/PDF (`HERO_BILL_CAPTION`).
- **2026-05-26** — Screenshot row plan: billing / stock / purchase / customers+credit + one-line captions (`MARKETING_SCREENSHOTS_PLAN.md`).
- **2026-05-26** — Landing Features: workflow steps 1–4, outcome headlines, bullet proof points, links to #screens / #how-it-works.
- **2026-05-26** — Marketing landing: removed “route” jargon; credit copy says customer credit & aging.
- **2026-05-26** — Hero pain #3: PAN/VAT tax invoices + schemes, returns & damage.
- **2026-05-26** — Landing hero back to English (`productBrand.ts` taglines); removed `marketingHero.ts`.
- **2026-05-26** — Marketing screenshots: tax invoice print + return/damage (not empty sales-new); labels Tax invoice / Return & damage.
- **2026-05-26** — Landing: hero Nepali only; pain #3 schemes/pack; screenshot section titles in English (`ESSENTIAL_SCREENS_SECTION`).
- **2026-05-26** — Landing hero Nepali (`marketingHero.ts`); 4 app screenshots (sale, stock, purchase, credit); pain card VAT not CA; short labels only.
- **2026-05-26** — Marketing landing: 3 mobile screens only (`EssentialAppScreens`), `DistributorOfferSection`, hero bill `object-contain`; capture script applies demo shop branding; removed desktop/export showcase blocks.
- **2026-05-26** — Marketing: real app screenshots (`public/marketing/*.png`, `npm run capture:marketing`); landing uses PNG not wireframe SVGs.
- **2026-05-26** — Export: `customer_outstanding.csv` in backup ZIP; landing/FAQ copy aligned to Settings → Export (CSV + ZIP, not IRD filing).
- **2026-05-26** — Landing pricing: restored `PlanIncludesList` two-column checklist (always visible, no dropdown).
- **2026-05-26** — Landing features: 4 outcome pillars (`FEATURE_PILLARS` + `highlights` for pricing).
- **2026-05-26** — Landing hash links: `useMarketingHashScroll` + nav `navigate` for `#contact` / `#pricing` (React Router did not scroll on `/?intent=demo#contact`).
- **2026-05-26** — Contact email **deferred**: L8 `deferred` in FIRST_LAUNCH; copy-paste checklist in BACKLOG § L8; banner on `CONTACT_FORM_EMAIL_SETUP.md`.
- **2026-05-26** — Contact email handoff: `CONTACT_FORM_EMAIL_SETUP.md` “What you need to do” checklist; FIRST_LAUNCH **L8**; `notify-platform-inquiry` GET health + bare-record webhook payload; `.gitignore` `functions/.env`.
- **2026-05-31** — Contact email: `notify-platform-inquiry` Edge Function, `supabase/config.toml`, `npm run deploy:contact-email`; setup `docs/CONTACT_FORM_EMAIL_SETUP.md` (Supabase Auth email ≠ contact alerts).
- **2026-05-31** — `NumericInput`: live onChange for linked pricing; plain digits while focused; comma-safe parse (product form buy/markup/sell).
- **2026-05-31** — Contact form fix doc: `RUN_ONCE_contact_form.sql` + `npm run test:contact-form` (table missing on Supabase until SQL run).
- **2026-05-31** — FAQ UI (support-center layout, plus accordions, bullet answers) on landing + `/faq`; nav links `/#sections` and `/faq`.
- **2026-05-31** — Landing: How it works, pain hero, distributor FAQ/examples, Book a demo (`?intent=demo`), pricing only in `#pricing`, contact RPC+`0029`; docs `MARKETING_HERO_IMAGE_BRIEF.md`, `CONTACT_FORM_LEADS.md`.
- **2026-05-31** — Marketing nav uses full `logo-lockup.png` (no cropped mark); `icon-mark.png` only for favicon/PWA.
- **2026-05-31** — Marketing site UI pass: responsive layout tokens (`marketingUi.ts`), nav blur + mobile menu, section/pricing/FAQ/footer polish, clean mobile SVG previews.
- **2026-05-31** — Marketing logos: `logo-lockup.png` (hero/login, 1254px), `icon-mark.png` (nav crop); larger hero sizing.
- **2026-05-31** — Landing **Contact** section shows phone, WhatsApp, and email (`ContactSupportChannels` from `PLATFORM_SUPPORT`).
- **2026-05-31** — Marketing copy pass: crisp customer-facing text; no launch/phase/partial jargon (see `.cursor/rules/marketing-copy.mdc`).
- **2026-05-31** — Contact form uses direct `platform_inquiries` insert (**0028** policy); larger hero logo; run **0027+0028** on Supabase if form fails.
- **2026-05-31** — Copy: replaced user-facing **udhar** with **credit** (marketing + docs).
- **2026-05-31** — Landing **Contact** form (`/#contact`) → `submit_platform_inquiry` RPC + `platform_inquiries` (**0027**). Nav icon crop; pricing “your whole team”.
- **2026-05-31** — Brand icon: `bikrikhata-icon.png` → `app/public/icons/icon.png` (+ `icon-192.png` PWA); `BRAND_LOGO_SRC` updated.
- **2026-05-26** — Landing **FAQ** (`/#faq`, `landingFaq.ts`) — lead Q: *Built for Nepal wholesalers only?*; hero screenshot still optional in `public/marketing/`.
- **2026-05-26** — **P0 marketing SPA:** public routes `/`, `/privacy`, `/terms` (`LandingPage`, legal copy, NPR 3k/year on `#pricing`); unknown paths → `/`; `e2e:p0-public` in `e2e:phase0`; [P0_LAUNCH_RUNBOOK.md](P0_LAUNCH_RUNBOOK.md).
- **2026-05-26** — Backlog **HSN-1** (P1): optional **HSN Code** on product create/edit; enabled via Settings toggle — [BACKLOG.md](BACKLOG.md), [FIRST_LAUNCH.md](FIRST_LAUNCH.md).
- **2026-05-26** — GTM pricing: **NPR 3,000/year** per company (one package) for first launch — [GTM_NEPAL.md](GTM_NEPAL.md) §9, [FIRST_LAUNCH.md](FIRST_LAUNCH.md).
- **2026-05-26** — Docs simplified: **[AI_AGENT.md](AI_AGENT.md)** read order; moved YOUR_TURN tier sign-offs + PHASE1 stub + delegation/brand/gemma to **`docs/archive/`** (archive first, delete later); hub = FIRST_LAUNCH + BACKLOG + PHASE0_SIGNOFF.
- **2026-05-26** — Docs: **[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** + **[BACKLOG.md](BACKLOG.md)** + **[DELETE_POLICY.md](DELETE_POLICY.md)**; archived delegation/brand/gemma prompts under `docs/archive/`.
- **2026-05-26** — **Phase 0 Tier C signed off** — prod migrations **0025–0026**, manual QA §3.0c, deploy; **Phase 0 (A+B+C) complete** — [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md).
- **2026-05-26** — **Phase 0 Tier B signed off** (0024 dev+prod, QA, `e2e:stock:live`, production deploy) — [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md).
- **2026-05-26** — Home: shop name only in AppShell header; date `fmtDateDual` (AD + BS in parentheses); outstanding card without name pills; `ListBrowsePanel` 2-row filters (Status|Area, Sort full width); shorter filter labels.
- **2026-05-26** — Print title **SALES INVOICE** when tenant has PAN (non-VAT); **TAX INVOICE** unchanged for VAT shops (`billDocumentTitle`).
- **2026-05-26** — **Phase 0 Tier B:** `PageBackLink` (UI-0.9); Settings VAT validation (VAT-0b); credit-limit warning on sale (CRED-0 warn-only); notification due-soon boundary fix; migration **0024** oversell guard + `e2e:stock` live oversell test. Apply **0024** in Supabase before live stock e2e.
- **2026-05-26** — Docs: **Tier A complete / Tier B next** in PHASE_ROADMAP, BACKEND-TODO, PRODUCT_EVOLUTION, DEFERRED_WORK (EXP-1, BRAND-1 done).
- **2026-05-26** — **Phase 0 Tier A signed off** (migrations 0019–0023, export e2e, manual QA) — [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md).
- **2026-05-26** — **Copy pass:** Removed dev/Supabase/migration wording from user-facing screens; shortened Help, Settings, Reports, Export, and form hints.
- **2026-05-26** — **Support UX:** Help via menu only (`/app/support`, `PLATFORM_SUPPORT`); removed Settings Support tab.
- **2026-05-26** — Manual E2E master checklist: Phase 0 §3.0a–c (Tier A/B/C), maintenance policy, sign-off table; links from YOUR_TURN tier docs.
- **2026-05-26** — Policy: Phase 0 / UI changes must update matching `e2e-tier-*.mjs` + manual checklist (docs-on-change + phase1-use-cases § Keeping tests in sync).
- **2026-05-26** — E2E Phase 0: `e2e:tier-a|b|c`, `e2e:phase0` (+ `:live`) for Tier A/B/C gates.
- **2026-05-26** — Bill detail: Share/Print/PDF/Return **secondary**; **Collect** only **primary** green when balance due.
- **2026-05-26** — **UI-1 (Phase 1):** `patterns.tsx` (`ListPageHeader`, `FormPageHeader`, `SegmentedTabs`, `InfoCallout`, …); migrated Home/Products/Suppliers/Support/Customer form/Sale entry; todo in [BACKLOG.md](BACKLOG.md).
- **2026-05-26** — UI consistency plan [UI_CONSISTENCY_PLAN.md](UI_CONSISTENCY_PLAN.md); `PageActionBar` + bill detail uses shared `Button` variants.
- **2026-05-26** — Bill detail: primary action **Share** (system share sheet + PDF; not WhatsApp-only label).
- **2026-05-26** — **Phase 0 Tier C:** App shell — bottom tabs Home · Customers · Inventory · Reports + centre **+**; **☰** drawer (`appNavigation.ts`, `AppNavDrawer.tsx`); Reports hub; `/app/support`; migrations **0026** (customer PAN/VAT); slim Home; bill **Share**; [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md); backlog [BACKLOG.md](BACKLOG.md).
- **2026-05-26** — App header: removed unused **Online** status pill (`AppShell.tsx`).
- **2026-05-26** — **Docs/README/npm** safe rebrand sweep: BikriKhata, package `bikrikhata`; removed legacy product names from docs (domain [bikrikhata.com](https://bikrikhata.com) deploy steps in `deployment.md` — Auth URLs not changed in repo).
- **2026-05-26** — Login/register `AuthBrandHeader`: logo, BikriKhata, tagline “Manage Stock, Sales, Credit & Customers…”, distributor description in `productBrand.ts`.
- **2026-05-26** — Interim product name **BikriKhata** in `app/src/config/productBrand.ts` (full rebrand review post–Phase 0). [BRAND_NAME_OPTIONS.md](BRAND_NAME_OPTIONS.md).
- **2026-05-26** — Product branding single source: `app/src/config/productBrand.ts` + Vite inject (`index.html`, PWA); name options in [BRAND_NAME_OPTIONS.md](BRAND_NAME_OPTIONS.md) (confirm before rename).
- **2026-05-26** — **IMP-0/1/2** (Phase 2): full backup ZIP, per-entity CSV import, restore/runbook — [DEFERRED_WORK.md](DEFERRED_WORK.md), [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md). Tier A export partial today.
- **2026-05-26** — **CAT-1** (Phase 1) parent/child categories + **CAT-2** (Phase 2) tree UI deferred — [DEFERRED_WORK.md](DEFERRED_WORK.md), [PHASE_ROADMAP.md](PHASE_ROADMAP.md) §4–5.
- **2026-05-26** — **Short bill address:** printed bills use Settings **Address on printed bills (line 1)** (+ optional line 2); district/province only if toggle on (`show_district_province_on_bill`, migration **0023**). [IRD_BILL_LETTERHEAD.md](IRD_BILL_LETTERHEAD.md).
- **2026-05-26** — Bill letterhead per **IRD Schedule 5**: VAT/PAN + **Ph** right; print **TAX INVOICE** when VAT registered; app **Sales invoice** / **Purchase invoice** labels unchanged.
- **2026-05-26** — **Fix:** Product list “% markup” now matches form (buy excl. vs sell excl.; was ~2% when form showed 15% because list used VAT-inclusive cost).
- **2026-05-26** — Categories: dropdown + **Add category** bottom sheet on product form; **Settings → Business → Product categories** to list/remove. Minimal copy (no long hints).
- **2026-05-26** — Settings **Rows per page** (10/20/50/100, migration `0022`); **Export all (N)** exports every filtered row, not only the current page.
- **2026-05-26** — Sale entry sticky bar: **Save invoice** / **Update invoice** with save icon; StickyBar supports `actionIcon` + `actionCompactLabel`.
- **2026-05-26** — Suppliers: **Edit supplier** (`/app/suppliers/edit/:id`); StickyBar no longer truncates to vague single words (e.g. “bill”).
- **2026-05-26** — Detail screens: `DetailActions` stacked CTAs; labels **Sales invoice** / **Purchase invoice** (not “New bill”); customer detail actions below KPIs.
- **2026-05-26** — **Fix:** Bill detail showed totals but no line items — `useSaleByBill` no longer uses PERF-0 header (`lines: []`) as cached `initialData`; always fetches `sales_items` via `fetchSaleByBillNoLive`.
- **2026-05-26** — List **Export CSV** exports all rows matching current filters (not just page); customer detail **Edit** button; Stock page: compact low-stock banner (no name wall), browse panel aligned with Products.
- **2026-05-26** — Browse panel: **Status + Area/Category + Sort** (row 1: two filters, row 2: sort); customers filter by **area**; stock/products split **category** from status filter.
- **2026-05-26** — List UX: **10 rows/page** with Previous/Next (`LIST_PAGE_SIZE`, `ListPagination`); browse panels use **Filter/Sort dropdowns** (not chip sliders); pagination on Home, Products, Customers, Stock, Suppliers, period/overdue/aging lists, capital, supplier invoices, customer detail bills/payments.
- **2026-05-26** — `ListBrowsePanel`: search + filter + sort in one card (Home Customers/Stock, Products); stock alerts folded into filter chips (Low stock / On scheme).
- **2026-05-26** — Home/Products sort: pill `FilterSortBar` (not full-width select); customer copy **Credit** / **On credit**; opening qty only editable on **new** product (read-only summary on edit); PWA tagline “credit”.
- **2026-05-26** — Home + Products lists: pagination (20/page), sort dropdowns, category chips with counts that respect search; empty-state explains active filters; sell price shows incl. VAT hint like buy price (`listFilters.ts`).
- **2026-05-26** — `0020_stock_adjustments.sql`: `drop view v_stock` before recreate (fixes Postgres 42P16 when adding `adjusted` column).
- **2026-05-26** — **Phase 0 Tier A shipped in app:** `lib/export/*` + Settings **Export** tab + backup ZIP; migrations **0019** (product categories), **0020** (stock_adjustments + `v_stock.adjusted`), **0021** (allow_stock_adjustment); opening qty on products; Stock columns; stock adjustment page; **PERF-0** sales headers in bundle + `fetchSaleByBillNoLive`; rebrand **BikriKhata** (`productBrand.ts`); Tax Invoice title when VAT registered; Sales/Purchase invoice labels; Settings icon in header; tabbed Settings; `npm run e2e:export`. See `docs/PHASE0_TIER_A_RESEARCH.md`, `DATA_EXPORT_SPEC.md`.
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
