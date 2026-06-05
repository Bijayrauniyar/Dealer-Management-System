# Product roadmap — Phase 0 → Phase 3

**Navigate:** [Docs hub](README.md) · **[First launch checklist](FIRST_LAUNCH.md)** · [Backlog](BACKLOG.md) · [GTM Nepal](GTM_NEPAL.md) · [Product evolution](PRODUCT_EVOLUTION.md) · [Export spec](DATA_EXPORT_SPEC.md) · [Backend checklist](backend/BACKEND-TODO.md)

**Status:** Living launch plan. **Phase 0 complete (2026-05-26)** — Tier **A + B + C** signed off (prod migrations **0025–0026**, manual QA §3.0c, deploy). **Tier D** → Phase 1 per [BACKLOG.md](BACKLOG.md).

**Last updated:** 2026-05-26 · [Phase 0 sign-off](PHASE0_SIGNOFF.md)

---

## 1. Who we sell to (all phases)


| Item                 | Decision                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Market**           | Nepal — wholesalers, dealers, stockists                                             |
| **ICP (Phase 0)**    | 1–5 staff, **1 godown**, billing at office/warehouse, 50–300 retailers              |
| **Verticals**        | FMCG-style (ice-cream pilot → beverages, snacks, general)                           |
| **Not now**          | 20+ van salesmen, offline hills, pharma batch, brand SFA, IRD e-filing              |
| **Pricing (launch)** | **NPR 3,000 / year** per company (one package); higher tiers later after first shops |
| **Core pitch**       | VAT sales invoice + purchase from supplier + stock + credit + **CSV for accountant** |


**Locked for Phase 0:** No **sales order** or **purchase order** workflows — only **sales invoice** and **purchase invoice** entry. Orders → Phase 1.

---

## 2. Already shipped (demo today)

Use this list in sales demos. **Tier A + Tier B** items below are shipped unless marked Tier C / Phase 1.


| Area | Shipped |
|------|---------|
| Auth, tenant, **tabbed Settings** (Business · Bills & VAT · Stock · Export) | ✓ |
| Header **Settings** gear + notifications bell | ✓ |
| Sales bill — new/edit, VAT, schemes, print/PDF; **Tax Invoice** when VAT registered | ✓ |
| Purchase — supplier invoice, VAT excl/incl, purchase bill view | ✓ |
| Stock — on hand · opening · purchased · adjusted; adjustment toggle | ✓ |
| Product **categories**; **opening qty** on form | ✓ |
| Customers, suppliers, payments, returns, damage, expense, capital | ✓ |
| Home KPIs, overdue; **paginated** sales load (PERF-0) | ✓ |
| Export — registers + VAT summary + **partial** backup ZIP | ✓ |
| Branding — **BikriKhata** ([bikrikhata.com](https://bikrikhata.com)) | ✓ |
| Nav | Bottom **Home · Customers · Inventory · Reports** + **+**; **☰** drawer (Masters / Entry / Reports / Support) — **Tier C** |
| DB oversell | Blocked in RPC (**0024**) — **Tier B done** |
| Credit limit | Warning on sale (**CRED-0**) — **Tier B done** |


**Touchpoints:** `AppShell.tsx`, `SettingsPage.tsx`, `ExportSection.tsx`, `productBrand.ts`, `BillLetterhead.tsx`.

---

## 3. Phase 0 — First launch (sell easily)

**Goal:** First 10–20 paying tenants — trustworthy godown loop + accountant export + professional app shell.

### 3.0 Priority tiers (what to ship when)

Use tiers to time-box launch: **Tier A complete** — add **B** before ~10 tenants; **C** when you have slack. **Tier D** is explicitly **not** Phase 0 — see [§3.6](#36-tier-d--not-phase-0) and [§7 Tier D map](#7-tier-d--later-phases-1-3).

| Tier | Meaning | When |
|------|---------|------|
| **A — Must** | Deal-breaker for new paying wholesaler + CA | **Done** (2026-05-26) |
| **B — Should** | Trust, scale, fewer support fires | Before ~10 tenants |
| **C — Nice** | Polish & retention | **Done** (2026-05-26) — signed off prod + QA + deploy |
| **D — Later** | Wrong buyer or too heavy for solo launch | Phase 1–3 only |

#### Tier A — Must (Phase 0) — **complete (2026-05-26)**

Signed off: migrations **0019–0023**, `deploy:check`, `e2e:export`, manual QA — [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md).

| ID | Item | Status |
|----|------|--------|
| **EXP-0** | Export hub + partial backup ZIP | **Done** · full ZIP → IMP-0 |
| **EXP-0a–d** | Sales/lines, purchase register, outstanding, products, stock, VAT summary | **Done** |
| **BRAND-0** | BikriKhata rebrand (login, PWA, `productBrand.ts`) | **Done** |
| **CAT-0** | Tenant-configurable product categories | **Done** |
| **STK-0** | Opening qty on product form | **Done** |
| **STK-0b** | Stock page: on hand · opening · purchased; category filter | **Done** |
| **STK-0c** | Copy: stock IN = Purchase; opening on product | **Done** |
| **STK-0d–f** | Stock adjustment + Settings toggle + adjusted in `v_stock` | **Done** |
| **PERF-0** | Paginate/filter sales; lighter session load | **Done** |
| **VAT-0** | Print title **Tax Invoice** when VAT registered | **Done** |
| **NAME-0** | Labels: **Sales invoice** / **Purchase invoice** | **Done** |
| **F4** | Copy sweep (generic forms) | **Done** |
| **UI-0.8 / UI-0.11** | Header Settings + tabbed Settings (incl. Export, Stock) | **Done** |

**Also:** list page size (0022), bill address toggle (0023), IRD letterhead, header Online pill removed.

#### Tier B — Should (Phase 0) — **signed off (2026-05-26)**

| ID | Item | Status |
|----|------|--------|
| **INV-1** | DB oversell guard (`0024`) | **Done** |
| **CRED-0** | Credit limit warning (no block) | **Done** |
| **VAT-0b** | Settings validation when VAT registered | **Done** |
| **UI-0.12** | Notifications QA | **Done** |
| **UI-0.9** | `PageBackLink` on inner pages | **Done** |
| **UI-0.8 / UI-0.11** | Header Settings + tabbed Settings | **Done** (Tier A) |

#### Tier C — Nice (Phase 0) — **signed off (2026-05-26)**

Prod migrations **0025–0026**, manual QA §3.0c, deploy — [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md).

| ID | Item | Status |
|----|------|--------|
| **UI-0.1–0.7, UI-0.10** | Shell: drawer + tabs (Home · Customers · Inventory · Reports) + centre +; `/app/more` → Reports | **Done** |
| **UI-0.6** | `/app/support` Help screen | **Done** |
| **UI-0.13** | Platform support (`PLATFORM_SUPPORT`); **Help & support** via menu only | **Done** |
| **VAT-0c** | Customer PAN/VAT optional (`0026`) + print | **Done** |
| **F14** | Bill detail: primary **Share** (PDF via system share sheet) | **Done** |
| **ONB-0** | [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md) | **Done** |

#### Tier A — Already shipped (maintain only)

No Phase 0 build — keep working in demo: sales/purchase loop, credit, payments, schemes, purchase VAT, print/PDF, home overdue (see [§2](#2-already-shipped-demo-today)).

---

### 3.1 App shell & navigation — **Tier C** (Tier A: UI-0.8, UI-0.9 only)


| ID          | Task                                                                                             | Acceptance                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-0.1**  | **Professional app shell** — consistent layout, spacing, typography on main routes               | Feels like a product, not a prototype                                                                                                        |
| **UI-0.2**  | **Side menu (drawer)** — grouped sections, e.g. **Masters**, **Entry**, **Reports**, **Support** | User finds features without buried “More” only                                                                                               |
| **UI-0.3**  | **Masters** section links                                                                        | **Products**, Customers, Suppliers, Stock (inventory)                                                                                        |
| **UI-0.4**  | **Entry** section links                                                                          | New sales invoice, purchase invoice, payment, return, damage, **stock adjustment** (when enabled), expense, supplier payment, daily cash, schemes |
| **UI-0.5**  | **Reports** section links                                                                        | Home/dashboard, outstanding/overdue, period sales — plus **Export hub** when built                                                           |
| **UI-0.6**  | **Support** section                                                                              | In-app help: product support **phone**, **email**, **WhatsApp** (from `tenant_settings` or app constants); short “how to get help” copy      |
| **UI-0.7**  | **Sticky bottom tab bar** (primary daily use)                                                    | **Home** · **Customers** · **Inventory** (stock/products) · **Reports** (or More → reports) — keep centre **+** for quick entry where useful |
| **UI-0.8**  | **Header (right):** **Settings** icon + **Notifications** bell (keep/fix bell)                   | Settings reachable without digging in More                                                                                                   |
| **UI-0.9**  | **Consistent back button** on inner pages                                                        | Predictable navigation from forms and detail screens                                                                                         |
| **UI-0.10** | Refactor or retire redundant **More** hub if side menu + tabs cover routes                       | No duplicate dead ends                                                                                                                       |


**Current baseline:** `app/src/components/layout/AppShell.tsx` — Home/More tabs, + sheet, bell only.

### 3.2 Settings & notifications — **Tier B** (UI-0.11 also **Tier A** minimum); UI-0.13 **Tier C**


| ID          | Task                                                  | Acceptance                                                                                                                                        |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-0.11** | **Settings: tabbed categories** — not one long scroll | Suggested tabs: **Business** · **Bills & VAT** · **Stock & alerts** · **Export & backup** · **Support** (contact display/edit if tenant-specific) |
| **UI-0.12** | **Notifications: verify & fix**                       | Overdue + low-stock alerts match Settings days/thresholds; links open correct screens; empty state clear; document if still computed (not DB)     |
| **UI-0.13** | Optional: store support contact in `tenant_settings`  | Owner can set shop helpline; app defaults for platform support                                                                                    |


### 3.3 Trust & accountant — **Tier A** (EXP-0*, BRAND-0, CAT-0, PERF-0); **INV-0 Tier B**


| ID          | Task                                                          | Ref                                                            |
| ----------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| **EXP-0**   | Export hub + CSV registers + backup ZIP                       | [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md), DEFERRED **EXP-1** |
| **EXP-0a**  | Sales register + sales lines (date range)                     | Accountant sales book                                          |
| **EXP-0b**  | Purchase register (date range)                                | Purchase / input VAT book                                      |
| **EXP-0c**  | Customer outstanding, products, stock snapshot                |                                                                |
| **EXP-0d**  | **VAT period summary** CSV (output VAT − input VAT for range) | Explain in demo: helper for CA, not IRD filing                 |
| **BRAND-0** | Generic product rebrand (login, PWA, package name)            | [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md)             |
| **CAT-0**   | Tenant-configurable product categories                        | Remove hardcoded ice-cream list                                |
| **PERF-0**  | Paginate/filter sales — lighter home/session load             | Stop full `fetchDomainBundle` history every visit              |
| **INV-0**   | DB oversell guard (**INV-1**)                                 | [DEFERRED_WORK.md](DEFERRED_WORK.md)                           |


### 3.4 Stock & invoices — **Tier A** (STK-0*, NAME-0, VAT-0); **VAT-0b Tier B**; **VAT-0c, CRED-0, ONB-0 Tier C / B**


| ID         | Task                                                                                  | Acceptance                                      |
| ---------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **STK-0**  | **Opening qty** on product form → `opening_stock`                                     | Go-live without fake purchase                   |
| **STK-0b** | Stock page: **On hand · Opening · From purchases**; search; filter by **category**    | Owner sees stock truth                          |
| **STK-0c** | Copy: stock IN = **Purchase**; opening on product                                     | No fake purchase for opening                    |
| **STK-0d** | **Manual stock adjustment** — RPC + UI (product, +/- qty, date, reason); no supplier ledger | Count correction / samples without fake purchase |
| **STK-0e** | **Settings toggle** `allow_stock_adjustment` (or `stock_in_mode`: purchase-only vs purchase+adjustment) | When off: hide adjustment entry; copy says stock IN = Purchase only |
| **STK-0f** | Extend **`v_stock`** (or stock page) to show **Adjusted** qty when movement table used | Aligns with opening + purchased breakdown       |
| **NAME-0** | UX labels: **Sales invoice** / **Purchase invoice** (menus, quick actions, lists)     | Aligns with dealer language                     |
| **VAT-0**  | Print title **Tax Invoice** when VAT registered; else Invoice/Bill                    | [billDisplay.ts](../app/src/lib/billDisplay.ts) |
| **VAT-0b** | Settings validation: address + tax id when VAT bills                                  |                                                 |
| **VAT-0c** | Optional customer VAT on master + print (small) — **Tier C**                          | B2B                                             |
| **CRED-0** | Credit limit: enforce or hide — **Tier B**                                            |                                                 |
| **ONB-0**  | Onboarding doc — **Tier C**                                                           | 10 products + opening, 5 customers, 1 purchase, 1 sale, export sample |


**Effort (solo):** STK-0d–0f ≈ **3–7 days** (migration `stock_adjustments`, `record_stock_adjustment`, view update, form, Settings flag, e2e).

**Not Phase 0:** sales/purchase **orders** → **Phase 1**.

**Implementation notes (STK-0d):**

- New table e.g. `stock_adjustments` (tenant_id, adjustment_date, product_id, qty signed, reason, notes) — mirror `damages` pattern in `0003_phase1_operations.sql`.
- Update `v_stock` to include `coalesce(adj.qty, 0)` in closing formula.
- Do **not** use fake **purchase** for count fixes (breaks supplier payable + purchase VAT book).
- Export of adjustments can ship in EXP-0 or a follow-up column in stock snapshot.

### 3.5 Phase 0 — Fix / change checklist (by tier)

| Tier | IDs |
|------|-----|
| **A** | F1 Export (EXP-0*), F2 Rebrand, F3 Categories, F4 Copy sweep, F5 Perf, F8 NAME-0, F9 VAT-0, F10 Settings icon + tabs (min), F12 STK-0a–c, F16 STK-0d–f |
| **B** | F6 CRED-0, F7 INV-0, F11 UI-0.12 |
| **C** | F13 UI shell full (UI-0.1–0.10), F14 WhatsApp share, F15 ONB-0 |

### 3.6 Tier D — Not Phase 0

**Do not add to Phase 0** for launch (→ Phase 1–3 per [§7](#7-tier-d--later-phases-1-3)):

Sales orders, purchase orders, invoice photo attachments, brands master, custom units catalog, inline `+` on every form, full IRD e-billing / IRD API, van/GPS/route, offline rep sync, Tally/Busy bridge, multi-warehouse, pharma batch/FEFO, AI owner brief, supplier scheme pass-through (SUP-1), live notifications DB + SMS (2-A).

### 3.7 Phase 0 — Suggested build order

```text
Track 1 — Tier A (launch gate): **complete**
  1. ~~Export P0 (EXP-0*) + Settings Export tab~~
  2. ~~Rebrand + categories + copy sweep~~
  3. ~~Opening stock + stock columns + stock adjustment + toggle~~
  4. ~~Perf (PERF-0) + Tax Invoice + invoice naming~~
  5. ~~Minimal UI: Settings icon + tabbed Settings~~

Track 2 — ~~Tier B~~ **done (2026-05-26):**
  6. ~~INV-1 + credit warn + VAT settings validation + notifications QA + PageBackLink~~

Track 3 — Tier C (polish):
  7. Full side menu + bottom tabs + Support section + onboarding doc + WhatsApp prominence
```

**Timelines (solo, indicative):**

| Scope | Weeks |
|-------|-------|
| **Tier A only** | ~3–5 |
| **Tier A + B** | ~5–7 |
| **Full Phase 0 (A + B + C)** | ~6–9 |

### 3.8 Phase 0 — Demo script (30 min)

Settings (stock mode) → Product (+ opening) → Purchase invoice → Sales invoice → Payment → Print → Stock → **Stock adjustment** (if enabled) → Export sample CSV.

---

## 4. Phase 1 — Retain & expand (after first paying tenants)

**Mostly Tier D items** from launch, plus depth on Phase 0 exports.

| Theme               | Items                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Stock**           | Adjustment history UI; export register for adjustments; optional bulk opening import           |
| **Orders / field**  | [§4.1](#41-tier-d--field-sales-orders--ird-books-phase-1) — **1.0** SF-0 or orders; **1.1** partial convert, salesman login, PO; **van → Phase 3** |
| **Onboarding**      | Light CSV import optional in Phase 1; **full import/restore → Phase 2** (**IMP-1**, **IMP-2**)     |
| **UX**              | **UI-1** symmetric chrome ([UI_CONSISTENCY_PLAN.md](UI_CONSISTENCY_PLAN.md) — `patterns.tsx`, lists/forms/buttons); inline `+` create related data on key forms (category, customer, supplier while on product/sale) |
| **Master data**     | Brands; optional units catalog; stock filters by brand/supplier                                  |
| **Categories**      | **CAT-1** parent/child (2-level) when needed — [DEFERRED_WORK.md](DEFERRED_WORK.md)              |
| **Documents**       | Attach image/PDF to sales & purchase invoices                                                    |
| **Trust**           | Bill edit history UI; `returns.bill_id`; live **notifications** table (2-A in data-model)        |
| **Commercial**      | Customer price tier; simple roles (owner vs billing staff)                                       |
| **Stock integrity** | INV-2 stock as-of bill date (if backdating pain)                                                 |
| **Export P1**       | Single `.xlsx` accountant pack; expenses/damages/returns registers                               |
| **Nav P1**          | Further polish; delivery note from invoice                                                       |

### 4.1 Tier D — Field sales, orders & IRD books (Phase 1)

**Not Phase 0.** Build only after Phase 0 Tier A ships and a tenant qualifies as **light field** (below).

**Reference pattern:** Desktop/cloud ERPs (e.g. Sigma): **Sales Order** + **Order taken by** + **Invoice status** (NEW / INVOICED) → **Sales Invoice**.

#### Who this is for (qualify before building)

| Segment | Field sales? | What to sell | Phase |
|---------|--------------|--------------|-------|
| **Godown-only** small dealer | 0–1; bill at warehouse | Phase 0 only — direct **sales invoice** | **0** |
| **Light field** (2–5 reps take orders; godown bills) | Yes | Phase **1.0** (min) or **1.1** (full Sigma-lite) | **1.0 / 1.1** |
| **Heavy field** (10+ vans, beat, offline hills) | Yes | Defer — **van / visit module** | **3** |

**Sales questions:** (1) Orders before bill? (2) Track by salesman? (3) Partial deliveries / multiple bills per order?  
If all **no** → do not build orders; optional **SF-0** (salesman on invoice only) is enough.

**Pricing:** Stay **per company** (launch **NPR 3k/year**), not per salesman seat.

#### Phase 1.0 — Light field minimum (build first when 1–2 clients ask)

Cheaper path before full order module. Pick **one** track:

| Track | IDs | What | Effort (solo) |
|-------|-----|------|----------------|
| **A — Smallest** | **SF-0**, **RPT-1** | `salesmen` master + **salesman on sales invoice** (no order table); manager report: sales by salesman | **~3–5 days** |
| **B — Sigma-lite core** | **ORD-1**, **ORD-2** (full convert only), **ORD-3** (master dropdown), **ORD-4**, **RPT-1** | Sales order list; convert whole order → one invoice; order taken by name; open vs fully invoiced | **~10–14 days** |

| ID | Feature | Acceptance |
|----|---------|------------|
| **SF-0** | Salesman master + on **sales invoice** | Optional `salesman_id` on `sales_bills`; filter/report sales by person — **no** sales_order tables |
| **ORD-1** | Sales order (not bill); searchable list | Status at minimum: **Open** · **Fully invoiced** (partial → 1.1) |
| **ORD-2** | Convert order → **sales invoice** | Phase 1.0: **full** convert only; 1.1 adds **partial** per line/qty |
| **ORD-3** | Order taken by | **`salesmen` master + dropdown** on order or invoice (Track B) |
| **ORD-4** | Manager reports | Orders and/or sales by salesman; conversion list (open / invoiced) |
| **RPT-1** | Sales & purchase **period reports** | Same columns as Phase 0 **EXP-0** registers — CA / IRD **working papers**, not IRD API |
| **RPT-1b** | On-screen sales book / purchase book (optional) | Printable month view before CSV export |

**Stock (1.0):** Always deduct on **sales invoice**, never on draft order.

#### Phase 1.1 — After 1.0 is used in production

| ID | Feature | Acceptance |
|----|---------|------------|
| **ORD-2b** | **Partial** convert order → invoice(s) | `qty_ordered` vs `qty_invoiced`; status **Partially invoiced** |
| **ORD-3b** | Salesman **login** | Auth user per rep; rep creates orders (or invoices) on phone; manager dashboard by user |
| **ORD-5** | **Purchase order** → purchase invoice | Mirror sales-order pattern |
| **ORD-6** | Stock **reservation** on open order (optional) | Pair with INV-1; only if oversell on converted bills is a reported problem |
| **RPT-1c** | Export P1 `.xlsx` accountant pack | Multi-sheet; damages/returns registers |

**Effort (solo, incremental on 1.0):** ORD-2b ~3–5 days; ORD-3b ~4–7 days; ORD-5 ~5–8 days; ORD-6 ~2–4 days.

#### Phase 3 — Van / route / visit (advanced — not 1.1)

Do **not** bundle into sales orders. Separate story when client prepays or churns for van ERP:

Beat plan, visit checklist, van stock, GPS (optional), offline sync, load sheet — see [§6](#6-phase-3--prepay-or-dedicated-client-only).

**IRD / government:** Phase 0 **EXP-0** = month data for CA. **RPT-1** = readable books. Certified IRD e-billing / XML → **Phase 3**.

**Defer (Sigma extras unless asked):** Quotation, delivery note module, job card, loyalty, POS.

**Full Sigma-lite bundle (Track B + all 1.1):** ~**3–5 weeks** solo after Phase 0.

---

## 5. Phase 2 — Upsell (3–9 months)

**Tier D — growth** (prepays, retention, upsell).

| Theme                | Items                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Backup & import**  | **IMP-0** full tenant ZIP · **IMP-1** CSV import per entity · **IMP-2** restore / resume — [DEFERRED_WORK.md](DEFERRED_WORK.md), [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) |
| **Categories**       | **CAT-2** ERP-style category tree (3+ levels) — after CAT-1    |
| **AI (rules-first)** | Daily owner brief, credit risk list                             |
| **Supplier**         | SUP-1 supplier scheme → customer scheme pass-through           |
| **Comms**            | SMS/WhatsApp overdue reminders                                 |
| **Reporting**        | Richer period reports; async large export; `export_runs` audit |
| **Integrations**     | Nepali BS date on bills if buyers require                      |
| **Platform**         | Multi-user tiers; SUP-1; purchase PDF tweaks                   |


---

## 6. Phase 3 — Prepay or dedicated client only

**Tier D — enterprise / wrong ICP for Phase 0.** Includes **van / route / visit** (advanced field force) — **not** Phase 1.1.

| Theme | Items |
|-------|--------|
| **Van / route** | Beat planning, visit checklist, van stock, load/out, optional GPS |
| **Offline** | Rep app offline sync (hills / poor network) |
| **Scale** | Multi-warehouse, barcode, pharma batch/FEFO |
| **Integrations** | Tally bridge, IRD certified e-billing API |
| **Competitive** | Full SFA parity (Bizom / Delta / MrSolution-class) |

---

## 7. Tier D — Later phases (1–3)

Quick map of **Tier D** (not Phase 0) to when to build.

| Tier D item | Phase |
|-------------|-------|
| Light field: salesman on invoice only (SF-0) + RPT-1 | **1.0** — [§4.1](#41-tier-d--field-sales-orders--ird-books-phase-1) |
| Sales order + convert + salesman dropdown + reports (ORD-1–4, RPT-1) | **1.0** — §4.1 Track B |
| Partial convert, salesman login, PO, stock reserve (ORD-2b, 3b, 5, 6) | **1.1** — §4.1 |
| Van, beat, visit, offline field force | **3** — not 1.1 |
| CSV import; inline `+` on forms; brands; units; invoice photos | **1** |
| Parent/child categories (**CAT-1**, 2-level) | **1** — [DEFERRED_WORK.md](DEFERRED_WORK.md) |
| Category tree UI (**CAT-2**) | **2** |
| Full tenant backup (**IMP-0**) | **2** |
| CSV import hub — products, customers, suppliers, settings, stock (**IMP-1**) | **2** |
| Restore from backup / resume same point (**IMP-2**) | **2** |
| Bill history; `returns.bill_id`; live notifications + SMS; INV-2; customer price tier; roles | **1** |
| `.xlsx` accountant pack; adjustment export register; delivery note | **1** |
| AI brief, credit risk; SUP-1; richer reporting; BS date on bills | **2** |
| Van, offline, barcode, multi-godown, IRD certify API, Tally, SFA parity | **3** |

---

## 8. Cross-reference IDs


| Doc                                                                              | Use for                                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [DEFERRED_WORK.md](DEFERRED_WORK.md)                                             | EXP-1, INV-1, INV-2, BRAND-1, SUP-1 — effort & acceptance |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md)                                       | CSV columns, ZIP layout                                   |
| [GTM_NEPAL.md](GTM_NEPAL.md)                                                     | ICP, pricing, VAT field audit, stock model                |
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md)                                     | Pain-first “why”                                          |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md)                               | Implementation checkboxes                                 |
| [backend/phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) | Manual QA after Phase 0 ships                             |


---

## 9. Revision log


| Date       | Change                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | **IMP-0/1/2** (Phase 2): complete backup ZIP, per-entity import, restore/runbook — [DEFERRED_WORK.md](DEFERRED_WORK.md) |
| 2026-05-26 | **CAT-1** / **CAT-2** deferred: flat categories in Phase 0; parent/child Phase 1; tree UI Phase 2 |
| 2026-05-26 | Phase 1 split **1.0** (SF-0 or ORD full convert + salesman master) vs **1.1** (partial convert, salesman login, PO, reserve); van → Phase 3 |
| 2026-05-26 | Phase 1 §4.1: Sigma-style sales order, salesman, reports (Tier D) |
| 2026-05-26 | Phase 0 priority **Tier A / B / C** + **Tier D** map (§3.0, §3.6, §7); build order by tier |
| 2026-05-26 | Phase 0: manual stock adjustment + Settings toggle (STK-0d–0f, ~3–7 days); moved from Phase 1 |
| 2026-05-26 | Initial roadmap: Phase 0–3; UI shell (side menu, tabs, Settings/Notifications header, Support section) added to Phase 0 |


