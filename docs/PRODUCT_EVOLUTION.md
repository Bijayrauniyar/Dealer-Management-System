# Product evolution — client pain points first

**Navigate:** [Docs hub](README.md) · [Backend checklist](backend/BACKEND-TODO.md) · [Data export spec](DATA_EXPORT_SPEC.md) · [LLM context](LLM_CONTEXT.md)

**Purpose:** Evolve from the Havmor ice-cream pilot into a **generic Nepal distributor platform** — without a long “feature count” roadmap. Every item below ties to a **real user pain** or a **broken/half-built screen** today.

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
| **Login says Havmor / DealerOS** | Not credible for non-Havmor dealer | **P0** for 2nd tenant | [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) rebrand |
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

These are **valid research topics** but **not** blocking Havmor-style daily use:

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

### Now (current pilot + next 4–8 weeks)

Only items that **remove lies**, **restore trust**, or **unblock second dealer**.

| # | Work | Client pain solved |
|---|------|-------------------|
| ~~1~~ | ~~Scheme page + sales apply~~ | **Done** — save + auto free qty on bill |
| 1 | **Export P0** — products, sales/purchase registers, outstanding, backup ZIP | Accountant + owner backup |
| 2 | **Configurable product categories** + generic copy sweep (remove “Havmor” in forms) | Second tenant onboarding |
| 3 | **Product rebrand** (login, PWA) | Sell to non-Havmor dealers |
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

---

## 5. Genericization without bloat

| Change | Why | When |
|--------|-----|------|
| Tenant categories, generic labels | Second dealer is not ice cream | **Now** |
| Optional MRP column on bill | Grocery/hardware may not use MRP | P1 setting |
| Feature flags in `tenant_settings` | Turn off scheme/capital until built | P1 |
| Keep single godown stock | Matches 90% Nepal wholesalers | Always until proven otherwise |
| Keep RPC money/stock model | Already correct for trust | Always |

---

## 6. Architecture tied to pains (not refactor for sport)

| Pain | Technical fix |
|------|----------------|
| App slow with history | Paginate `sales_bills`; don’t use full bundle for lists |
| Export | `lib/export/` + server ZIP; not `JSON.stringify(allSales)` |
| ~~Fake scheme~~ | `insertSchemeLive` + `syncSchemeFreeLines` on sale; Home **On scheme** filter |
| Maintainability | Split `domainLive` when touching export/pagination anyway |

---

## 7. Anti-patterns for this product

- Shipping **new menus** that do not persist (worse than hidden).
- **10 Phase 2 modules** at 20% each — finish export + trust first.
- **Enterprise ERP** scope (GL, payroll, manufacturing).
- **Per-vertical repos** — use tenant config instead.
- Prioritizing **barcode / van / AI** before accountant can export last month’s sales.

---

## 8. How this doc connects to other lists

| Doc | Role |
|-----|------|
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Checkbox implementation (Phase 0–2, deferred) |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | Deferred items: effort, touchpoints, acceptance (INV-1, INV-2, …) |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Technical export design |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Naming before rebrand |
| **This file** | **Why** we build something — client pain order |

When adding a BACKEND-TODO item, ask: **Which row in §2 does this fix?** If none, defer.

---

## 9. Success metrics (practical)

| Metric | Meaning |
|--------|---------|
| Pilot dealer bills daily without Excel duplicate | Core loop |
| Accountant accepts monthly CSV export | Trust |
| Second tenant onboarded in &lt; 2 days (import + categories) | Generic platform |
| Zero screens that toast “saved” without DB write | Integrity |
| p95 bill save &lt; 3s on 4G | Mobile reality |

---

*Review this doc after each pilot visit or support call — add rows to §2, don’t inflate §4.*
