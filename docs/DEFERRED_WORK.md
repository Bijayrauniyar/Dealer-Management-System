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
| **INV-1** | Block oversell in DB | Backlog | **1–2 dev days** | UI disables OOS on new lines; RPC still allows oversell |
| **INV-2** | Picker stock vs bill date | Backlog · **product decision** | **0–5 days** (see options) | Today’s `onHand` only; backdating is edge case for pilot |
| **SUP-1** | Supplier scheme → pass-through to customer | Backlog | **3–5 days** | Scheme on sales shipped; purchase-side not built |
| **EXP-1** | Export P0 (registers + backup ZIP) | Backlog | **1–2 weeks** | Highest client pain; spec in DATA_EXPORT_SPEC |
| **BRAND-1** | Product rebrand | Backlog | **2–4 days** | Second dealer; see PRODUCT_NAMING_BRIEF |
| **MIG-0012** | Scheme Box→PCS columns | Optional | **~10 min** SQL | Only if using cross-UOM schemes |

---

## INV-1 — Block oversell in database

**Problem:** `create_sales_bill` / `update_sales_bill` insert lines without checking stock. Sale picker blocks out-of-stock on **new** lines only ([`stockAlert.ts`](../app/src/lib/stockAlert.ts)).

**Scope (v1):** Reject when line qty (in **base PCS**, same rules as `v_stock` in `0010_sales_items_unit_stock.sql`) exceeds **current** on-hand. Not bill-date stock (that is INV-2).

**Touchpoints:**

| Layer | Files |
|-------|--------|
| DB | New migration `0013_*` — helper `line_qty_to_base_pcs`, `assert_sale_stock_available`; patch `create_sales_bill`, `update_sales_bill` in latest migration copy |
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

## EXP-1 — Export P0

**Spec:** [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) · BACKEND-TODO Phase 2-E.

---

## BRAND-1 — Rebrand

**Brief:** [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) · BACKEND-TODO § Deferred branding.

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

*Last updated: 2026-05-20 — add changelog line in LLM_CONTEXT when you change this register.*
