# Backend implementation checklist (Supabase)

**Navigate:** [Docs hub](../README.md) · [**Launch roadmap Phase 0–3**](../PHASE_ROADMAP.md) · [Deferred work register](../DEFERRED_WORK.md) · [Project README](../../README.md) · [Data model](./data-model.md) · [Testing live](./testing-live-supabase.md) · [Migrations](../../app/supabase/README.txt)

> Living list for **Supabase-backed** multi-tenant Postgres. The app is **live-only** (no browser demo / `localStorage` store).  
> Schema entrypoint: `0001` … `0003` → `0005` → `0006` → `0007` (see [`app/supabase/README.txt`](../../app/supabase/README.txt)).  
> **Why MCP vs `.env`?** See [`mcp-and-env.md`](./mcp-and-env.md).

---

## Now — client pain points (priority over new features)

> **Phase 0 complete (2026-05-26)** — [`../PHASE0_SIGNOFF.md`](../PHASE0_SIGNOFF.md).  
> Full pain → action mapping: [`../PRODUCT_EVOLUTION.md`](../PRODUCT_EVOLUTION.md). **Next:** Tier C or Phase 1.

- [x] **Scheme page** — persists buy-X-get-Y to `scheme_tracker` (`insertSchemeLive` / `commitSchemeEntry`).
- [x] **Scheme on sales** — active scheme per product + bill date → auto free line (`schemeApply.ts`, `SaleEntryPage`); Home stock filter **On scheme**. Test: `npm run seed:schemes`.
- [ ] **Supplier scheme + pass-through to customer** — supplier promo on purchase (stock in); link/copy to customer `scheme_tracker`; purchase FOC lines (mirror sales).
- [x] **Export Tier A** — Settings → Export; registers + partial backup ZIP ([`../DATA_EXPORT_SPEC.md`](../DATA_EXPORT_SPEC.md)); full ZIP → IMP-0.
- [x] **Product categories (flat)** — tenant `product_categories` jsonb + product form dropdown (`0019`, CAT-0).
- [ ] **CAT-1** — Parent/child categories (2-level) — **Phase 1** — [DEFERRED_WORK.md](../DEFERRED_WORK.md).
- [ ] **CAT-2** — Category tree UI — **Phase 2** — [DEFERRED_WORK.md](../DEFERRED_WORK.md).
- [x] **Performance (PERF-0)** — paginated sales headers; lighter domain bundle for shell.
- [x] **Credit limit (CRED-0)** — warning toast when projected outstanding exceeds limit; save still allowed (Tier B).
- [x] **INV-1** — block oversell in `create_sales_bill` / `update_sales_bill` — migration **0024** (Tier B).
- [x] **VAT-0b** — Settings save requires address + VAT number when VAT registered (Tier B).
- [x] **UI-0.9** — `PageBackLink` on inner pages + Settings (Tier B).
- [x] **Rebrand (BRAND-0)** — **BikriKhata** ([`../PRODUCT_NAMING_BRIEF.md`](../PRODUCT_NAMING_BRIEF.md), `productBrand.ts`).
- [x] **Opening stock + stock adjustment (STK-0d–f)** — migrations 0020–0021; Settings toggle; Stock adjustment page.
- [x] **Tabbed Settings + Export tab** — UI-0.8 / UI-0.11 (Tier A).
- [x] **Purchase invoice date** — form date → `record_purchase` (shipped).
- [x] **Sale stock picker** — OOS/low/in stock on new bill lines (shipped).
- [x] **Bill print/PDF** — discount + layout fixes (shipped).

---

## Phase 0 — Environment & tooling

- [x] Create Supabase project; add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `app/.env.local` (see [`mcp-and-env.md`](./mcp-and-env.md)).
- [x] App requires `VITE_*`: `AuthProvider`, email login, `/register` → `signup_tenant`, protected `/app/*`, Settings → `tenant_settings` read/write.
- [ ] (Optional) Enable **Supabase MCP** in Cursor Settings → MCP and sign in so agents can use Supabase tools when connected.
- [x] Run migrations in order (`0001` → `0007`) via SQL editor — see [`app/supabase/README.txt`](../../app/supabase/README.txt).
- [ ] **You:** In Supabase Dashboard → **Authentication → Providers → Email**: enable provider; for dev, turn off **Confirm email** until you add a confirmation flow (otherwise `signup_tenant` cannot run right after sign-up without a session).
- [ ] **You:** Set **Authentication → URL configuration → Site URL** to your local app (e.g. `http://localhost:5173`) when testing.
- [ ] Document one-time super-admin promotion (see comment block at end of `0001_init.sql`).
- [ ] Smoke test: register → `tenant_users` + `tenant_settings` rows; approve tenant if needed → open **Settings** and save.
- [x] **Deploy:** follow [`docs/deployment.md`](../deployment.md) — GitHub repo, Netlify `VITE_*`, Supabase Auth redirect URLs, `npm run deploy:check` locally.

---

## Phase 1 — Core transactions

Wire the UI to Supabase **RPCs and/or constrained updates** via `domainLive.ts` / `domainHooks.ts`.

- [x] **Settings / `tenant_settings`** — load + save on Settings page; header, bills, and product defaults use `useBusinessSettings()` from live data.
- [x] **Products / customers** — product create/update (`upsertProductLive`); customer add/edit (`commitCustomer` + `/app/customers/new`). **Supplier add UI** still incremental; live reads from Postgres.
- [x] **Sales** — `create_sales_bill` (`0003`); **edit** via `update_sales_bill` (`0007`) + `commitSaleLive` on `/app/sales/edit/:billNo`.
- [x] **Payments** — `apply_customer_payment` RPC + live `payments` / `sales_bills` reads.
- [x] **Returns** — `apply_goods_return` RPC + stock/bill updates.
- [x] **Purchases** — `record_purchase` RPC + `purchases` / `purchase_items` reads in bundle.
- [x] **Supplier payments** — `apply_supplier_payment` RPC + `supplier_payments` ledger (`0006`).
- [x] **Expenses, damages** — `record_expense`, `record_damage` RPCs wired from UI. **daily_cash** — partial wiring; deeper save path in backlog.
- [x] **Read paths** — `domainHooks` + `domainLive` fetch bundle (`v_stock`, `v_customer_balance`, `v_supplier_balance`, nested sales/items).
- [x] **Offline demo removed** — no `appStore` / `dummy.ts`; `MissingSupabaseEnv` when `VITE_*` unset.

---

## Phase 1b — Doc / schema alignment (technical debt)

- [ ] Reconcile **data-model.md** table names (`sales`, `outstanding_bills`, …) with **actual** `0001` names (`sales_bills`, views, etc.) in one pass to avoid onboarding confusion.
- [x] Product columns used by the FE (`mrp`, `discount_pct`, `vat_applicable`, `min_qty`) added in `0003_phase1_operations.sql`; customer `outstanding` remains view-derived in live mode.

---

## Phase 2-A / 2-B / 2-C / 2-D — Planned features

> Full design notes: [`data-model.md`](./data-model.md) § Phase 2.

- [ ] **2-A** — `notifications` table, cron / Edge Function, Realtime subscription (see `data-model.md`).
- [ ] **2-B** — `bill_images`, Storage bucket, extraction pipeline.
- [ ] **2-C — Capital (pilot for “edit + inclusion + audit”)** — align with **`data-model.md` § Cross-cutting policy** and § Phase 2-C:
  - [ ] Migration (new file after `0007`): `included_in_reports` (default true), `excluded_reason` (required when excluded), optional `excluded_at` / `excluded_by`, optional `supersedes_entry_id` for adjustment rows; CHECK or RPC validation.
  - [ ] RPCs: `set_capital_included(…)` with required reason when excluding; `soft_delete_capital_entry` (optional); optional `upsert_capital_entry` for audited amount/business rules; keep existing audit trigger from `0002`.
  - [ ] FE: list/detail badges (included vs excluded), toggle + reason modal, non-amount edit, amount via adjustment or RPC; read-only **View history** from `capital_entry_audit`.
  - [ ] KPIs / overview: `summarizeCapital`, company overview, and live reads filter to **included** + **not soft-deleted** (and document any entity-specific exceptions).
  - [ ] E2E / matrix tests for exclude-with-reason, KPI sums, audit visibility, soft delete.
  - [ ] Later waves (optional): same pattern for expenses, damages, etc.
- [ ] **2-D — Sales bill amendment history** (RPC **shipped** in `0007`; audit UI still open):
  - [x] RPC `update_sales_bill` — adjusts `sales_bills` / `sales_items`, respects existing `paid` (cannot reduce total below paid).
  - [ ] Append-only **`sales_bill_audit`** (mirror `capital_entry_audit`): `before_row` / `after_row`, `changed_by`, `changed_at`; trigger or definer RPC only.
  - [x] FE: `SaleEntryPage` edit path → `commitSaleLive` → `update_sales_bill`.
  - [ ] FE: optional **“Amendment history”** on `BillDetailPage` from `sales_bill_audit`.
  - [ ] Tests: matrix cases for edit maths, stock delta, audit row count.
- [ ] **2-E — Data export (reporting + migration + backup)** — **Tier A partial; IMP-0 Phase 2.** Full spec: [`../DATA_EXPORT_SPEC.md`](../DATA_EXPORT_SPEC.md)
  - [x] **P0 — Reporting (Tier A):** Settings → Export hub; products, customers, stock; date-range sales/lines, purchases, outstanding, VAT period summary; `lib/export/*`, `e2e:export`.
  - [ ] **P0 — Backup (full):** Complete tenant ZIP — **IMP-0**; Tier A ZIP is date-range partial.
  - [ ] **P1:** XLSX accountant pack; expenses/damages/returns registers; `export_runs` audit; `returns.bill_id` for migration; VAT period summary.
  - [ ] **P2:** Import templates; async large exports; incremental backup.
  - [ ] **Deferred:** Tally sync, historical stock-as-of-date, bulk bill PDF ZIP.

---

## Deferred — backup, import & restore (Phase 2)

> **Details:** [`../DEFERRED_WORK.md`](../DEFERRED_WORK.md) (**IMP-0**, **IMP-1**, **IMP-2**) · spec [`../DATA_EXPORT_SPEC.md`](../DATA_EXPORT_SPEC.md).

- [x] **Export Tier A (partial)** — Settings → Export; products, customers, stock, sales/purchase registers, backup ZIP.
- [ ] **IMP-0** — Complete full tenant backup (all entities, all-history) — **Phase 2**.
- [ ] **IMP-1** — CSV import hub per entity (products, customers, suppliers, categories, settings, stock) — **Phase 2**.
- [ ] **IMP-2** — Restore / migration import (resume from same point) — **Phase 2**.

---

## Deferred — product categories (hierarchy)

> **Details:** [`../DEFERRED_WORK.md`](../DEFERRED_WORK.md) (**CAT-1**, **CAT-2**). Flat list shipped in Phase 0.

- [ ] **CAT-1** — Parent/child (2-level); grouped picker; filter/export roll-up — **Phase 1**.
- [ ] **CAT-2** — ERP-style tree manager — **Phase 2**.

---

## Deferred — inventory & backdating

> **Details, effort, touchpoints, acceptance criteria:** [`../DEFERRED_WORK.md`](../DEFERRED_WORK.md) (**INV-1**, **INV-2**). Not scheme/deploy blockers.

- [x] **INV-1** — Block oversell in `create_sales_bill` / `update_sales_bill` (migration **0024**).
- [ ] **INV-2** — Picker stock vs bill date (product decision TBD).

---

## Product branding — **BikriKhata (done)**

> **Context:** Product brand **BikriKhata** (`productBrand.ts`, [bikrikhata.com](https://bikrikhata.com)); npm `bikrikhata`. Each shop’s legal name on bills = **tenant_settings**, not product brand. Brief: [`../PRODUCT_NAMING_BRIEF.md`](../PRODUCT_NAMING_BRIEF.md).

- [x] **Product name** — BikriKhata + taglines; domain bikrikhata.com.
- [x] **App shell** — `AuthBrandHeader`, login/register, `index.html`, PWA via `vite.brand.ts`.
- [x] **Docs & package** — README, LLM_CONTEXT, `package.json` → `bikrikhata`.
- [ ] **Optional:** GitHub repo rename; Netlify custom domain + Supabase Auth URLs ([`../deployment.md`](../deployment.md)).

---

## Quality bar before production

- [ ] RLS tests per role (`owner`, `accountant`, cross-tenant denial).
- [ ] Idempotent RPCs where retries matter (bill create, payment).
- [ ] Backup / PITR enabled on Supabase project.

---

**See also:** [Docs hub](../README.md) · [Product evolution (pain-first)](../PRODUCT_EVOLUTION.md) · [Data model](./data-model.md) · [Data export spec](../DATA_EXPORT_SPEC.md) · [Product naming brief](../PRODUCT_NAMING_BRIEF.md) · [Env & MCP](./mcp-and-env.md) · [Testing live](./testing-live-supabase.md) · [Automated E2E](./phase1-use-cases-and-tests.md)
