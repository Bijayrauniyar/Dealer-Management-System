# First launch — checklist & priorities

**Navigate:** [Docs hub](README.md) · [AI agents](AI_AGENT.md) · [Backlog](BACKLOG.md) · [Phase roadmap](PHASE_ROADMAP.md) · [GTM Nepal](GTM_NEPAL.md) · [Onboarding](ONBOARDING_FIRST_SHOP.md)

**Docs:** Old files live in `[docs/archive/](archive/README.md)` — archive first, delete later. Do not add new top-level docs; use BACKLOG.

> **One place for “what before ads” and “what next.”** Edit **Priority** and **Status** columns yourself. Move rows to [BACKLOG.md](BACKLOG.md) when deferred; move back here when promoting to active work.

**Product:** BikriKhata — VAT billing, purchase, stock, credit, and period export for Nepal wholesalers and dealers (1 godown).

**Phase 0 status:** **Complete (2026-05-26)** — Tier A + B + C on prod.

**P1 product status:** **Complete (2026-06-05)** — UI redesign, stock hub, support form, 4-decimal prices, dual dates; migrations through **`0039`** applied on prod.

**Launch ops status:** **Not ads-ready yet** — owner still needs **L2** prod auth smoke + **L6** pilot shop ~1 week.

---

## Where we are (2026-06-05)

| Layer | Status |
|-------|--------|
| **Core app** | Phase 0 + P1 checklist items shipped in code |
| **DB** | Migrations **0001–0039** on prod (incl. HSN `0034`, print/QR `0035`–`0036`, archive `0037`, units `0038`, 4-dec price `0039`) |
| **UI / nav** | Home ops dashboard; bottom bar **Home · Customers · + · Stock · Reports**; Stock hub at `/app/products`; Settings 4 tabs; Reports hub; supplier detail |
| **Before ads** | Deploy latest → **L2** register/login on prod → **L6** one pilot shop ~1 week → sign-off |
| **Phase 1 backlog** | Orders, catalog, on-screen books, BS dropdown picker — deferred until a shop asks ([P2](#p2--when-paying-shops-ask-phase-1)) |

---

## What's done (shipped)

### App (Phase 0)

- Sales & purchase invoices, VAT, stock, customer credit, supplier pay, returns, damage, expenses, schemes
- Export Tier A (Settings → Export), stock adjustment, oversell guard (`0024`), Share bill, support page
- Customer PAN/VAT on bill (`0026`), license gates (`0030`–`0032`), trial/subscription UI
- Tenant activation runbook: [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md)

### Marketing site (`bikrikhata.com`)

- Landing, FAQ (`/faq`), privacy, terms, contact form → `platform_inquiries` (`0027`–`0029`)
- Hero: distributor/dealer positioning, tax invoices copy, pricing from [launchPricing.ts](../app/src/config/launchPricing.ts)
- Contact thank-you + optional WhatsApp prefill; logo scrolls to top on home
- `e2e:p0-public` — 85/85 source checks

### P1 already shipped (2026-05-26 – 2026-06-05)

| ID | What |
|----|------|
| **LIC-1** | Trial / license expiry, renewal banners, `approve_tenant` |
| **HSN-1** | Optional HSN on product form (`0034`); products export CSV |
| **UI-1** | `FormPageHeader` / `ListPageHeader`; `EntityList` compact rows; Settings `SegmentedTabs` |
| **DEL-1** | Archive/restore masters + Active/Archived filter (`0037`); `/app/archives` hub |
| **BILL-QR-1** | Payment QR upload + bank text on balance-due sales bills (`0035`–`0036`) |
| **PRICE-DISP-1** | Settings: MRP vs Selling price on sales; excl/incl on purchase (`0035`) |
| **UNITS-1** | Custom product units in Settings (`0038`); **+ Add unit** on product form |
| **EXP-P1** | Export: expenses, damages, returns registers + backup ZIP |
| **PRICE-4DEC** | Product + line prices up to **4 decimals** (`0039` on prod; `numericPriceProps`; bill totals stay 2-dec NPR) |
| **NAV-P1** | Stock hub (`/app/products`, `/app/stock` redirects); Home ops dashboard; drawer deduped |
| **DATE-AD** | `DateFormField` + `DateDisplay` — AD native picker + BS line below (full BS picker = **DATE-BS-1** backlog) |
| **SUP-APP** | In-app support: inquiry form → `platform_inquiries` + WhatsApp (`AppSupportInquiryForm`) |

---

## What's next (do in this order)

### Before first ad — owner / ops (P0)

| # | ID | Action | Guide |
|---|-----|--------|-------|
| 1 | Deploy | Push latest `dev` → Netlify; hard refresh prod | [deployment.md](deployment.md) |
| 2 | **L2** | Supabase auth: confirm-email OFF, Site URL, redirects; smoke `/register` + `/login` on prod | [P0_LAUNCH_RUNBOOK § L2](P0_LAUNCH_RUNBOOK.md) |
| 3 | **L1** | Verify phone / WhatsApp / email on prod `/app/support` | Runbook § L1 |
| 4 | **L6** | **One pilot shop ~1 week** on prod (real bills) | [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md) |
| 5 | Sign-off | Mark pilot date below → then **first ad live** | Sign-off table |

**Ads-ready when:** L2 prod smoke + **L6 pilot week** complete. **L8 not required** for ads.

### Later (not blocking launch)

| ID | What | When |
|----|------|------|
| **L8** | Inbox email for contact form (`0033` + Resend, ~20 min) | When you want Gmail alerts — [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md). Leads still save in Supabase + WhatsApp button works today. |

### When paying shops ask (P2)

Field sales (**ORD-***), shareable catalog (**CAT-PUB-***), on-screen books (**RPT-1**), categories (**CAT-1**) — see P2 table below; all `deferred` in BACKLOG until promoted.

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
| L1  | `PLATFORM_SUPPORT` real phone/WhatsApp in `supportContacts.ts`                | **done**  | Config set; **verify taps on prod** `/app/support` — [P0_LAUNCH_RUNBOOK](P0_LAUNCH_RUNBOOK.md) L1       |
| L2  | Supabase **Email** auth — confirm email OFF for pilot or add confirmation UX  | **ready** | Dashboard steps in runbook L2 — owner smoke-test register/login on prod                                   |
| L3  | **Privacy** + **Terms** (short) on marketing site + register                  | **done**  | `/privacy`, `/terms`; register footer links                                                               |
| L4  | Marketing site `bikrikhata.com` + app at `/app`                               | **done**  | SPA routes `/`, `/privacy`, `/terms`, `/faq`; app at `/app/*`                                              |
| L5  | `npm run e2e:phase0` (+ `:live` on prod tenant)                               | **done**  | Source gate green; run `:live` before ads if creds available                                              |
| L6  | **One pilot shop** live ~1 week (real bills)                                  | **ready** | Owner runs [ONBOARDING_FIRST_SHOP](ONBOARDING_FIRST_SHOP.md) — sign-off when week complete                |
| L7  | Founding **price** on website (one package for all)                           | **done**  | `launchPricing.ts` → landing `#pricing`, license gate, FAQ, terms                                         |
| L8  | Contact form **email alerts** (Resend + Edge Function + migration 0033)       | **deferred** | Code ready; enable later — [CONTACT_FORM_EMAIL_SETUP](CONTACT_FORM_EMAIL_SETUP.md). Not needed for ads.   |

---

## P1 — First 2–4 weeks after launch (high ROI)

| ID           | Feature                                                              | Status   | Effort | Notes                                           |
| ------------ | -------------------------------------------------------------------- | -------- | ------ | ----------------------------------------------- |
| UI-1         | Symmetric UI (`patterns.tsx` on entry forms + list headers)          | **done** | —      | [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md)   |
| DEL-1        | **Archive/restore** masters + **Active/Archived** list filter; **no hard delete** in shop UI | **done** | —      | [DELETE_POLICY](DELETE_POLICY.md) (`0037`)      |
| BILL-QR-1    | Bank + payment QR on **sales invoice** print                         | **done** | —      | Settings + `BillPrintView`; balance due only (`0035`) |
| LIC-1        | Trial `trial_ends_at` + banner; `approve_tenant` / subscription      | **done** | —      | [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md)    |
| PRICE-DISP-1 | Settings: MRP vs **Selling price** on sales; excl/incl on purchase  | **done** | —      | Default MRP / Rate excl (`0035`)                |
| UNITS-1      | Custom units list in Settings                                        | **done** | —      | `0038`; product form dropdowns                  |
| **HSN-1**    | Optional **HSN code** on product form                                | **done** | —      | `0034`; products export CSV                     |
| EXP-P1       | Export: expenses / damages / returns registers                       | **done** | —      | Settings → Export period registers + backup ZIP |
| PRICE-4DEC   | Product + sale/purchase line prices up to 4 decimals               | **done** | —      | `0039` on prod; `money.ts` `numericPriceProps`  |
| NAV-P1       | Stock hub, Home dashboard, nav dedupe                                | **done** | —      | `/app/products`; `/app/stock` → redirect        |
| SUP-APP      | In-app support inquiry form + WhatsApp                             | **done** | —      | `AppSupportInquiryForm` on `/app/support`       |
| DATE-AD      | Dual BS+AD dates (AD picker + BS line below)                         | **done** | —      | Full BS picker deferred — **DATE-BS-1**         |

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

| Section         | Content (current)                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Hero            | Eyebrow + distributors/dealers headline; tax invoices, godown, credit; trial + demo CTAs             |
| Features        | 6 pillars (invoices, stock, credit, purchases, audit/export, salesman planned)                       |
| Screenshots     | `app/public/marketing/*.png` — dashboard hero + mobile app screens                                   |
| Who             | Distributors, dealers, stockists — 1 godown, 1–5 staff                                               |
| FAQ             | `/faq` + accordion on landing                                                                        |
| Pricing         | One package — `launchPricing.ts`                                                                     |
| Contact         | Form → Supabase; thank-you + WhatsApp button. L8 inbox email **deferred**                            |
| Legal           | `/privacy`, `/terms`                                                                                 |
| Login           | `/login` → app at `/app/*`                                                                           |

---

## Export / import (launch vs later)

| When             | Export                                                                                      | Import                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Launch (now)** | Tier A: products (incl. HSN), customers, stock, sales, purchases, outstanding, VAT, ZIP   | **None** — manual [ONBOARDING](ONBOARDING_FIRST_SHOP.md) |
| **P1**           | Optional extra registers (expenses, damages)                                                | —                                                        |
| **Phase 2**      | IMP-0 full ZIP                                                                              | IMP-1 templates matching export columns                  |
| **Phase 2**      | —                                                                                           | IMP-2 restore → resume business from backup              |

---

## IRD / reports at launch

| Need                                     | Status                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| Tax invoice letterhead, PAN/VAT, address | Done — [IRD_BILL_LETTERHEAD](IRD_BILL_LETTERHEAD.md) |
| Customer PAN/VAT on B2B bill             | Done — 0026                                          |
| Month-end CSV export                     | Done — Settings → Export                             |
| IRD e-filing API                         | Phase 3 — not launch                                 |
| On-screen sales book UI                  | P2 — RPT-1                                           |

---

## Archive policy (summary)

| Type                                  | Shop UI action                            |
| ------------------------------------- | ----------------------------------------- |
| Product, customer, supplier, salesman | **Archive** / **Restore** (`is_active`) — list filter Active · Archived · All |
| Open sales order                      | **Cancel** (row kept)                     |
| Posted sales/purchase bill            | **Never hard delete** — edit, return, future void |
| Payments, returns, expenses           | Reverse or soft hide later — **no hard delete** |
| **Everything**                        | **No hard delete in shop app for now**    |

Full matrix: [DELETE_POLICY.md](DELETE_POLICY.md).

---

## Price display (PRICE-DISP-1)

**Shipped (`0035`):** Settings → Bills & VAT:
- Sales: **MRP** (default) or **Selling price** unit column
- Purchase: **Rate excl** (default) or **Rate incl VAT**
- Payment QR: image URL + bank text — sales invoice when **balance due** only

Tax math unchanged; print labels only.

---

## Phase 0 complete — do not rebuild for launch

Tier A export, rebrand, stock adjustment, oversell **0024**, credit warn, shell, Share bill, support, customer VAT — see [PHASE_ROADMAP §2](PHASE_ROADMAP.md#2-already-shipped-demo-today).

---

## Sign-off

| Milestone                             | Date       | By                             |
| ------------------------------------- | ---------- | ------------------------------ |
| Phase 0 (A+B+C)                       | 2026-05-26 |                                |
| P0 marketing + legal (L3–L5, L7)      | 2026-05-26 | SPA landing, runbook           |
| Marketing polish + HSN-1              | 2026-05-26 | Hero, contact, HSN `0034`      |
| P1 product (UI, stock hub, `0037`–`0039`) | 2026-06-05 | Code + prod migrations      |
| Pilot shop (L6)                       |            | Owner — ~1 week on prod        |
| First ad live                         |            | After L2 prod smoke + L6 pilot |
| First paying tenant                   |            |                                |

**Runbook:** [P0_LAUNCH_RUNBOOK.md](P0_LAUNCH_RUNBOOK.md)

---

*Last updated: 2026-06-05 — P1 product complete; migrations through `0039` on prod; ads blocked on L2 + L6 only.*
