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
| **DEL-1** | Deactivate masters; cancel draft orders | 1.0 | 3–5 d | backlog | [DELETE_POLICY](DELETE_POLICY.md) |
| **BILL-QR-1** | Payment QR + bank on sales invoice print | 1.0 | 1–2 d | backlog | Karobar-style static QR |
| **LIC-1** | Trial / license expiry on tenant | 1.0 | 1–2 d | **done** | `0030`, `/license-expired`, `approve_tenant`, `set_tenant_subscription` — see [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md) |
| **PRICE-DISP-1** | Configurable MRP vs rate on print | 1.0 | 2–4 d | backlog | Settings; tax math unchanged |
| **UNITS-1** | Custom units catalog in Settings | 1.0 | 2–3 d | backlog | |
| **HSN-1** | HSN code on products (Settings toggle) | 1.0 | 1–2 d | backlog | See § HSN-1 below |
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
| **WEB-1** | Marketing site + `/app` route | 0 launch | 3–5 d | backlog | [FIRST_LAUNCH § Website](FIRST_LAUNCH.md#website-bikrikhatacom--app) |
| **MIG-0012** | Scheme Box→PCS columns | opt | 10 min | backlog | Only if cross-UOM schemes |
| **INV-1** | Block oversell in DB | 0 | — | **done** | 0024 |
| **EXP-1** | Export Tier A registers | 0 | — | **done** | partial ZIP |
| **BRAND-1** | BikriKhata rebrand | 0 | — | **done** | |
| **L8** | Contact form email alerts (Resend) | 0 ops | ~20 min | **deferred** | [FIRST_LAUNCH L8](FIRST_LAUNCH.md); full guide + checklist below |

---

## L8 — Contact form email alerts (deferred)

**Now:** Website contact form → **`platform_inquiries`** in Supabase (Table Editor). No inbox email yet.

**When ready (~20 min):** Full guide [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md). Repo code: `app/supabase/functions/notify-platform-inquiry/`.

### Copy-paste checklist

1. **Resend** — [resend.com](https://resend.com) → API key `re_…`
2. **Link Supabase** — `supabase login` → `cd app` → `supabase link --project-ref YOUR_REF`  
   (`YOUR_REF` = subdomain in `VITE_SUPABASE_URL`, same project as Netlify prod)
3. **Secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_key_here
   supabase secrets set INQUIRY_NOTIFY_TO=support.bikrikhata@gmail.com
   supabase secrets set RESEND_FROM="BikriKhata <onboarding@resend.dev>"
   ```
4. **Deploy** — `cd app && npm run deploy:contact-email`
5. **Webhook** — Dashboard → Database → Webhooks → **Insert** on `platform_inquiries` → Edge Function `notify-platform-inquiry` (POST)

**Test:** `npm run test:contact-form` → submit form → row in table → email at support.bikrikhata@gmail.com + Resend/Edge Function logs.

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

## Detail — HSN-1 (product form, configurable in Settings)

**Why:** Some dealers / CAs want **HSN** (harmonized system nomenclature) on product master for VAT returns; many small FMCG shops do not — make it **optional per tenant**.

| Layer | Spec |
|-------|------|
| **Settings** | Toggle e.g. **“Show HSN code on products”** (Business or Stock tab); default **off** at launch |
| **DB** | `products.hsn_code` text nullable; optional `tenant_settings.show_product_hsn` boolean |
| **Product create/edit** | When toggle on: field **HSN Code**, placeholder `Eg: 345578`; optional, not required to save |
| **Bill print** | Out of v1 unless CA asks — product master only |
| **Export** | Add `hsn_code` column to products CSV when column exists |

**Acceptance:** Toggle off → no HSN field on form. Toggle on → save/load HSN on product; existing products unchanged.

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
