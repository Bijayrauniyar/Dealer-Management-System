# Nepal GTM — product, positioning, pricing (working doc)

**Navigate:** [Docs hub](README.md) · [**Launch roadmap Phase 0–3**](PHASE_ROADMAP.md) · [Product evolution (build order)](PRODUCT_EVOLUTION.md) · [Deferred work](DEFERRED_WORK.md) · [Export spec](DATA_EXPORT_SPEC.md) · [Naming brief](PRODUCT_NAMING_BRIEF.md)

**Status:** Living document for strategy discussions. Update after customer interviews, pilot feedback, or pricing decisions.

**Last updated:** 2026-05-26

---

## 1. Summary

| Item | Decision (draft) |
|------|------------------|
| **Market** | Nepal — small & medium **dealers, distributors, wholesalers** |
| **Origin** | Built for **ice-cream dealer** pilot; selling to **generic FMCG-style** wholesalers |
| **Model** | **Monthly SaaS** (per company, not per salesman) |
| **Price band** | **NPR 2,000–5,000 / month** (founding → standard tiers) |
| **Team** | Solo founder — prioritize revenue features over enterprise scope |
| **Not competing on (yet)** | Van/route ERP, offline-first hills, brand-mandated SFA (Bizom), full Tally replacement |

---

## 2. Positioning

### One-line pitch

> **Nepal wholesaler SaaS** — bill with VAT, track stock and customer udhar, record supplier purchases with real invoice numbers — without paying for van-route ERP you do not use.

### Website-style line

> Stop running your wholesale business on notebooks. Bill with VAT, track stock and customer udhar, record supplier invoices — from NPR 2,500/month.

### Who we are

| We are | We are not |
|--------|------------|
| Office + warehouse wholesaler (1–10 users) | 20+ field salesmen / van-only operation |
| Cloud + phone-friendly PWA | Heavy desktop install + local server |
| End-to-end **bill → stock → udhar → purchase → pay** | Accountant-only Tally substitute |
| Fair **monthly per company** | Per-salesman lakhs/year (Bizom / FieldAssist) |

### Closest competitors (Nepal context)

| Style | Examples | BikriKhata vs them |
|-------|----------|----------------|
| **Local Nepal DMS/ERP** | MrSolution, Swastik, CrossOver, BISage | Same buyer; we win on **simpler UX + cloud + modern purchase/VAT bill**; they win on **offline/van/mature IRD depth** until we ship |
| **India desktop (via partners)** | BUSY, Marg, Tally | Tally = CA habit; BUSY/Marg = FMCG depth; we are **lighter + Nepal-first story** |
| **Brand SFA** | Bizom, FieldAssist, BeatRoute | Wrong buyer — brands pay, not small dealer |
| **IRD / NFRS accounting** | [Nepal E-Billing](https://nepalebilling.com/) | Compliance + books; we **complement** (ops + registers export), not replace IRD certify in v1 |

See also competitor landscape notes from strategy sessions (India/Nepal desktop + cloud DMS).

---

## 3. Ideal customer profile (ICP)

### Primary ICP — sell here first (first 20 paying tenants)

**“Nepal wholesaler / dealer, 1–5 staff, 50–300 active retailers, bills from shop or warehouse.”**

| Attribute | Range |
|-----------|--------|
| Staff | 1–5 users (owner + 1–2 billing + maybe warehouse) |
| Godowns | 1 (maybe 2 later) |
| Retailers served | 50–300 |
| Billing | Mostly **office/warehouse**; not 30 van salesmen offline all day |
| Verticals | Ice-cream → beverages, snacks, confectionery, general FMCG stockist |

**Daily pains we solve**

- Wrong stock vs physical
- Lost **udhar** (who owes what)
- Slow or messy **VAT bills**
- Supplier purchase vs **supplier invoice number** mismatch
- Accountant wants **Excel** for VAT month

### Secondary ICP (wave 2)

- 2 godowns, accountant on staff, 500+ bills/year → needs **export + pagination + import**

### Say no (for now)

| Segment | Why |
|---------|-----|
| 20+ field salesmen, van stock, offline-only mountains | MrSolution-style; not built yet |
| Pharma batch/FEFO/recall | BISage territory |
| Retail-only kirana (no wholesale purchases) | Overkill; Nepazon-class |
| FMCG **brand** wanting secondary sales control | Bizom buyer, different budget |

---

## 4. Fit: what BikriKhata has today

**Core loop (shipped):**

```text
Supplier purchase (+ invoice no., VAT excl) → stock ↑
  → Sale bill (VAT, schemes, print/PDF) → stock ↓
  → Customer payment (udhar) / Return / Damage
  → Supplier payment
  → Home: outstanding, overdue, stock
```

| Capability | Status | Notes |
|------------|--------|-------|
| Sales bill + print/PDF | Strong | MRP, discount, VAT from settings |
| Customer udhar + payments | Yes | FIFO payments |
| Purchase + supplier invoice no. | Yes | Immutable after save; bill view |
| Purchase VAT (excl + %) | Yes | Migration 0017 |
| Supplier payments | Yes | |
| Products (buy excl, sell optional) | Yes | |
| Schemes on sales (FOC lines) | Yes | `scheme_tracker` |
| Short receive on purchase | Yes | Invoice vs received qty |
| Stock view | Yes | `v_stock` |
| Settings (VAT %, markup, footer) | Yes | |
| Returns, damage, expense, capital | Yes | |
| **CSV export / backup** | **Partial** (Tier A — Settings → Export) | **IMP-0/1/2** full backup + import + restore → **Phase 2** — [DEFERRED_WORK.md](DEFERRED_WORK.md) |
| **White-label / non–ice-cream brand** | **Partial** | [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) |
| **Configurable categories** | **Yes** (flat list, `0019`) | **CAT-1** parent/child → Phase 1; tree UI → Phase 2 |
| **Paginated bills / fast home** | **Weak** | Medium dealer churn risk |
| **DB oversell guard** | **No** | [DEFERRED_WORK.md](DEFERRED_WORK.md) INV-1 |
| Van / route / offline | **No** | DB stubs only |

**End-to-end % for ICP:** ~**80%** product fit; ~**20%** gaps block **renewal** and **second vertical**.

### Stock model (purchase vs stock entry)

Many ERPs show **Purchase entry** and **Stock entry** as separate menus. They are different ideas; BikriKhata intentionally keeps **purchase as the main stock-IN path** for normal buying.

| | **Purchase entry** | **Stock entry / adjustment** (others) |
|---|-------------------|--------------------------------------|
| **When** | Goods bought from **supplier** with a bill | Opening balance, count correction, samples, transfer — **no** supplier invoice |
| **Money** | **Supplier payable**, VAT purchase book | Usually no supplier ledger |
| **Stock** | **Increases** by **received** qty on purchase lines | +/- qty without a purchase document |

**How BikriKhata calculates on-hand stock** (`v_stock`):

```text
closing = opening_stock
        + sum(purchase_items.qty)   ← from Purchase bills
        - sold + returned - damaged
```

| Stock change | In app today |
|--------------|--------------|
| Stock **in** from supplier | **Purchase** (`record_purchase` → `purchase_items`) |
| Stock **out** | **Sale** |
| Stock **up** (customer return) | **Return** |
| Stock **down** (breakage) | **Damage** |
| Opening balance | `products.opening_stock` in DB — **no dedicated UI**; use import or first purchase |
| Count correction without supplier | **Not built** — do not fake a purchase |

**Product decision (2026-05-26):**

- **Keep** purchase-driven stock for daily ops — links cost, supplier invoice no., and payable (see [PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md)).
- **Do not** copy full dual-menu ERP (purchase + stock + transfer) in v1.
- **Phase 0:** **Stock adjustment** (opening / count correction / sample) **without** supplier + Settings toggle (purchase-only vs adjustment) — see [PHASE_ROADMAP.md §3.4](PHASE_ROADMAP.md#34-stock--invoices-phase-0) (~3–7 days).
- **Sales pitch:** *“Stock comes in on **Purchase**; sales, returns, and damage update automatically.”*

**Stock page** (`/app/stock`): read-only view of on-hand; copy says updated on purchase and sale.

### Nepal E-Billing — what to adopt vs defer

[Nepal E-Billing](https://nepalebilling.com/) is **IRD/NFRS accounting**, not wholesaler DMS. Borrow **accountant expectations**, not the whole product.

| Adopt (align BikriKhata) | Defer |
|----------------------|-------|
| **Sales + purchase VAT registers** (CSV export) | IRD certified e-submit |
| Period **VAT summary** (output vs input) | NFRS chart of accounts / GL |
| Invoice fields complete (PAN/VAT, bill no., date) | Full fixed-asset depreciation |
| **Daily / period ops report** for owner | Recurring billing, online pay on invoice |
| Position: **“Works alongside Nepal E-Billing”** | Claim “replaces IRD system” |

Details: [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) §8 (registers, not IRD XML).

---

## 5. Nepal VAT / IRD compliance checklist

**Not legal advice.** Use this for product and sales decisions; confirm with a **CA** or IRD guidance for each tenant’s registration (PAN-only vs VAT registered vs IRD e-billing mandate).

### Two compliance levels

| Level | Meaning | BikriKhata |
|-------|---------|--------|
| **A — Good business invoice** | Printed/PDF bill with correct parties, serial no., dates, line totals, VAT math | **Mostly met** (`BillPrintView`, Settings, purchase bill) |
| **B — Full IRD / e-billing** | IRD-certified system, statutory books, often **submission** to IRD, NFRS accounts | **Not met** — complement [Nepal E-Billing](https://nepalebilling.com/) or CA workflow |

**Positioning (do not over-promise):**

> BikriKhata issues VAT-style sales and purchase documents and keeps stock and udhar in sync. Export **sales and purchase registers** for your accountant. It is **not** a replacement for IRD-certified e-billing until integrated.

### Sales tax invoice — field audit

Implemented in `app/src/components/app/BillPrintView.tsx`, `app/src/lib/billDisplay.ts`, Settings (`tenant_settings`).

| Field (typical Nepal VAT invoice) | BikriKhata | Notes |
|-----------------------------------|--------|-------|
| Seller legal / trading name | Yes | `sellerBillName` |
| Seller address, phone | Yes | Letterhead: **bill address lines 1–2** (short default); optional district line — [IRD_BILL_LETTERHEAD.md](IRD_BILL_LETTERHEAD.md) |
| Seller **VAT** or **PAN** | Yes | VAT if `vatRegistered` + number; else PAN (`sellerTaxId`) |
| **Serial bill / invoice no.** | Yes | `billNo` + tenant `invoice_prefix` |
| Invoice **date** (AD) | Yes | `sale.date` |
| **Bikram Sambat date** | Yes | `toMiti` on bill |
| Buyer name, address, phone | Yes | “To:” block |
| Buyer **PAN** | Yes | If on customer master |
| Buyer **VAT** number | **No** | P1 — add optional `customers.vat_number` for B2B |
| Line: description, qty, UOM | Yes | Particulars, qty, unit |
| Line: taxable amount | Yes | Line amount column |
| **HSN / commodity code** | No | Rare for small FMCG wholesaler; defer |
| Subtotal (taxable) | Yes | Subtotal row |
| Bill discount / terms | Yes | When used |
| **VAT % and VAT amount** | Yes | When VAT registered (`sale.vatRate`, `vatAmount`) |
| **Grand total** | Yes | |
| **Amount in words** | Yes | `amountInWords` |
| Custom footer | Yes | Settings `bill_footer` |
| Document title **“Tax Invoice”** | Yes | `billDocumentTitle` when VAT registered |
| IRD **QR / IRN / realtime submit** | No | Nepal E-Billing / IRD API — defer |

### Purchase side (input VAT)

| Field | BikriKhata | Notes |
|-------|--------|-------|
| Supplier invoice no. | Yes | `supplier_invoice_no` |
| Supplier name, address, VAT/PAN | Yes | `PurchaseBillView` |
| Line rate excl, VAT, amount incl | Yes | Migration 0017 |
| **Purchase VAT book (export)** | **No** | P0 — [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) |

### What blocks selling (by segment)

**Most small wholesalers (your ICP)** — operational, not IRD API:

| Blocker | Priority |
|---------|----------|
| No **CSV export** (sales / purchase / outstanding) | **P0** |
| Rebrand / generic categories | **P0** |
| App slow with many bills | **P0** |
| Stock oversell (RPC) | **P1** INV-1 |

**VAT-strict / accountant-led shops** — also need:

| Blocker | Priority |
|---------|----------|
| Period **VAT summary** export (output − input) | **P0** with registers |
| **Tax Invoice** title on print | **P1** product |
| Customer **VAT** on bill | **P1** |
| IRD **e-bill certification** | **Defer** unless customer mandates |

### Product changes (compliance pack — recommended order)

| # | Change | Effort |
|---|--------|--------|
| C1 | **Export P0** — sales VAT register, purchase VAT register, period summary | Large — EXP-1 |
| C2 | Settings validation — address + tax number before VAT bills | Small |
| C3 | Bill title **“Tax Invoice”** when `vatRegistered` | Small — `billDisplay.ts` |
| C4 | Optional **customer VAT number** on master + print | Small migration + UI |
| C5 | IRD API / certified e-billing | **Major** — separate project |

### vs competitors (compliance only)

| Product | Strength |
|---------|----------|
| [Nepal E-Billing](https://nepalebilling.com/) | IRD verified, NFRS, VAT/purchase books |
| Swastik / MrSolution | Long local IRD-certified positioning |
| **BikriKhata** | Wholesaler **ops** + purchase VAT split; **export + bill fields** to close gap |

---

## 6. Must-have features (table stakes)

Dealers will **not pay monthly** without these:

| # | Feature | BikriKhata | Priority |
|---|---------|--------|----------|
| 1 | VAT sales invoice + print/PDF | Yes | Maintain |
| 2 | Customer ledger + payment allocation | Yes | Daily hook |
| 3 | Supplier purchase → stock | Yes | Differentiator |
| 4 | Supplier payments | Yes | |
| 5 | Stock movement on sale/purchase/return/damage | Yes | + INV-1 trust |
| 6 | Outstanding / overdue visibility | Yes | Home screen |
| 7 | **Excel export** (sales, purchase, outstanding, products) | No | **P0** |
| 8 | **Generic branding** (not BikriKhata-only) | Partial | **P0** |
| 9 | **Configurable product categories** | No | **P0** |
| 10 | Works on mobile browser | PWA | Market it |
| 11 | Performance with many bills | Weak | **P0** pagination |

---

## 7. Unique selling points (USP)

### Non-AI (credible today)

1. **Supplier invoice-first purchases** — real invoice no., VAT excl/incl, locked after save, purchase bill layout ([PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md)).
2. **Schemes on sales** — buy-X-get-Y on bill (FMCG / ice-cream).
3. **Short receive** — invoice qty vs received on purchase.
4. **Cloud + simple UI** — vs legacy desktop ERP.
5. **Honest pricing** — NPR 2–5k **per company**, not × 50 salesmen.

### AI (solo-safe — phased)

Sell **concrete assistants** on **tenant data**, not “AI ERP”.

| Feature | Description | Tier |
|---------|-------------|------|
| **Daily owner brief** | Today: collected, new udhar, top overdue, low stock SKUs | Growth |
| **Udhar risk list** | Rank customers by overdue days × amount | Growth |
| **Stock mismatch helper** | Plain-language: purchases vs sales vs returns for one SKU | Growth |
| **Voice → product search** (optional) | Faster sale line entry | Later |
| **Photo → draft purchase** (optional) | OCR supplier bill → lines for review | Phase 2-B in data-model; **after export stable** |

**Do not build solo (yet):** full Nepali OCR bookkeeping, auto journals, open-ended chatbot on books.

---

## 8. Roadmap vs revenue (solo founder)

Aligned with [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) — **pain-first**, not feature count.

### Phase A — win first paying tenants (0–3 months)

| # | Work | Why it sells |
|---|------|----------------|
| A1 | **Export P0** (registers + backup ZIP) | Accountant adoption |
| A2 | **Rebrand** (tenant name, login, PWA) | Sell outside ice-cream |
| A3 | **Configurable categories** | Second vertical |
| A4 | **Paginated bills / lighter home** | Medium dealer scale |
| A5 | **Credit limit: enforce or hide** | Trust |
| A6 | **INV-1** DB oversell block | “Software stopped wrong sale” |
| A7 | **WhatsApp share bill PDF** | Daily UX, low effort |

### Phase B — retain & upsell (3–9 months)

| # | Work |
|---|------|
| B1 | Import templates (products, customers, opening stock) |
| B2 | Simple roles (owner vs billing staff) |
| B3 | Purchase print/PDF (if gap) |
| B4 | Nepali (BS) date on bills (if buyers require) |
| B5 | Delivery note from bill |
| B6 | Customer price tier |
| B7 | Bill edit history UI |
| B8 | **AI: daily brief + udhar risk** (rules/aggregates first) |

### Phase C — only when a client prepays or churn risk

Van stock, offline sync, beat planning, barcode, Tally bridge, multi-branch, pharma batch/FEFO.

---

## 9. Pricing (draft — NPR / month)

**Principle:** Per **company**, not per salesman. Annual optional (~2 months free).

| Plan | NPR/mo (draft) | Users | Includes |
|------|----------------|-------|----------|
| **Founding** | 2,000 | 1 | Core loop, print, support (limited slots) |
| **Business** | 3,500 | up to 3 | + CSV export, import (when shipped) |
| **Growth** | 5,000 | up to 5 | + AI brief, udhar risk, priority support |

**Add-ons (later):** extra users, onboarding visit, data migration from Swastik/Excel.

**Compare to market:** Swastik/MrSolution often **higher upfront + AMC**; Tally rental ~₹750/mo India but weak DMS; position as **all-in wholesaler loop** at **2–5k**.

---

## 10. Sales qualification (5 questions)

| # | Question | Fit if… |
|---|----------|---------|
| 1 | Do you bill retailers with **VAT invoices**? | Yes |
| 2 | Do you buy from suppliers with **invoice numbers**? | Yes |
| 3 | Is billing mostly **shop/warehouse**, not 20 offline vans? | Yes |
| 4 | Do you need **20 salesmen offline** on routes? | **No** (defer) |
| 5 | Does accountant need **Excel export** monthly? | Yes → **need A1 before close** |

---

## 11. Go-to-market (Nepal)

| Channel | Action |
|---------|--------|
| **Pilot case study** | One ice-cream dealer: stock + udhar + bills (before/after) |
| **Look-alikes** | 10 wholesalers same city, similar SKU count |
| **Accountants** | One CA firm: “we give CSV for VAT month” → referrals |
| **Avoid** | Head-on “van + offline” vs MrSolution until built |

**Demo script (30 min):** Settings → Product → Purchase (invoice no.) → Sale → Payment → Print → Outstanding.

---

## 12. Changes needed in existing product (checklist)

> **Canonical launch checklist:** [PHASE_ROADMAP.md](PHASE_ROADMAP.md) (Phase 0–3, including app shell, Settings tabs, notifications). Summary below.

Before heavy AI or van modules:

- [ ] **Phase 0 UI shell** — side menu (Masters / Entry / Reports / Support), sticky tabs (Home, Customers, Inventory, Reports), header Settings + notifications — [PHASE_ROADMAP.md §3.1](PHASE_ROADMAP.md#31-app-shell--navigation-new--phase-0)
- [x] Export Tier A (partial) — Settings → Export; registers + backup ZIP
- [ ] **IMP-0/1/2 (Phase 2)** — full backup, CSV import per entity, restore — [DEFERRED_WORK.md](DEFERRED_WORK.md)
- [ ] Rebrand — [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md), BRAND-1
- [x] Tenant-configurable categories (flat list — `0019`)
- [ ] Parent/child categories (**CAT-1**, Phase 1) · tree UI (**CAT-2**, Phase 2) — [DEFERRED_WORK.md](DEFERRED_WORK.md)
- [ ] Paginate `sales_bills` / stop full bundle on home
- [ ] Credit limit enforce or hide
- [ ] INV-1 oversell in RPC
- [ ] Purchase PDF/print parity with sales bill (if missing)
- [ ] Onboarding doc for tenant (10 products, 5 customers, 1 purchase, 1 sale)
- [ ] Stock adjustment RPC + UI + Settings toggle — [PHASE_ROADMAP.md](PHASE_ROADMAP.md) STK-0d–0f (Phase 0)
- [ ] VAT bill: **Tax Invoice** title when VAT registered (`billDisplay.ts`)
- [ ] Optional customer **VAT number** on bill (B2B)
- [ ] Settings: require address + tax id when VAT registered

---

## 13. Open questions (for next discussion)

Record answers here as you decide:

| # | Question | Answer |
|---|----------|--------|
| 1 | Product name for market (not BikriKhata)? | TBD — [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) |
| 2 | Nepali (BS) date on printed bills required for v1? | TBD |
| 3 | IRD e-billing / certified invoice scope? | **Complement** — export VAT/purchase books; IRD submit deferred ([DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md)) |
| 4 | TDS / PAN workflows mandatory? | TBD |
| 5 | Max users per plan (enforce in app)? | TBD |
| 6 | Payment collection (eSewa/Khalti subscription)? | TBD |
| 7 | Founding customer count and discount duration? | TBD |
| 8 | First vertical after ice-cream (beverages vs general FMCG)? | TBD |
| 9 | Separate stock entry / adjustment screen? | **Defer** — purchase = main IN; add adjustment P1 when onboarding demands |
| 10 | Bill title “Tax Invoice” for VAT shops? | **Yes** — P1; see [§5](#5-nepal-vat--ird-compliance-checklist) |
| 11 | Customer VAT number on bill? | **P1** — B2B; PAN exists today |

---

## 14. Related docs

| Doc | Role |
|-----|------|
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) | Engineering priority from client pain |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | INV-1, INV-2, EXP-1, BRAND-1 effort |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Export columns and ZIP |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Rebrand |
| [PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md) | Purchase USP technical detail |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Implementation checklist |

---

## 15. Revision log

| Date | Change |
|------|--------|
| 2026-05-26 | §5 Nepal VAT / IRD compliance checklist (bill field audit, two levels A/B, compliance pack) |
| 2026-05-26 | Stock model (purchase vs adjustment); Nepal E-Billing adopt/defer table |
| 2026-05-26 | Initial GTM working doc from product/strategy discussion |
