# First launch — checklist & priorities

**Navigate:** [Docs hub](README.md) · [AI agents](AI_AGENT.md) · [Backlog](BACKLOG.md) · [Phase roadmap](PHASE_ROADMAP.md) · [GTM Nepal](GTM_NEPAL.md) · [Onboarding](ONBOARDING_FIRST_SHOP.md)

**Docs:** Old files live in `[docs/archive/](archive/README.md)` — archive first, delete later. Do not add new top-level docs; use BACKLOG.

> **One place for “what before ads” and “what next.”** Edit **Priority** and **Status** columns yourself. Move rows to [BACKLOG.md](BACKLOG.md) when deferred; move back here when promoting to active work.

**Product:** BikriKhata — VAT billing, purchase, stock, credit, export for CA (Nepal wholesalers / dealers, 1 godown).

**Phase 0 status:** **Complete (2026-05-26)** — Tier A + B + C (prod migrations through **0026**, QA, deploy).

---

## How to use this file


| Column       | Values                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **Priority** | **P0** = before ads · **P1** = first month after ads · **P2** = when paying shops ask · **P3** = Phase 2+ |
| **Status**   | `todo` · `in_progress` · `done` · `deferred` → link row in BACKLOG                                        |


When an item is **deferred**, copy its ID to [BACKLOG.md](BACKLOG.md) and set Status here to `deferred`.

---

## P0 — Before first ad (operations + trust)


| ID  | Feature                                                                       | Status    | Notes                                                                                                     |
| --- | ----------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| L0  | Phase 0 prod: migrations **0025–0026**, deploy, QA §3.0c                      | **done**  | Tier C signed off                                                                                         |
| L1  | `PLATFORM_SUPPORT` real phone/WhatsApp in `app/src/config/supportContacts.ts` | **done**  | Config set; **verify taps on prod** `/app/support` — [P0_LAUNCH_RUNBOOK](P0_LAUNCH_RUNBOOK.md) L1         |
| L2  | Supabase **Email** auth — confirm email OFF for pilot or add confirmation UX  | **ready** | Dashboard steps in [P0_LAUNCH_RUNBOOK](P0_LAUNCH_RUNBOOK.md) L2 — owner smoke-test register/login on prod |
| L3  | **Privacy** + **Terms** (short) on marketing site + register                  | **done**  | `/privacy`, `/terms`; register footer links                                                               |
| L4  | Marketing site `bikrikhata.com` + app at `**/app`**                           | **done**  | SPA routes `/`, `/privacy`, `/terms`; app unchanged at `/app/*`                                           |
| L5  | `npm run e2e:phase0` (+ `:live` on prod tenant)                               | **done**  | Source gate green; run `:live` before ads if creds available                                              |
| L6  | **One pilot shop** live ~1 week (real bills)                                  | **ready** | Owner runs [ONBOARDING_FIRST_SHOP](ONBOARDING_FIRST_SHOP.md) — sign-off when week complete                |
| L7  | Founding **price** on website (one package for all)                           | **done**  | `app/src/config/launchPricing.ts` → landing `#pricing`, license gate, FAQ, terms |
| L8  | Contact form **email alerts** (Resend + Edge Function + migration 0033)     | **ready** | Run [CONTACT_FORM_EMAIL_SETUP](CONTACT_FORM_EMAIL_SETUP.md): 0033 + `npm run setup:contact-email` |


---

## P1 — First 2–4 weeks after launch (high ROI)


| ID           | Feature                                                              | Status   | Effort | Notes                                           |
| ------------ | -------------------------------------------------------------------- | -------- | ------ | ----------------------------------------------- |
| UI-1         | Symmetric UI (`patterns.tsx` on all forms/lists)                     | todo     | 2–3 d  | [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md)   |
| DEL-1        | Deactivate masters + cancel draft orders; **no** delete posted bills | todo     | 3–5 d  | [DELETE_POLICY](DELETE_POLICY.md)               |
| BILL-QR-1    | Bank + payment QR on **sales invoice** print                         | todo     | 1–2 d  | Settings + `BillPrintView`                      |
| LIC-1        | Trial `trial_ends_at` + banner; `approve_tenant` / `set_tenant_subscription` | **done** | —      | [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md)     |
| PRICE-DISP-1 | Settings: MRP vs deal rate on sales/purchase print                   | todo     | 2–4 d  | Default = today (MRP column)                    |
| UNITS-1      | Custom units list in Settings                                        | todo     | 2–3 d  | Today: fixed UOM + Box conversion               |
| **HSN-1**    | **HSN code** on product form (Settings on/off)                       | todo     | 1–2 d  | Optional per product; placeholder e.g. `345578` |
| EXP-P1       | Export: expenses / damages / returns registers                       | deferred | 2–3 d  | Only if CA asks — [BACKLOG](BACKLOG.md)         |


---

## P2 — When paying shops ask (Phase 1)


| ID        | Feature                                      | Status   | Effort  |
| --------- | -------------------------------------------- | -------- | ------- |
| ORD-3     | Salesmen master                              | deferred | 1–2 d   |
| ORD-1     | Sales orders (no stock on draft)             | deferred | 3–4 d   |
| ORD-2     | Convert order → sales invoice (full)         | deferred | 2–3 d   |
| ORD-4     | Reports by salesman / open orders            | deferred | 2 d     |
| ORD-3b    | Salesman login + limited nav                 | deferred | 4–7 d   |
| ORD-2b    | Partial convert order                        | deferred | 3–5 d   |
| ORD-5     | Purchase order → purchase invoice            | deferred | 5–8 d   |
| CAT-PUB-1 | Shareable in-stock catalog (MRP, name, desc) | deferred | 4–6 d   |
| CAT-PUB-2 | Customer **cart** + submit + owner notify    | deferred | discuss |
| CAT-PUB-3 | Fulfill cart → order or sales bill           | deferred | 3–5 d   |
| RPT-1     | On-screen sales/purchase books               | deferred | 2–4 d   |
| CAT-1     | Parent/child categories (2-level)            | deferred | 3–5 d   |
| INLINE+   | Quick-create customer/supplier on forms      | deferred | 2–3 d   |
| INV-2     | Stock as-of bill date                        | deferred | 0–5 d   |


---

## P3 — Phase 2+ (see BACKLOG)

IMP-0 full backup · IMP-1 import · IMP-2 restore · notifications DB · IRD API · van/GPS · PLAT-1 master tenant login · roles · CAT-2 tree · etc.

---

## Website (`bikrikhata.com` + `/app`)


| Section         | Content                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero + features | Professional landing: nav, problems, why, 4 feature blocks with **SVG placeholders** in `app/public/marketing/` — swap for real screenshots (same filenames) |
| App icon        | `app/public/icons/icon.png` (from `bikrikhata-icon.png`) — [BRAND_ICON_GUIDE.md](BRAND_ICON_GUIDE.md)                                                        |
| Who             | Dealers, distributors, stockists — 1 godown, 1–5 staff                                                                                                       |
| Features        | Sales/purchase invoice, VAT, stock, credit, CSV for CA                                                                                                        |
| Use cases       | Godown billing; month-end for accountant                                                                                                                     |
| **FAQ**         | `**/#faq`** — accordion; first Q: **Built for Nepal wholesalers only?** (+ billing, stock, credit, export, IRD, pricing)                                      |
| Pricing         | **One package** — amount in `app/src/config/launchPricing.ts` (same for every shop at first launch)                                                          |
| Buy / subscribe | WhatsApp, call, owner **QR** — manual onboarding                                                                                                             |
| Support         | Link to app Help; platform contact                                                                                                                           |
| Legal           | Privacy, Terms                                                                                                                                               |
| Login           | → `https://bikrikhata.com/login` (app at `/app/`*)                                                                                                           |


**Also useful:** 2-min demo video, FAQ, “Book setup call”, “First 20 shops” founding cap.

---

## Export / import (launch vs later)


| When             | Export                                                                                      | Import                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Launch (now)** | Tier A: products, customers, stock, sales, purchases, outstanding, VAT summary, partial ZIP | **None** — manual [ONBOARDING](ONBOARDING_FIRST_SHOP.md) |
| **P1**           | Optional extra registers (expenses, damages)                                                | —                                                        |
| **Phase 2**      | IMP-0 full ZIP                                                                              | IMP-1 templates matching export columns                  |
| **Phase 2**      | —                                                                                           | IMP-2 restore → resume business from backup              |


**No export extension required before ads** unless a pilot CA requests a specific register.

---

## IRD / reports at launch


| Need                                     | Status                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| Tax invoice letterhead, PAN/VAT, address | Done — [IRD_BILL_LETTERHEAD](IRD_BILL_LETTERHEAD.md) |
| Customer PAN/VAT on B2B bill             | Done — 0026                                          |
| Month CSV for CA                         | Done — Settings → Export                             |
| IRD e-filing API                         | Phase 3 — not launch                                 |
| On-screen sales book UI                  | P2 — RPT-1                                           |


---

## Delete vs archive (summary)


| Type                                  | Method                                    |
| ------------------------------------- | ----------------------------------------- |
| Product, customer, supplier, salesman | **Deactivate** (`is_active`)              |
| Open sales order                      | **Cancel** (soft)                         |
| Posted sales/purchase bill            | **No delete** — edit, return, future void |
| Payments                              | Reverse later — not delete                |


Full matrix: [DELETE_POLICY.md](DELETE_POLICY.md).

---

## Price display (PRICE-DISP-1)

**Today:** Sales print = **MRP** + Disc% + Amount; purchase = **Rate excl** + VAT.

**Settings (when built):** `sales_bill_price_column` (mrp · deal_rate · both); `purchase_bill_price_column` (excl · incl · both). Tax math unchanged.

---

## Phase 0 complete — do not rebuild for launch

Tier A export, rebrand, stock adjustment, oversell **0024**, credit warn, shell, Share bill, support, customer VAT — see [PHASE_ROADMAP §2](PHASE_ROADMAP.md#2-already-shipped-demo-today).

---

## Sign-off


| Milestone                             | Date       | By                             |
| ------------------------------------- | ---------- | ------------------------------ |
| Phase 0 (A+B+C)                       | 2026-05-26 |                                |
| P0 marketing + legal (L3–L5, L7 code) | 2026-05-26 | SPA landing, runbook           |
| Pilot shop (L6)                       |            | Owner — ~1 week on prod        |
| First ad live                         |            | After L2 prod smoke + L6 pilot |
| First paying tenant                   |            |                                |


**Runbook:** [P0_LAUNCH_RUNBOOK.md](P0_LAUNCH_RUNBOOK.md)

---

*Last updated: 2026-05-26 (P0 landing + legal shipped)*