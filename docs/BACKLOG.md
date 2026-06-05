# Product backlog (deferred & future)

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) (active priorities) · [Phase roadmap](PHASE_ROADMAP.md) · [Backend checklist](backend/BACKEND-TODO.md) · [Export spec](DATA_EXPORT_SPEC.md)

> **Single deferred register.** Promote items to [FIRST_LAUNCH.md](FIRST_LAUNCH.md) when starting work. When done, mark **Done** here + [BACKEND-TODO](backend/BACKEND-TODO.md) + [LLM_CONTEXT](LLM_CONTEXT.md) changelog.

---

## How to maintain

1. **New idea** — Add row below with ID, phase, effort, status `backlog`.  
2. **Starting** — Move to FIRST_LAUNCH with Priority P1/P2; status `in_progress`.  
3. **Done** — Status `done` + date; check off BACKEND-TODO.  
4. **Do not duplicate** — Implementation detail in `data-model.md` / export spec; this file is the **ID index**.

---

## Master register

| ID | Title | Phase | Effort | Status | Notes |
|----|--------|-------|--------|--------|-------|
| **UI-1** | Symmetric UI (`patterns.tsx`) | 1.0 | 2–3 d | backlog | [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md) |
| **DEL-1** | Archive/restore masters + list filter; cancel draft orders; no hard delete in shop UI | 1.0 | 3–5 d | backlog | [DELETE_POLICY](DELETE_POLICY.md) |
| **BILL-QR-1** | Payment QR + bank on sales invoice print | 1.0 | 1–2 d | backlog | Karobar-style static QR |
| **LIC-1** | Trial / license expiry on tenant | 1.0 | 1–2 d | **done** | `0030`, `/license-expired`, `approve_tenant`, `set_tenant_subscription` — see [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md) |
| **PRICE-DISP-1** | Configurable MRP vs rate on print | 1.0 | 2–4 d | backlog | Settings; tax math unchanged |
| **UNITS-1** | Custom units catalog in Settings | 1.0 | 2–3 d | backlog | |
| **HSN-1** | HSN code on products (optional field) | 1.0 | — | **done** | `0034`; no Settings toggle — see § HSN-1 below |
| **SF-0** | Salesman on invoice only | 1.0 | 3–5 d | backlog | No order tables |
| **ORD-1** | Sales order draft | 1.0 | 3–4 d | backlog | No stock move |
| **ORD-2** | Convert order → sales bill (full) | 1.0 | 2–3 d | backlog | |
| **ORD-3** | Salesmen master + dropdown | 1.0 | 1–2 d | backlog | |
| **ORD-4** | Orders/sales by salesman reports | 1.0 | 2 d | backlog | |
| **ORD-2b** | Partial convert order | 1.1 | 3–5 d | backlog | |
| **ORD-3b** | Salesman login + limited nav | 1.1 | 4–7 d | backlog | No Settings/Export |
| **ORD-5** | Purchase order → purchase invoice | 1.1 | 5–8 d | backlog | |
| **ORD-6** | Stock reserve on open order | 1.1 | 2–4 d | backlog | Optional |
| **CAT-PUB-1** | Shareable catalog link | 1.1 | 4–6 d | backlog | In-stock; MRP, name, desc |
| **CAT-PUB-2** | Customer cart + submit | 1.2 | 1–2 wk | backlog | Discuss scope |
| **CAT-PUB-3** | Accept cart → order/bill | 1.2 | 3–5 d | backlog | |
| **RPT-1** | On-screen period books | 1.0 | 2–4 d | backlog | |
| **RPT-1c** | XLSX accountant pack | 1.1 | 3–5 d | backlog | |
| **INLINE+** | Inline + create on forms | 1.0 | 2–3 d | backlog | |
| **CAT-1** | Parent/child categories (2-level) | 1.0 | 3–5 d | backlog | |
| **INV-2** | Stock as-of bill date | 1.0 | 0–5 d | backlog | Product decision |
| **SUP-1** | Supplier scheme pass-through | 2 | 3–5 d | backlog | |
| **IMP-0** | Full tenant backup ZIP | 2 | ~1 wk | backlog | [DATA_EXPORT_SPEC](DATA_EXPORT_SPEC.md) |
| **IMP-1** | CSV import per entity | 2 | 2–3 wk | backlog | Columns match export |
| **IMP-2** | Restore from backup | 2 | 3–5 wk | backlog | After IMP-0/1 |
| **CAT-2** | Category tree UI (3+ levels) | 2 | 1–2 wk | backlog | After CAT-1 |
| **NOTIF-2A** | DB notifications + bell | 1–2 | 3–5 d | backlog | |
| **PLAT-1** | Super-admin login any tenant | 2 | TBD | backlog | Security review |
| **DOC-1** | Invoice image/PDF attachments | 1 | 3–5 d | backlog | Storage |
| **TRUST-1** | Bill amendment history UI | 1 | 2 d | backlog | RPC exists |
| **COMM-1** | Customer price tier | 1 | 3–5 d | backlog | |
| **COMM-2** | Owner vs staff roles | 1 | 4–7 d | backlog | |
| **EXP-P1** | Extra export registers | 1 | 2–3 d | backlog | expenses, damages, returns |
| **NAV-P1** | Delivery note from invoice | 1 | 2–3 d | backlog | |
| **WEB-1** | Marketing site + `/app` route | 0 launch | — | **done** | [FIRST_LAUNCH § Website](FIRST_LAUNCH.md#website-bikrikhatacom--app) |
| **MIG-0012** | Scheme Box→PCS columns | opt | 10 min | backlog | Only if cross-UOM schemes |
| **INV-1** | Block oversell in DB | 0 | — | **done** | 0024 |
| **EXP-1** | Export Tier A registers | 0 | — | **done** | partial ZIP |
| **BRAND-1** | BikriKhata rebrand | 0 | — | **done** | |
| **L8** | Contact form email alerts (Resend) | 0 ops | ~20 min | **deferred** | Code ready; enable later — 0033 + `setup:contact-email` |

---

## L8 — Contact form email alerts (deferred — enable when you want inbox alerts)

**Now:** Form → **`platform_inquiries`**. Email needs one-time setup (~20 min).

**Guide:** [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md)

### Copy-paste checklist

1. **Resend** — [resend.com](https://resend.com) → API key `re_…`
2. **Link Supabase** — `supabase login` → `cd app` → `supabase link --project-ref YOUR_REF`
3. **Migration 0033** — SQL Editor → `app/supabase/migrations/0033_platform_inquiry_email_notify.sql`
4. **Setup** — `cd app && RESEND_API_KEY=re_… npm run setup:contact-email`
5. **Verify** — `npm run test:contact-email` → submit form → Gmail + Resend logs

No Dashboard webhook required (pg_net trigger on insert).

**Production sender:** verify `bikrikhata.com` on Resend, then change `RESEND_FROM` to e.g. `BikriKhata <notifications@bikrikhata.com>`.

Mark **L8** `done` in [FIRST_LAUNCH.md](FIRST_LAUNCH.md) when finished.

---

## Phase 3 (enterprise — do not sell at launch)

Van / beat / visit, offline rep sync, multi-godown, barcode, pharma batch, IRD certify API, Tally bridge, full SFA parity. See [PHASE_ROADMAP §6](PHASE_ROADMAP.md#6-phase-3--prepay-or-dedicated-client-only).

---

## Detail — import / export (IMP-*)

**IMP-0:** ZIP with settings, all masters, all bills/lines, payments, stock snapshot, manifest.  
**IMP-1:** Settings → Import; template CSV per entity; row errors before commit.  
**IMP-2:** Import ZIP or ordered CSVs; resume same stock/credit point. Import columns must match export ([DATA_EXPORT_SPEC](DATA_EXPORT_SPEC.md)).

**Launch:** export only (Tier A). No symmetric import before Phase 2.

---

## Detail — field sales (ORD-*)

Sigma-style lite v1: salesman master → sales order → full convert → one sales bill; stock on invoice only. Partial convert + rep login + PO in 1.1. See [PHASE_ROADMAP §4.1](PHASE_ROADMAP.md#41-tier-d--field-sales-orders--ird-books-phase-1).

---

## Detail — catalog (CAT-PUB-*)

1. Public read-only catalog (in-stock, MRP, description, share link).  
2. Cart + owner notification (scope TBD).  
3. Convert to internal order or sales bill.

---

## Detail — HSN-1 (done — optional product field)

**Why:** Some dealers / CAs want **HSN** on product master for VAT returns; field is always visible but **optional** (no Settings toggle).

| Layer | Spec |
|-------|------|
| **DB** | `products.hsn_code` text nullable — migration `0034_product_hsn_code.sql` |
| **Product create/edit** | **HSN code (optional)** on [ProductFormPage](app/src/pages/products/ProductFormPage.tsx); not required to save |
| **Bill print** | Not on invoice layout yet — product + export only |
| **Export** | `hsn_code` column on products CSV / backup ZIP |

**Acceptance:** Empty HSN saves; edit loads HSN; existing products unchanged (null).

---

## Detail — INV-2 (stock vs bill date)

| Option | Effort |
|--------|--------|
| Today stock only (current) | 0 |
| Relax picker when bill date past | ~0.5 d |
| `stock_as_of(bill_date)` SQL | 3–5 d |

---

## Detail — CAT-1 / CAT-2

**CAT-1:** 2-level parent/child categories. **CAT-2:** ERP tree UI — Phase 2.

---

## Related docs (keep, do not duplicate here)

| Doc | Role |
|-----|------|
| [PHASE_ROADMAP.md](PHASE_ROADMAP.md) | Strategy phases 0–3 |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Export columns & ZIP layout |
| [UI_CONSISTENCY_PLAN.md](UI_CONSISTENCY_PLAN.md) | UI-1 file list |
| [DELETE_POLICY.md](DELETE_POLICY.md) | DEL-1 rules |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | Redirect stub; long-form archive |

---

*Last updated: 2026-05-26 — consolidated from DEFERRED_WORK + Phase 1 Tier D scope.*
