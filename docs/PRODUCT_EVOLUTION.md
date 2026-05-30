# Product evolution — client pain points first

**Navigate:** [Docs hub](README.md) · [**Launch roadmap Phase 0–3**](PHASE_ROADMAP.md) · [Nepal GTM & pricing](GTM_NEPAL.md) · [VAT / IRD checklist](GTM_NEPAL.md#5-nepal-vat--ird-compliance-checklist) · [Backend checklist](backend/BACKEND-TODO.md) · [Data export spec](DATA_EXPORT_SPEC.md) · [LLM context](LLM_CONTEXT.md)

**Purpose:** Evolve from the first FMCG pilot tenant into a **multi-tenant Nepal distributor platform** (**BikriKhata**) — without a long “feature count” roadmap. Every item below ties to a **real user pain** or a **broken/half-built screen** today.

**Rule for prioritization:** If it does not fix daily ops, trust, or go-live for the **current or next dealer**, it waits.

**Last updated:** 2026-05-23

---

## 1. Who we serve (unchanged focus)

| Persona | Daily job | What “good” looks like |
|---------|-----------|-------------------------|
| **Dealer owner** | Bill, buy stock, chase udhar | Fast bill, correct print, stock roughly right, see who owes |
| **Accountant** | Registers, VAT, reconciliation | Export to Excel, bill dates correct, payments match bills |
| **Warehouse** | Receive goods, pick for orders | Purchase date saved, stock visible, damage recorded |
| **Salesman** (later) | Route sales, collections | Not primary in pilot — do not block v1 on van/beat |

Verticals later (grocery, hardware, pharma-lite) share the **same core loop**; optional modules come after pains below are solved.

---

## 2. Current client pain points (fix or own explicitly)

### A. Trust & “does it really save?”

| Pain | What happens today | Priority | Action |
|------|-------------------|----------|--------|
| ~~Scheme screen lies~~ | ~~Fake save~~ | **Done** | Saves to `scheme_tracker`; **sales auto-apply** free lines (`schemeApply` + `SaleEntryPage`) |
| **No data export** | Accountant still parallel Excel; owner fears cloud lock-in | **P0** | Phase 2-E: CSV registers + backup ZIP ([DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md)) |
| **“Download my data”** | Only single-bill PDF | **P0** | Same as export |
| **Credit limit shown, not enforced** | Customer form has limit; sales never block | **P1** | Enforce on save **or** hide limit until enforced |
| **Edit bill without history** | `update_sales_bill` works; no audit list on bill | **P1** | Phase 2-D audit UI (accountant asks “who changed this?”) |

### B. Billing & stock (daily operations)

| Pain | What happens today | Priority | Action |
|------|-------------------|----------|--------|
| **Sold out but bill still possible** | Picker blocks OOS on **new** lines; RPC allows oversell | **P1** | Deferred: DB oversell guard — document for staff until built |
| **Backdated purchase ignored** | **Fixed** — `purchase_date` from form → RPC | Done | Keep testing on production |
| **Backdated sale date** | **Works** — `bill_date` saved | Done | — |
| **Backdated sale + stock confusion** | Picker uses **today’s** stock, not stock on bill date | **P2** | Deferred; train: enter purchases before old sales |
| **Pack vs PCS mistakes** | UOM on lines; stock in base units | **P1** | UX hints on sale line (already partly there); training |
| **Bill print / discount wrong** | **Largely fixed** (footer vs line discount, layout) | Done | Monitor after deploy |
| **Slow app with many bills** | `fetchDomainBundle` loads **all sales** for shell/home | **P1** | Paginate/filter bills; stop loading full history on every visit |

### C. Masters & onboarding (next dealer)

| Pain | What happens today | Priority | Action |
|------|-------------------|----------|--------|
| **Product categories = ice cream** | Hardcoded `Ice Cream`, `Bar`, `Party`… in product form | **P0** for 2nd tenant | Tenant-configurable categories |
| **Login branding** | **Done** — BikriKhata + taglines | — | `productBrand.ts` |
| **No bulk import** | Every SKU/customer typed | **P1** | Import templates (after export column spec) |
| **Opening stock / opening udhar** | Manual product + purchase + bills | **P1** | Import: products + opening balances doc |
| **Supplier add clunky** | Form exists but called “incremental” in checklist | **P1** | Finish supplier CRUD polish if dealers ask |

### D. Money & reporting

| Pain | What happens today | Priority | Action |
|------|-------------------|----------|--------|
| **Sales / purchase register for CA** | No CSV | **P0** | Export by date range |
| **Outstanding list** | In app (home) | **P1** | Export outstanding snapshot |
| **VAT 13% hardcoded** | `BILL_VAT_RATE = 13` in code | **P1** | `tenant_settings.vat_rate` when non-13 needed |
| **Daily cash half-built** | Page exists; save path incomplete | **P2** | Wire or hide — do not advertise |
| **Company dashboard “private”** | Unclear who should see profit | **P2** | Role guard (`owner` vs `accountant`) |

### E. Not pain points for current pilot (do not prioritize yet)

These are **valid research topics** but **not** blocking wholesaler daily use:

- Van stock, beat plans, route optimization (`beat_plans` in DB, no UI)
- Freezer asset registry as core module
- Multi-warehouse, batch/expiry
- Barcode scanning
- Tally sync
- Full offline billing
- Customer price tiers (wholesale lists) — only when a second client asks repeatedly

---

## 3. Recently addressed (verify on production)

| Issue | Status |
|-------|--------|
| Purchase invoice date saved correctly | Shipped |
| Sale product picker: OOS visible, low stock warning | Shipped |
| Bill print/PDF layout and discount display | Shipped |
| E2E: stock dates, bill UI grand total test | Shipped |

---

## 4. Roadmap — pain-first (not feature count)

> **Detailed phase checklists (UI shell, export, phases 1–3):** [PHASE_ROADMAP.md](PHASE_ROADMAP.md).

### Now (current pilot + next 4–8 weeks)

Only items that **remove lies**, **restore trust**, or **unblock second dealer**.

| # | Work | Client pain solved |
|---|------|-------------------|
| ~~1~~ | ~~Scheme page + sales apply~~ | **Done** — save + auto free qty on bill |
| 1 | **Export P0** — products, sales/purchase registers, outstanding, backup ZIP | Accountant + owner backup |
| 2 | **Configurable product categories** + generic copy sweep | Second tenant onboarding |
| 3 | **Product rebrand** (login, PWA) | **Done** — BikriKhata |
| 4 | **Bill list / home data: paginated fetch** | App slows as bills grow |
| 5 | **Credit limit: enforce or hide** | Misleading UI |

### Next (when pilot is stable)

| # | Work | Client pain solved |
|---|------|-------------------|
| 7 | **Supplier scheme → pass-through** — supplier promo on purchase; mirror on customer sale | One company promo, one staff flow |
| 8 | Import templates (products, customers, opening stock) | Go-live without retyping |
| 9 | Bill amendment history UI | Disputes on edited bills |
| 10 | `returns.bill_id` + clearer return flow | Returns hard to reconcile in export |
| 11 | VAT rate in settings | Edge cases / future rate change |
| 12 | Role-based screens (accountant vs owner) | Staff shouldn’t see owner profit |
| 13 | DB oversell guard (**INV-1**) | Stock integrity — see [DEFERRED_WORK.md](DEFERRED_WORK.md) |

### Later (generic platform — only with demand)

| # | Work | When to consider |
|---|------|------------------|
| 14 | Stock-as-of-date picker (**INV-2**, TBD) | Frequent backdating complaints — [DEFERRED_WORK.md](DEFERRED_WORK.md) |
| 15 | Customer price tier | Wholesale clients ask |
| 16 | Simple delivery note from bill | Route sales workflow |
| 17 | Notifications (2-A) | Owner wants SMS for overdue |
| 18 | Multi-warehouse / expiry | Pharma or multi-godown client |
| 19 | **Stock adjustment** (opening / count correction, no supplier) + Settings toggle | **Phase 0** — [PHASE_ROADMAP.md](PHASE_ROADMAP.md) STK-0d–0f (~3–7 days); see [GTM stock model](GTM_NEPAL.md#stock-model-purchase-vs-stock-entry) |
| 20 | **Parent/child product categories** (**CAT-1**, 2-level) | **Phase 1** — tenant has 30+ groups or wants sales/stock by main category — [DEFERRED_WORK.md](DEFERRED_WORK.md) |
| 21 | **Category tree UI** (**CAT-2**, ERP-style sidebar) | **Phase 2** — after CAT-1 if power users need deep hierarchy |
| 22 | **Full tenant backup** (**IMP-0**) — settings, suppliers, payments, all invoices, udhar in ZIP | **Phase 2** — trust + disaster recovery |
| 23 | **CSV import hub** (**IMP-1**) — products, customers, suppliers, categories, settings, stock | **Phase 2** — onboarding without retyping |
| 24 | **Restore from backup** (**IMP-2**) — resume business from export | **Phase 2** — after IMP-0/1; Tier A masters first |

---

## 5. Stock model (purchase vs stock entry)

**Decision:** Keep **Purchase** as the normal way stock **increases** (supplier bill + payable + `purchase_items`). Do **not** add a parallel “stock entry” menu in v1 that duplicates purchase for daily buying.

| Flow | Screen / RPC | Affects `v_stock` |
|------|--------------|-------------------|
| Buy from supplier | `PurchasePage` → `record_purchase` | `purchased` += received qty |
| Sell | `SaleEntryPage` → `create_sales_bill` | `sold` |
| Customer return | `ReturnPage` → `apply_goods_return` | `returned` |
| Damage | `DamagePage` → `record_damage` | `damaged` |
| Opening qty | `products.opening_stock` | Base in formula — **weak UI** today |
| Count fix without supplier | **Missing** | **Phase 0:** `record_stock_adjustment` + toggle; import bulk opening → Phase 1 |

**Client messaging**

- Correct: *“Record a **purchase** when goods arrive from supplier; stock updates from received quantity.”*
- Wrong: *“Use stock entry for normal buying.”* (that splits document and supplier ledger in other ERPs)
- Honest gap: *“Opening stock and count corrections: import, first purchase, or **stock adjustment** (planned).”*

**Anti-pattern:** Telling staff to create a **fake purchase** to fix physical count — breaks purchase book and supplier balance. Build adjustment before scale.

Full GTM notes: [GTM_NEPAL.md](GTM_NEPAL.md).

---

## 6. Genericization without bloat

| Change | Why | When |
|--------|-----|------|
| Tenant categories, generic labels | Second dealer is not ice cream | **Now** |
| Optional MRP column on bill | Grocery/hardware may not use MRP | P1 setting |
| Feature flags in `tenant_settings` | Turn off scheme/capital until built | P1 |
| Keep single godown stock | Matches 90% Nepal wholesalers | Always until proven otherwise |
| Keep purchase-driven stock IN | Supplier invoice + payable stay one document | Always for v1 |
| Keep RPC money/stock model | Already correct for trust | Always |

---

## 7. Architecture tied to pains (not refactor for sport)

| Pain | Technical fix |
|------|----------------|
| App slow with history | Paginate `sales_bills`; don’t use full bundle for lists |
| Export | `lib/export/` + server ZIP; not `JSON.stringify(allSales)` |
| ~~Fake scheme~~ | `insertSchemeLive` + `syncSchemeFreeLines` on sale; Home **On scheme** filter |
| Maintainability | Split `domainLive` when touching export/pagination anyway |

---

## 8. Anti-patterns for this product

- Shipping **new menus** that do not persist (worse than hidden).
- **10 Phase 2 modules** at 20% each — finish export + trust first.
- **Enterprise ERP** scope (GL, payroll, manufacturing).
- **Per-vertical repos** — use tenant config instead.
- Prioritizing **barcode / van / AI** before accountant can export last month’s sales.

---

## 9. How this doc connects to other lists

| Doc | Role |
|-----|------|
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Checkbox implementation (Phase 0–2, deferred) |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | Deferred items: effort, touchpoints, acceptance (INV-1, INV-2, …) |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Technical export design |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Naming before rebrand |
| [GTM_NEPAL.md](GTM_NEPAL.md) | ICP, pricing, stock model, Nepal E-Billing positioning |
| **This file** | **Why** we build something — client pain order |

When adding a BACKEND-TODO item, ask: **Which row in §2 does this fix?** If none, defer.

---

## 10. Success metrics (practical)

| Metric | Meaning |
|--------|---------|
| Pilot dealer bills daily without Excel duplicate | Core loop |
| Accountant accepts monthly CSV export | Trust |
| Second tenant onboarded in &lt; 2 days (import + categories) | Generic platform |
| Zero screens that toast “saved” without DB write | Integrity |
| p95 bill save &lt; 3s on 4G | Mobile reality |

---

*Review this doc after each pilot visit or support call — add rows to §2, don’t inflate §4.*
