# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Start

**BikriKhata** — dealer/distributor management for Nepal (sales bills, stock, purchases, customer payments, returns, expenses, company KPIs).

**Working directory:** Always `cd app` before npm commands.

**Key files:**
- `docs/LLM_CONTEXT.md` — Full handbook (read first for context)
- `docs/README.md` — Documentation hub
- `docs/FIRST_LAUNCH.md` — Launch checklist
- `docs/BACKLOG.md` — Deferred features

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **UI** | React 19, TypeScript, Vite 7, Tailwind 3, React Router 6 |
| **State** | TanStack React Query |
| **Backend** | Supabase: Postgres, Auth, RLS, security-definer RPCs |
| **Deploy** | Netlify (builds from `app/`) |
| **E2E** | Node scripts + Playwright |

---

## Hard Rules (Never Break)

1. **Money & stock** → Only via Supabase **RPCs** (`create_sales_bill`, `update_sales_bill`, `apply_customer_payment`, `apply_goods_return`, `record_purchase`, `apply_supplier_payment`, `record_expense`, `record_damage`). Do not "fix" totals only in React.

2. **Data access** → Use `app/src/lib/live/domainLive.ts` for reads/writes + `app/src/store/domainHooks.ts` for React Query hooks. Pages must not add random `supabase.from()` calls unless matching existing patterns.

3. **Work in `app/`** — All npm commands require `cd app` first.

4. **Smallest correct diff** — Avoid drive-by refactors. Match surrounding code style.

5. **Multi-tenancy** — All domain reads must filter by `tenant_id` via `getTenantIdForCurrentUser()`. RLS policies on all tables.

6. **Never commit:**
   - `.env.local`, service role keys, or credentials
   - Real business data in Excel/CSV files
   - Large binaries or node_modules

7. **Tailwind** — Run `npm run lint:tailwind` before push. Invalid semantic classes fail CI.

8. **Git** — Commit only when user asks. Focus commit message on **why**, not what.

---

## Repository Layout

```
app/
├── src/
│   ├── pages/              # Route screens (sales, bills, customers, etc.)
│   ├── components/app/     # Shared UI (PageBackLink, BillPrintView, etc.)
│   ├── routes/AppRouter.tsx
│   ├── store/domainHooks.ts    # React Query hooks → domainLive
│   ├── domain/
│   │   ├── types.ts            # Type definitions
│   │   ├── defaults.ts         # Default values
│   │   └── catalogs.ts         # Enums (payment modes, etc.)
│   └── lib/
│       ├── live/domainLive.ts     # Main data layer (Supabase)
│       ├── billDisplay.ts         # Bill formatting logic
│       ├── saleLineMath.ts        # Line amount calculations
│       ├── uom.ts                 # Pack/UOM pricing
│       ├── printBill.ts           # Print via iframe
│       ├── billExport.ts          # PDF/share
│       └── auth.tsx               # Auth context
├── scripts/                # E2E tests (e2e-*.mjs)
└── supabase/migrations/    # 0001–0032 (ordered SQL)
```

---

## Common Commands

```bash
cd app
npm install                    # Install dependencies
npm run dev                   # Local dev (http://localhost:5173)
npm run build                 # Production build
npm run deploy:check          # **Before push:** lint + TypeScript + build
npm run lint:tailwind         # Check Tailwind classes

# E2E Testing
npm run e2e:smoke             # Schema/RPC smoke test
npm run e2e:live              # Login + reads (needs .e2e-credentials.local)
npm run e2e:matrix            # Full API test
npm run e2e:ui                # Browser UI (Playwright)
npm run e2e:bill              # Bill math + PDF
npm run e2e:phase0            # Phase 0 full gate
```

---

## Core Architecture

### Data Layer (`domainLive.ts`)

All Supabase reads/writes happen here. Key exports:

- **Reads:** `fetchProductsLive`, `fetchCustomersLive`, `fetchSalesLive`, `fetchPaymentsLive`, `fetchDomainBundle`
- **Writes:** `commitSaleLive`, `commitPaymentLive`, `commitReturnLive`, `commitPurchaseLive`, `commitSupplierPaymentLive`, `upsertProductLive`, `upsertCustomerLive`
- **Extras:** `recordExpenseLive`, `recordDamageLive`, `fetchTenantSettingsLive`, `insertCapitalEntryLive`

### React Query Hooks (`domainHooks.ts`)

Each page calls hooks to get data and mutations:

```typescript
const CUSTOMERS = useCustomers();
const SALES = useSales();
const { mutateAsync: commitPayment } = usePaymentMutation();
```

Hooks invalidate queries after mutations via `DOMAIN_QUERY_KEY` or specific keys.

### Routes

**Public:** `/`, `/login`, `/register`, `/privacy`, `/terms`, `/faq`, `/license-expired`, `/pending-approval`, `/no-tenant`

**App (auth required):**
- `/app/home` — Dashboard
- `/app/sales/new`, `/app/sales/edit/:billNo`
- `/app/bills/:billNo` — View, print, PDF, share
- `/app/payments/new`, `/app/returns/new`, `/app/purchases/new`, `/app/supplier-payments/new`
- `/app/products`, `/app/customers`, `/app/stock`, `/app/suppliers`
- `/app/expenses/new`, `/app/damages/new`, `/app/daily-cash`
- `/app/company`, `/app/capital`, `/app/settings`, `/app/more`, `/app/support`

---

## Key Features

✅ **Sales billing** — Create/edit bills with line discounts, VAT, extra charges
✅ **Stock tracking** — On-hand from `v_stock`, low-stock alerts, manual adjustments
✅ **Customer credit** — FIFO payment allocation, aging buckets, overdue tracking
✅ **Purchases** — Supplier invoices, supplier payments, VAT on purchases
✅ **Returns & damages** — Goods return with stock/bill credit, damage recording
✅ **Multi-tenant** — RLS by `tenant_id`, data isolation guaranteed
✅ **Schemes** — Buy-X-get-Y promotions with auto free lines
✅ **Export** — CSV registers + ZIP backup (Tier A complete)
✅ **Tax invoices** — VAT registration, IRD-ready bill format
✅ **PWA** — Installable web app

---

## Phase 0 Status (Complete)

**Tier A** (Tier A sign-off archived) — Export, stock, settings, categories
**Tier B** (Tier B sign-off archived) — PageBackLink, VAT validation, credit warning, oversell guard (migration 0024)
**Tier C** (Tier C sign-off archived) — App shell (tabs/drawer), Share bill, Support, customer PAN/VAT on bill

**Verify:** `npm run e2e:phase0` or manual checklist in `docs/backend/phase1-manual-e2e-checklist.md` §3.0a–c.

---

## Bill Logic

### Line amounts
- **MRP path:** `billLineAmount()` in `saleLineMath.ts` → `round(qty × mrp × (1 − discountPct/100))`
- **DB stores rate:** `qty × rate` = line amount
- **Effective rate for RPC:** `effectiveRateForRpc(qty, mrp, discountPct)`
- **Pack UOM:** `linePricingForProduct()` in `uom.ts`

### Totals
```
subtotal = Σ line amounts
afterDiscount = subtotal − bill discount
taxBase = afterDiscount + extra charges
vat = round(taxBase × 13%) if VAT registered
grandTotal = taxBase + vat
balance = grandTotal − paidNow
```

### Display rules (`billDisplay.ts`)
- **Bill-level discount** (% or flat) → footer only
- **Line-level discount** (product `discount_pct`) → **DISC%** column
- **Payment labels:** "Credit" / "Partial (Cash)" / "Cash" / "Paid"
- **Print title:** "TAX INVOICE" if VAT registered, else "SALES INVOICE"

### Print/PDF (`BillPrintView.tsx`, `index.css`)
- Columns: **S.N. | Particulars | MRP | Unit | Qty | [Disc%] | Amt**
- Print via hidden iframe (empty title → no bill no. in browser header)
- A4 ~186mm wide; `@page` margin ~18mm top
- CSS pitfalls: `p-0` on totals cells kills padding; use dedicated rule row

---

## Migrations

**0001–0023:** Core schema, Phase 0 Tier A  
**0024:** Oversell guard (`assert_sale_stock_available`)  
**0025–0026:** Support contacts, customer PAN/VAT (Tier C)  
**0027–0032:** Platform inquiries, tenant license, contact email

Apply in order via `app/supabase/README.txt`.

---

## Testing Workflow

| What | Test |
|------|------|
| **Bug fix** | `deploy:check` + targeted `e2e:*` script |
| **UI-only change** | `lint:tailwind` via `deploy:check` |
| **Bill/print/PDF change** | `e2e:bill` (or `e2e:bill:visual` if layout) |
| **RPC/schema change** | `e2e:smoke` + `e2e:matrix` + manual checklist |
| **Before push** | `npm run deploy:check` |

---

## Cursor Rules

- `.cursor/rules/docs-on-change.mdc` — Update docs when code changes
- `.cursor/rules/tenant-data-integrity.mdc` — RLS safety checks
- `.cursor/rules/marketing-copy.mdc` — User-facing copy standards

---

## Environment Setup

**Local development:**
```bash
cd app
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

**E2E credentials:**
```bash
# Create .e2e-credentials.local (never commit)
echo 'export const E2E_EMAIL = "test@example.com"' > app/.e2e-credentials.local
echo 'export const E2E_PASSWORD = "test_password"' >> app/.e2e-credentials.local
```

---

## Deployment

**Pre-flight:** `npm run deploy:check` (lint + build)

**Pipeline:** Git push `main` → Netlify builds `app/` → `dist/` deployed

**Secrets on Netlify:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Supabase:** Migrations ordered in `app/supabase/README.txt`; apply before going live.

---

## Debugging

**TypeScript errors:** `npm run build` or `npx tsc -b`

**Tailwind errors:** `npm run lint:tailwind`

**E2E failures:** Check `app/.e2e-*` artifact files (screenshots, logs)

**Supabase issues:** Verify migrations applied + RLS policies active + auth configured

---

## Important Links

- **Handbook:** `docs/LLM_CONTEXT.md` (read for deep context)
- **Launch checklist:** `docs/FIRST_LAUNCH.md`
- **Roadmap:** `docs/PHASE_ROADMAP.md`
- **Deferred features:** `docs/BACKLOG.md`
- **Data model:** `docs/backend/data-model.md`
- **Manual QA:** `docs/backend/phase1-manual-e2e-checklist.md`

---

## Quick Decision Tree

**Q: Where do I fetch data?**  
A: `domainLive.ts` (reads), then `domainHooks.ts` (React Query). Never raw `supabase.from()` in pages.

**Q: How do I create a bill/payment/return?**  
A: Call `commitSaleLive`, `commitPaymentLive`, etc. via `useXMutation()` hook. RPCs handle all math and RLS.

**Q: The app is slow.**  
A: Check React Query cache keys (`DOMAIN_QUERY_KEY`), bundle size (`vite build --analyze`), and Supabase RLS filters.

**Q: Bill totals are wrong.**  
A: Math happens in RPCs (server) + `saleLineMath.ts` (UI display only). Check `billDisplay.ts` rules.

**Q: Can I add a new `supabase.from()` call?**  
A: Only if matching an existing pattern (e.g., read-only fetch for non-sensitive data). Otherwise, add it to `domainLive.ts`.

**Q: Should I commit `.env.local`?**  
A: **No.** Add to `.gitignore` + document in `.env.example`.

---

## Changelog

- **2026-06-05** — CLAUDE.md created. Phase 0 Tier A+B+C complete. PageBackLink, VAT validation, oversell guard shipped. Ready for Phase 1.

---

*Last updated: 2026-06-05*
