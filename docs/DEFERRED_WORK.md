# Deferred work register

**Navigate:** [Docs hub](README.md) · [Launch roadmap Phase 0–3](PHASE_ROADMAP.md) · [Backend checklist](backend/BACKEND-TODO.md) · [Pain-first roadmap](PRODUCT_EVOLUTION.md) · [Migrations](../app/supabase/README.txt)

> **Purpose:** Single place to plan work we are **not** doing now. When you pick up an item, move status here, implement, then check off in [BACKEND-TODO.md](backend/BACKEND-TODO.md) and [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md).

---

## How to maintain this file

1. **New deferred item** — Add a row in the table below with ID, effort, touchpoints, acceptance criteria.
2. **Starting work** — Set status to `In progress`; link PR or branch in Notes.
3. **Done** — Set status to `Done` + date; mark related checkboxes in BACKEND-TODO / PRODUCT_EVOLUTION; add a line to [LLM_CONTEXT.md](LLM_CONTEXT.md) changelog.
4. **Do not duplicate** — BACKEND-TODO and PRODUCT_EVOLUTION stay summary + pain mapping; **details live here**.

---

## Register

| ID | Title | Status | Effort (est.) | Why deferred |
|----|--------|--------|---------------|--------------|
| **INV-1** | Block oversell in DB | **Done (2026-05-26)** | **1–2 dev days** | Migration `0024_block_oversell_in_sales.sql`; apply on Supabase before live e2e |
| **INV-2** | Picker stock vs bill date | Backlog · **product decision** | **0–5 days** (see options) | Today’s `onHand` only; backdating is edge case for pilot |
| **SUP-1** | Supplier scheme → pass-through to customer | Backlog | **3–5 days** | Scheme on sales shipped; purchase-side not built |
| **EXP-1** | Export P0 (registers + backup ZIP) | **Done (Tier A)** · partial ZIP | **IMP-0** for full | Tier A: registers + date-range ZIP shipped; full tenant backup → **IMP-0** |
| **BRAND-1** | Product rebrand | **Done** | — | **BikriKhata** — `productBrand.ts`, docs, npm `bikrikhata` (2026-05-26) |
| **IMP-0** | Complete full tenant backup ZIP | Backlog · **Phase 2** | **~1 week** | Export everything: settings, suppliers, payments, returns, expenses, damages, purchase lines, outstanding, all-history option |
| **IMP-1** | CSV import hub (per entity) | Backlog · **Phase 2** | **~2–3 weeks** | Upload templates: products, customers, suppliers, categories, settings, opening stock/balance |
| **IMP-2** | Restore / migration import (resume same point) | Backlog · **Phase 2** | **~3–5 weeks** | Import backup ZIP or ordered CSVs; recreate masters + optional history; after IMP-0/1 |
| **MIG-0012** | Scheme Box→PCS columns | Optional | **~10 min** SQL | Only if using cross-UOM schemes |
| **CAT-1** | Parent/child product categories (2-level) | Backlog · **Phase 1** | **~3–5 days** | Phase 0 ships **flat** list (`0019`); build when tenant has 30+ groups or wants roll-up reports |
| **CAT-2** | Category tree UI (ERP-style) | Backlog · **Phase 2** | **~1–2 weeks** | Full sidebar tree + deep hierarchy; after CAT-1 if still needed |

---

## INV-1 — Block oversell in database

**Problem:** `create_sales_bill` / `update_sales_bill` insert lines without checking stock. Sale picker blocks out-of-stock on **new** lines only ([`stockAlert.ts`](../app/src/lib/stockAlert.ts)).

**Scope (v1):** Reject when line qty (in **base PCS**, same rules as `v_stock` in `0010_sales_items_unit_stock.sql`) exceeds **current** on-hand. Not bill-date stock (that is INV-2).

**Touchpoints:**

| Layer | Files |
|-------|--------|
| DB | Migration `0024_block_oversell_in_sales.sql` — `line_qty_to_base_pcs`, `assert_sale_stock_available`; patch `create_sales_bill`, `update_sales_bill` |
| App | Map RPC error in `commitSaleLive` ([`domainLive.ts`](../app/src/lib/live/domainLive.ts)) → user toast |
| Tests | [`e2e-stock-dates.mjs`](../app/scripts/e2e-stock-dates.mjs) (today notes “oversell allowed”) |

**Rules to decide before coding:**

- **Edit bill:** Exclude this bill’s old `sales_items` from “sold” when computing available stock.
- **Scheme FOC lines:** `rate = 0` but `qty > 0` still consumes stock.
- **Same product, multiple lines:** Sum demand per `product_id` before compare.
- **Concurrent bills:** v1 may allow race; optional `FOR UPDATE` on product rows = extra half day.

**Acceptance:**

- [ ] New bill with qty > on-hand → RPC error, nothing saved.
- [ ] Edit bill within stock after excluding old lines → succeeds.
- [ ] Pack UOM (Box) converts with `uom_conversion` like `v_stock`.
- [ ] E2E asserts rejection (or documented skip for live tenant).

**Staff rule until done:** Do not rely on DB; use picker; avoid selling more than physical stock.

---

## INV-2 — Picker stock vs bill date

**Problem:** Bill date can be in the past; picker still shows **today’s** `product.onHand` from `v_stock`.

**Options (pick one before build):**

| Option | DB | App | Effort |
|--------|----|-----|--------|
| **(c) Today only** | None | None | **0** (current) |
| **(b) Relax when bill date is before today** | None | `stockAlert.ts` / `SaleEntryPage` | **~0.5 day** |
| **(a) `stock_as_of(bill_date)`** | New SQL function mirroring `v_stock` with date filters | Picker passes `billDate` | **~3–5 days** |

**Touchpoints (option a):** `v_stock` logic in [`0010_sales_items_unit_stock.sql`](../app/supabase/migrations/0010_sales_items_unit_stock.sql); filter `sales_bills.bill_date`, purchase dates, damages, returns; [`fetchProductsLive`](../app/src/lib/live/domainLive.ts) or dedicated RPC.

**Often paired with INV-1** if backdated sales must not oversell “as of that day.”

**Staff rule until done:** Enter older **purchases** before **backdated sales** when catching up history.

---

## SUP-1 — Supplier scheme pass-through

**Problem:** Supplier promo on purchase should mirror to customer scheme on sale (one company promo, one flow).

**Touchpoints:** `record_purchase` / purchase UI; `scheme_tracker`; optional link table; sales `schemeApply.ts` (may reuse).

**Spec:** [BACKEND-TODO.md § Now](backend/BACKEND-TODO.md) · [PRODUCT_EVOLUTION.md § Next #7](PRODUCT_EVOLUTION.md).

---

## EXP-1 — Export P0 (partial — Tier A)

**Status:** **Partially shipped** — `app/src/lib/export/*`, Settings → **Export** tab, quick CSVs + date-range registers + backup ZIP ([`ExportSection.tsx`](../app/src/pages/settings/ExportSection.tsx)).

**Still missing for “accountant + trust” (→ IMP-0):** suppliers, `tenant_settings`, payments register, returns/expenses/damages, purchase line items, supplier payments, capital; ZIP tied to date range only; outstanding not in ZIP.

**Spec:** [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) · BACKEND-TODO.

---

## IMP-0 — Complete full tenant backup (Phase 2)

**Problem:** Owners want **one download** of all business data (settings, masters, every invoice, payments, stock, udhar) for disaster recovery and leaving the platform.

**Phase:** **2** (extend Tier A export; do not block Phase 0 launch).

**In ZIP / registers (target):**

| File | Contents |
|------|----------|
| `tenant_settings.csv` | Business profile, VAT, address, categories, footer, list page size (no secrets) |
| `products.csv` | Full product master + `product_id` |
| `customers.csv` | + outstanding / credit limit |
| `suppliers.csv` | Master |
| `sales_bills.csv` / `sales_items.csv` | **All history** option + date range |
| `purchases.csv` / `purchase_items.csv` | Headers + lines |
| `payments.csv` | Per-bill allocations |
| `returns.csv`, `expenses.csv`, `damages.csv` | Period or all-time |
| `stock_snapshot.csv` | `v_stock` at export time |
| `supplier_payments.csv` | If table exists |
| `manifest.json` + `README.txt` | Row counts, app version, export_version |

**Touchpoints:** `lib/export/buildRegisters.ts`, `backupZip.ts`, optional Edge Function for large tenants; [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) §5.

**Acceptance:**

- [ ] Owner downloads ZIP with all tables above.
- [ ] “All business data” mode exports full bill/payment history (paginated, row cap + warning).
- [ ] Outstanding and per-bill `balance` included.
- [ ] E2E `e2e-export.mjs` asserts file list in ZIP.

---

## IMP-1 — CSV import hub — per entity (Phase 2)

**Problem:** New tenant or recovery: import **customers, suppliers, products, categories, settings, stock** from Excel without retyping.

**Phase:** **2** (Phase 1 may ship **light** product/customer templates only if a tenant blocks go-live — optional).

**UX:** Settings → **Import data** (mirror Export): pick entity → download template → fill → upload → preview errors → commit.

| Importer | v1 columns (examples) | Notes |
|----------|----------------------|--------|
| Products | code, name, category, unit, buy excl, sell, MRP, opening_qty | Uses RPC/create rules |
| Customers | name, phone, area, address, PAN, opening_balance | Opening balance → opening bill or flag |
| Suppliers | name, phone, address, PAN/VAT | |
| Categories | name (flat); parent+child when CAT-1 exists | |
| Settings | Single-row template or JSON | Careful merge, not blind overwrite |
| Stock | product code, qty adjustment or opening only | Pair with products import |

**Touchpoints:** `app/src/pages/settings/ImportSection.tsx` (new), `lib/import/*`, validation against domain types; no service-role in browser.

**Acceptance:**

- [ ] Template CSV per entity with header row + 1 example row.
- [ ] Upload shows row-level errors before save.
- [ ] Import 50 products + 20 customers in &lt; 5 minutes in manual test.
- [ ] Docs: onboarding section in manual checklist.

**Not in IMP-1:** Full bill/payment history import (→ IMP-2).

---

## IMP-2 — Restore / migration import — resume from same point (Phase 2)

**Problem:** After **IMP-0** backup, tenant wants to **import ZIP** (or ordered CSV set) and continue with same stock, udhar, and masters — “start from that point.”

**Phase:** **2** — after **IMP-0** + **IMP-1**; hardest item.

**Scope tiers:**

| Tier | Restore | Effort |
|------|---------|--------|
| **A — Go-live** | Masters + opening stock + customer opening balances | IMP-1 covers most |
| **B — Operational** | Tier A + open bills + payment allocations | Needs bill/payment import RPCs |
| **C — Full history** | Tier B + all past bills, purchases, returns | Migration project; `returns.bill_id` etc. |

**Rules:**

- Import order: settings → categories → products → customers → suppliers → stock → (optional) purchases → sales → payments.
- Preserve or map UUIDs from backup for Tier B/C.
- Stock closing from snapshot must match `v_stock` formula or document adjustment step.
- **Never** import secrets; tenant-bound RLS on all writes.

**Acceptance (Tier A minimum for IMP-2 done):**

- [ ] Documented restore runbook in DATA_EXPORT_SPEC §9.
- [ ] Tier B: one test tenant round-trip (export ZIP → new tenant import) with matching outstanding ± documented tolerance.

**Defer:** Tally bridge, automated nightly backup to owner email.

---

## BRAND-1 — Rebrand

**Brief:** [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) · BACKEND-TODO § Deferred branding.

---

## CAT-1 — Parent/child product categories (Phase 1)

**Problem:** Today `tenant_settings.product_categories` is a **flat** JSON string array; each product has one `category` text. Dealers with large catalogs (or CA reports by main group) want **parent → child** (e.g. Beverages → Juice), not a long flat dropdown.

**Phase:** **1** (optional — only after 1–2 paying tenants ask or category list routinely exceeds ~30).

**Scope (v1 — keep simple):**

| In scope | Out of scope (→ CAT-2 / Phase 2) |
|----------|----------------------------------|
| **2 levels max:** parent + child | 3+ level deep tree |
| Product stores **child** name or id; reports roll up to parent | ERP sidebar tree view |
| Settings: add parent, add child under parent | Move product between branches in bulk |
| Filters: parent expands to all children | HS code / brand dimension |

**Touchpoints:**

| Layer | Files / tables |
|-------|----------------|
| DB | New `product_category_nodes` (or extend jsonb with `{ id, parent_id, name }`); migration; products.category → child id or keep text + FK |
| App | `ProductCategoryField`, `ProductCategoriesSection`, `ProductsPage` / `Stock` filters, export CSV category column |
| Docs | `data-model.md`, manual checklist § Products |

**Acceptance:**

- [ ] Create parent “Beverages” and child “Juice”; assign product to Juice.
- [ ] Product form picker shows grouped or indented list (mobile-friendly).
- [ ] Stock/Products filter by parent includes all children.
- [ ] Export register still has category column (child + optional parent column).
- [ ] Flat categories from `0019` migrate without data loss.

**Staff rule until done:** Use flat names with a prefix (e.g. `Beverages - Juice`) if grouping is urgent.

---

## CAT-2 — Category tree UI (Phase 2)

**Problem:** Power users want **flexible hierarchy** like desktop ERP (sidebar tree, many levels, item list by branch).

**Phase:** **2** — after **CAT-1** and only if tenants outgrow 2-level.

**Scope:** Tree manager in Settings; collapse/expand; optional 3+ levels; search across tree.

**Effort:** **~1–2 weeks** solo (UI + CRUD + filter/export roll-ups).

**Defer reason:** Wrong complexity for Phase 0 ICP (1 godown, &lt;30 categories). See [PHASE_ROADMAP.md §4–5](PHASE_ROADMAP.md).

---

## MIG-0012 — Scheme UOM (optional)

**When:** Box→piece schemes (e.g. buy 1 Box get 1 PCS free).

**File:** [`app/supabase/migrations/0012_scheme_uom.sql`](../app/supabase/migrations/0012_scheme_uom.sql) — run in Supabase SQL editor ([README.txt](../app/supabase/README.txt) step 13).

**Not required** for same-UOM schemes (buy 10 get 1 PCS).

---

## Scheme release (shipped — reference only)

| Doc | Use |
|-----|-----|
| [DEPLOY_SCHEME_RELEASE.md](DEPLOY_SCHEME_RELEASE.md) | Deploy checklist, smoke tests |
| `npm run seed:schemes` | Dev/staging test data only |

Scheme code is no-op when `scheme_tracker` is empty ([`schemeApply.ts`](../app/src/lib/schemeApply.ts)).

---

## Related indexes

| Doc | Role |
|-----|------|
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) | **Why** (client pain) and roadmap row numbers |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Checkboxes, phases, quality bar |
| [LLM_CONTEXT.md](LLM_CONTEXT.md) | AI session handbook + changelog |
| [backend/data-model.md](backend/data-model.md) | Schema detail when designing INV/SUP |

---

*Last updated: 2026-05-26 — **IMP-0/1/2** (Phase 2 full backup + import + restore); **CAT-1/2**; EXP-1 marked partial.*
