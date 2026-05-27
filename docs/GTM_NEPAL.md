# Nepal GTM — product, positioning, pricing (working doc)

**Navigate:** [Docs hub](README.md) · [Product evolution (build order)](PRODUCT_EVOLUTION.md) · [Deferred work](DEFERRED_WORK.md) · [Export spec](DATA_EXPORT_SPEC.md) · [Naming brief](PRODUCT_NAMING_BRIEF.md)

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

| Style | Examples | Havmor vs them |
|-------|----------|----------------|
| **Local Nepal DMS/ERP** | MrSolution, Swastik, CrossOver, BISage | Same buyer; we win on **simpler UX + cloud + modern purchase/VAT bill**; they win on **offline/van/mature IRD depth** until we ship |
| **India desktop (via partners)** | BUSY, Marg, Tally | Tally = CA habit; BUSY/Marg = FMCG depth; we are **lighter + Nepal-first story** |
| **Brand SFA** | Bizom, FieldAssist, BeatRoute | Wrong buyer — brands pay, not small dealer |

See also competitor landscape notes from strategy sessions (India/Nepal desktop + cloud DMS). No separate file yet — add `COMPETITOR_LANDSCAPE.md` if needed.

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

## 4. Fit: what Havmor has today

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
| **CSV export / backup** | **Not shipped** | P0 — [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) |
| **White-label / non–ice-cream brand** | **Partial** | [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) |
| **Configurable categories** | **No** (ice-cream list) | Blocks 2nd vertical |
| **Paginated bills / fast home** | **Weak** | Medium dealer churn risk |
| **DB oversell guard** | **No** | [DEFERRED_WORK.md](DEFERRED_WORK.md) INV-1 |
| Van / route / offline | **No** | DB stubs only |

**End-to-end % for ICP:** ~**80%** product fit; ~**20%** gaps block **renewal** and **second vertical**.

---

## 5. Must-have features (table stakes)

Dealers will **not pay monthly** without these:

| # | Feature | Havmor | Priority |
|---|---------|--------|----------|
| 1 | VAT sales invoice + print/PDF | Yes | Maintain |
| 2 | Customer ledger + payment allocation | Yes | Daily hook |
| 3 | Supplier purchase → stock | Yes | Differentiator |
| 4 | Supplier payments | Yes | |
| 5 | Stock movement on sale/purchase/return/damage | Yes | + INV-1 trust |
| 6 | Outstanding / overdue visibility | Yes | Home screen |
| 7 | **Excel export** (sales, purchase, outstanding, products) | No | **P0** |
| 8 | **Generic branding** (not Havmor-only) | Partial | **P0** |
| 9 | **Configurable product categories** | No | **P0** |
| 10 | Works on mobile browser | PWA | Market it |
| 11 | Performance with many bills | Weak | **P0** pagination |

---

## 6. Unique selling points (USP)

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

## 7. Roadmap vs revenue (solo founder)

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

## 8. Pricing (draft — NPR / month)

**Principle:** Per **company**, not per salesman. Annual optional (~2 months free).

| Plan | NPR/mo (draft) | Users | Includes |
|------|----------------|-------|----------|
| **Founding** | 2,000 | 1 | Core loop, print, support (limited slots) |
| **Business** | 3,500 | up to 3 | + CSV export, import (when shipped) |
| **Growth** | 5,000 | up to 5 | + AI brief, udhar risk, priority support |

**Add-ons (later):** extra users, onboarding visit, data migration from Swastik/Excel.

**Compare to market:** Swastik/MrSolution often **higher upfront + AMC**; Tally rental ~₹750/mo India but weak DMS; position as **all-in wholesaler loop** at **2–5k**.

---

## 9. Sales qualification (5 questions)

| # | Question | Fit if… |
|---|----------|---------|
| 1 | Do you bill retailers with **VAT invoices**? | Yes |
| 2 | Do you buy from suppliers with **invoice numbers**? | Yes |
| 3 | Is billing mostly **shop/warehouse**, not 20 offline vans? | Yes |
| 4 | Do you need **20 salesmen offline** on routes? | **No** (defer) |
| 5 | Does accountant need **Excel export** monthly? | Yes → **need A1 before close** |

---

## 10. Go-to-market (Nepal)

| Channel | Action |
|---------|--------|
| **Pilot case study** | One ice-cream dealer: stock + udhar + bills (before/after) |
| **Look-alikes** | 10 wholesalers same city, similar SKU count |
| **Accountants** | One CA firm: “we give CSV for VAT month” → referrals |
| **Avoid** | Head-on “van + offline” vs MrSolution until built |

**Demo script (30 min):** Settings → Product → Purchase (invoice no.) → Sale → Payment → Print → Outstanding.

---

## 11. Changes needed in existing product (checklist)

Before heavy AI or van modules:

- [ ] Export P0 — [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md), [DEFERRED_WORK.md](DEFERRED_WORK.md) EXP-1
- [ ] Rebrand — [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md), BRAND-1
- [ ] Tenant-configurable categories (remove hardcoded ice-cream only)
- [ ] Paginate `sales_bills` / stop full bundle on home
- [ ] Credit limit enforce or hide
- [ ] INV-1 oversell in RPC
- [ ] Purchase PDF/print parity with sales bill (if missing)
- [ ] Onboarding doc for tenant (10 products, 5 customers, 1 purchase, 1 sale)

---

## 12. Open questions (for next discussion)

Record answers here as you decide:

| # | Question | Answer |
|---|----------|--------|
| 1 | Product name for market (not Havmor)? | TBD — [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) |
| 2 | Nepali (BS) date on printed bills required for v1? | TBD |
| 3 | IRD e-billing / certified invoice scope? | TBD |
| 4 | TDS / PAN workflows mandatory? | TBD |
| 5 | Max users per plan (enforce in app)? | TBD |
| 6 | Payment collection (eSewa/Khalti subscription)? | TBD |
| 7 | Founding customer count and discount duration? | TBD |
| 8 | First vertical after ice-cream (beverages vs general FMCG)? | TBD |

---

## 13. Related docs

| Doc | Role |
|-----|------|
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) | Engineering priority from client pain |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | INV-1, INV-2, EXP-1, BRAND-1 effort |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Export columns and ZIP |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Rebrand |
| [PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md) | Purchase USP technical detail |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Implementation checklist |

---

## 14. Revision log

| Date | Change |
|------|--------|
| 2026-05-26 | Initial GTM working doc from product/strategy discussion |
