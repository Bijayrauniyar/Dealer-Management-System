# Backend implementation checklist (Supabase)

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Data model](./data-model.md) · [Testing live](./testing-live-supabase.md) · [Migrations](../../app/supabase/README.txt)

> Living list for moving from **demo `localStorage`** (`appStore.ts`) to **persistent** multi-tenant Postgres.  
> Schema entrypoint: `0001_init.sql` (core domain) + `0002_tenant_settings_capital_audit.sql` (settings + capital + audit) + `0003_phase1_operations.sql` (transactions + product columns) + **`0005_fix_phase1_rpc_jsonb.sql`** when required (see [`app/supabase/README.txt`](../../app/supabase/README.txt)).  
> **Why MCP vs `.env`?** See [`mcp-and-env.md`](./mcp-and-env.md).

---

## Phase 0 — Environment & tooling

- [x] Create Supabase project; add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `app/.env.local` (see [`mcp-and-env.md`](./mcp-and-env.md)).
- [x] App boots **live mode** when both `VITE_*` vars are set: `AuthProvider`, email login, `/register` → `signup_tenant`, protected `/app/*`, Settings → `tenant_settings` read/write.
- [ ] (Optional) Enable **Supabase MCP** in Cursor Settings → MCP and sign in so agents can use Supabase tools when connected.
- [ ] **You:** Run migrations in order (`0001` → `0002` → `0003` → **`0005`**) via SQL editor — see [`app/supabase/README.txt`](../../app/supabase/README.txt).
- [ ] **You:** In Supabase Dashboard → **Authentication → Providers → Email**: enable provider; for dev, turn off **Confirm email** until you add a confirmation flow (otherwise `signup_tenant` cannot run right after sign-up without a session).
- [ ] **You:** Set **Authentication → URL configuration → Site URL** to your local app (e.g. `http://localhost:5173`) when testing.
- [ ] Document one-time super-admin promotion (see comment block at end of `0001_init.sql`).
- [ ] Smoke test: register → `tenant_users` + `tenant_settings` rows; approve tenant if needed → open **Settings** and save.
- [ ] **Deploy:** follow [`docs/deployment.md`](../deployment.md) — GitHub repo, Netlify `VITE_*`, Supabase Auth redirect URLs, `npm run deploy:check` locally.

---

## Phase 1 — Core transactions (replace store mutations)

Wire the UI to Supabase **RPCs and/or constrained updates** so behaviour matches `appStore` (`commitSale`, `commitPayment`, `commitReturn`, `commitPurchase`, `commitSupplierPayment`).

- [x] **Settings / `tenant_settings`** — load + save on Settings page; header, bills, and product defaults use `useBusinessSettings()` from live data.
- [x] **Products / customers** — product create/update (`upsertProductLive`); customer add/edit (`commitCustomer` + `/app/customers/new`). **Supplier add UI** still not wired; live reads from Postgres.
- [x] **Sales** — `create_sales_bill` in `0003_phase1_operations.sql` (VAT/extra charges, prefix-based bill no, payment mode mapping). Live **create** only; **edit existing bill deferred to Phase 2-D** (see below) — UI shows toast and blocks save on `/app/sales/edit/:billNo` when Supabase is configured.
- [x] **Payments** — `apply_customer_payment` RPC + live `payments` / `sales_bills` reads.
- [x] **Returns** — `apply_goods_return` RPC + stock/bill updates.
- [x] **Purchases** — `record_purchase` RPC + `purchases` / `purchase_items` reads in bundle.
- [x] **Supplier payments** — `apply_supplier_payment` RPC.
- [x] **Expenses, damages** — `record_expense`, `record_damage` RPCs wired from UI. **daily_cash** — not wired yet.
- [x] **Read paths** — when `VITE_SUPABASE_*` set, `domainHooks` + `domainLive` fetch bundle (`v_stock`, `v_customer_balance`, `v_supplier_balance`, nested sales/items).
- [ ] **Remove or gate** `localStorage` persistence once each vertical is live behind a feature flag (demo path still uses `appStore` / seed when env unset).

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
  - [ ] Migration (e.g. `0006`): `included_in_reports` (default true), `excluded_reason` (required when excluded), optional `excluded_at` / `excluded_by`, optional `supersedes_entry_id` for adjustment rows; CHECK or RPC validation.
  - [ ] RPCs: `set_capital_included(…)` with required reason when excluding; `soft_delete_capital_entry` (optional); optional `upsert_capital_entry` for audited amount/business rules; keep existing audit trigger from `0002`.
  - [ ] FE: list/detail badges (included vs excluded), toggle + reason modal, non-amount edit, amount via adjustment or RPC; read-only **View history** from `capital_entry_audit`.
  - [ ] KPIs / overview: `summarizeCapital`, company overview, and live reads filter to **included** + **not soft-deleted** (and document any entity-specific exceptions).
  - [ ] E2E / matrix tests for exclude-with-reason, KPI sums, audit visibility, soft delete.
  - [ ] Later waves (optional): same pattern for expenses, damages, etc.; **not** Phase 2-D bills (see below).
- [ ] **2-D** — **Sales bill edit + amendment history** (live mode):
  - RPC `update_sales_bill` (or equivalent) that adjusts `sales_bills` / `sales_items`, reconciles **stock** (reverse old lines, apply new), respects **payments** and **returns** already linked to the bill.
  - Append-only **`sales_bill_audit`** (mirror `capital_entry_audit`): `before_row` / `after_row`, `changed_by`, `changed_at`; trigger or definer RPC only.
  - FE: remove `SaleEntryPage` live edit guard; wire `commitSale` edit path to RPC; optional **“Amendment history”** on `BillDetailPage`; hide Edit pencil until RPC ships.
  - Tests: matrix cases for edit maths, stock delta, audit row count, edit blocked when bill fully settled (if that rule applies).

---

## Quality bar before production

- [ ] RLS tests per role (`owner`, `accountant`, cross-tenant denial).
- [ ] Idempotent RPCs where retries matter (bill create, payment).
- [ ] Backup / PITR enabled on Supabase project.

---

**See also:** [Docs hub](../README.md) · [Data model](./data-model.md) · [Env & MCP](./mcp-and-env.md) · [Testing live](./testing-live-supabase.md) · [Automated E2E](./phase1-use-cases-and-tests.md)
