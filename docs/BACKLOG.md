# Product backlog (deferred & future)

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) (launch order & ops) · [Phase roadmap](PHASE_ROADMAP.md) · [Backend checklist](backend/BACKEND-TODO.md) · [Export spec](DATA_EXPORT_SPEC.md)

> **Single source of truth (SSOT)** for every feature **ID**, **status**, and **todo**.  
> **[§ Feature status index](#feature-status-index-single-source-of-truth)** below is authoritative — update here first, then sync [FIRST_LAUNCH.md](FIRST_LAUNCH.md) execution sections + [LLM_CONTEXT.md](LLM_CONTEXT.md) changelog.

---

## Feature status index (single source of truth)

**Maintainers:** One row per ID in [§ Master register](#master-register). Status values: `done` · `todo` · `ready` · `in_progress` · `deferred` · `backlog`.

### Shipped — product (`done`)

| ID | Feature |
|----|---------|
| **BRAND-1** | BikriKhata rebrand (login, PWA, package name) |
| **EXP-1** | Export Tier A (Settings → Export, CSV + partial ZIP) |
| **INV-1** | Oversell guard DB (`0024`) |
| **WEB-1** | Marketing site + `/app` SPA |
| **LIC-1** | Trial / license expiry, banners, `approve_tenant` |
| **HSN-1** | Optional HSN on product (`0034`) |
| **UI-1** | Symmetric UI — patterns, EntityList, Settings tabs |
| **DEL-1** | Archive/restore masters (`0037`) |
| **BILL-QR-1** | Payment QR + bank on balance-due bills (`0035`–`0036`) |
| **PRICE-DISP-1** | MRP vs selling price on print; purchase excl/incl (`0035`) |
| **UNITS-1** | Custom product units (`0038`) |
| **EXP-P1** | Export: expenses, damages, returns registers |
| **PRICE-4DEC** | 4-decimal product/line prices (`0039`) |
| **NAV-HUB-1** | Stock hub, Home ops dashboard, bottom nav, drawer dedupe |
| **DATE-AD** | Dual BS+AD dates (`DateFormField` + `DateDisplay`) |
| **SUP-APP** | In-app support form → `platform_inquiries` + WhatsApp |

*Phase 0 core (sales, purchase, stock, credit, VAT, Share bill, customer PAN/VAT, shell, schemes, etc.) — shipped 2026-05-26; see [PHASE0_SIGNOFF](PHASE0_SIGNOFF.md).*

### Active todo — launch & polish (`todo` / `ready`)

| ID | Feature | Status |
|----|---------|--------|
| **IRD-DISC-1** | **P0 legal** — IRD pre-verification disclaimers on sales + purchase print/PDF | shipped |
| **L2** | Prod auth smoke — confirm-email OFF, Site URL, `/register` + `/login` | ready |
| **L6** | One pilot shop ~1 week on prod (real bills) | ready |
| **DEPLOY-DOM** | `bikrikhata.com` marketing + `app.bikrikhata.com` app | todo |
| **NOTIF-FIX** | Test + fix notification bell (computed alerts) | todo |
| **NOTIF-SOUND** | Optional alert sound when urgent bell count rises | backlog |
| **LOAD-1** | Branded logo loader while app/data loads | todo |
| **THEME-1** | Dark / light theme toggle | todo |
| **WEB-CTA-1** | Landing: keep **1–2** free-trial CTAs only | todo |
| **WEB-MEDIA-1** | Demo videos + new UI screenshots + feature explain section | todo |
| **WEB-AUDIT-1** | Full landing audit after WEB-MEDIA-1 + pilot | todo |
| **BRAND-LOGO-2** | New application logo (PWA, login, shell) | todo |

*Launch ops **L0–L1, L3–L5, L7** = `done` — see [FIRST_LAUNCH § P0](FIRST_LAUNCH.md#p0--before-first-ad-operations--trust).*

### Deferred / future (`deferred` / `backlog`)

| ID | Feature | Status |
|----|---------|--------|
| **L8** | Contact form inbox email (Resend) | deferred |
| **CHANGELOG-APP** | In-app “What’s new” release notes | deferred |
| **DATE-BS-1** | BS day/month/year dropdown picker | backlog |
| **AUDIT-LOG-1** | **Activity** hub — who changed what, when, why; filter + export; revert where allowed | backlog |
| **NOTIF-2A** | DB notifications + Realtime bell | backlog |
| **ORD-*** · **CAT-PUB-*** · **RPT-1** · **CAT-1** · **UX-HUB-1** · **INV-2** · **IMP-*** · etc. | Phase 1–2 features | backlog |

Full rows: [§ Master register](#master-register). Execution order: [FIRST_LAUNCH § What's next](FIRST_LAUNCH.md#whats-next-do-in-this-order).

---

## How to maintain

1. **New idea** — Add row to [§ Master register](#master-register) with ID, phase, effort, status `backlog`.  
2. **Starting** — Set status `todo` or `in_progress`; add execution order in [FIRST_LAUNCH](FIRST_LAUNCH.md) if launch-related.  
3. **Done** — Set status `done` + date; update [§ Feature status index](#feature-status-index-single-source-of-truth); [LLM_CONTEXT](LLM_CONTEXT.md) changelog.  
4. **Do not duplicate** — No second status list elsewhere; link to this file. Implementation detail → `data-model.md` / export spec.

---

## Master register

| ID | Title | Phase | Effort | Status | Notes |
|----|--------|-------|--------|--------|-------|
| **UI-1** | Symmetric UI (`patterns.tsx`) | 1.0 | 2–3 d | **done** | 2026-06-05 — [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md) |
| **DEL-1** | Archive/restore masters + list filter; cancel draft orders; no hard delete in shop UI | 1.0 | 3–5 d | **done** | 2026-06-05 — `0037`; [DELETE_POLICY](DELETE_POLICY.md) |
| **BILL-QR-1** | Payment QR + bank on sales invoice print | 1.0 | 1–2 d | **done** | 2026-06-05 — `0035`–`0036` |
| **LIC-1** | Trial / license expiry on tenant | 1.0 | 1–2 d | **done** | `0030`, `/license-expired`, `approve_tenant`, `set_tenant_subscription` — see [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md) |
| **DATE-BS-1** | BS date picker (day/month/year dropdowns) | 1.0 | ~3 d | backlog | Not full calendar grid — see § DATE-BS-1 |
| **PRICE-DISP-1** | Configurable MRP vs rate on print | 1.0 | 2–4 d | **done** | 2026-06-05 — `0035` |
| **PRICE-4DEC** | Product + line prices up to 4 decimals | 1.0 | — | **done** | 2026-06-05 — `0039` on prod |
| **UNITS-1** | Custom units catalog in Settings | 1.0 | 2–3 d | **done** | 2026-06-05 — `0038` |
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
| **UX-HUB-1** | **Entity hub** — list + Add on top; save returns to hub; fewer back hops | 1.0 | 2–3 wk | **backlog** | § UX-HUB-1 — rollout after pilot |
| **UX-HUB-1a** | Standard **Add** button + list header (no wrap, one label) | 1.0 | 0.5 d | backlog | `AddEntityButton` everywhere |
| **UX-HUB-1b** | Post-save → hub + toast (not `navigate(-1)`) | 1.0 | 2–3 d | backlog | Masters + simple entries |
| **UX-HUB-1c** | Inline / bottom-sheet add-edit for simple masters | 1.0 | 3–5 d | backlog | Customer, supplier, product |
| **UX-HUB-1d** | Row actions: open · edit · archive (no delete) | 1.0 | 2–3 d | backlog | Swipe or ⋮ menu |
| **INLINE+** | *(merged into UX-HUB-1c)* | 1.0 | — | backlog | See **UX-HUB-1** |
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
| **EXP-P1** | Extra export registers | 1 | 2–3 d | **done** | 2026-06-05 — expenses, damages, returns |
| **NAV-HUB-1** | Stock hub, Home dashboard, bottom nav, drawer dedupe | 1.0 | — | **done** | 2026-06-05 — `/app/products`; was “NAV-P1” in FIRST_LAUNCH |
| **SUP-APP** | In-app support inquiry form + WhatsApp | 1.0 | — | **done** | 2026-06-05 — `AppSupportInquiryForm` |
| **DATE-AD** | Dual BS+AD dates (AD picker + BS line below) | 1.0 | — | **done** | 2026-06-05 — upgrade = **DATE-BS-1** |
| **NAV-P1** | Delivery note from invoice | 1 | 2–3 d | backlog | Not shipped — distinct from **NAV-HUB-1** |
| **WEB-1** | Marketing site + `/app` route | 0 launch | — | **done** | [FIRST_LAUNCH § Website](FIRST_LAUNCH.md#website-bikrikhatacom--app) |
| **MIG-0012** | Scheme Box→PCS columns | opt | 10 min | backlog | Only if cross-UOM schemes |
| **INV-1** | Block oversell in DB | 0 | — | **done** | 0024 |
| **EXP-1** | Export Tier A registers | 0 | — | **done** | partial ZIP |
| **BRAND-1** | BikriKhata rebrand | 0 | — | **done** | |
| **L8** | Contact form email alerts (Resend) | 0 ops | ~20 min | **deferred** | Code ready; enable later — 0033 + `setup:contact-email` |
| **IRD-DISC-1** | IRD pre-verification disclaimers on sales + purchase print/PDF | 0 launch | 0.5–1 d | **shipped** | Sales + purchase print/PDF — § IRD-DISC-1 |
| **DEPLOY-DOM** | Split domains: `bikrikhata.com` + `app.bikrikhata.com` | 0 launch | 2–4 h | **todo** | Netlify DNS, redirects, Supabase Auth — § DEPLOY-DOM |
| **NOTIF-FIX** | Test + fix notification bell (computed alerts) | 0 launch | 0.5–1 d | **todo** | Not NOTIF-2A DB table — fix `NotificationPanel` now |
| **LOAD-1** | Branded logo splash while app/data loads | 0 launch | 0.5–1 d | **todo** | Auth + domain bundle; PWA-friendly |
| **THEME-1** | Dark / light theme toggle | 1.0 | 2–3 d | **todo** | Tailwind `dark:`; Settings or `prefers-color-scheme` |
| **CHANGELOG-APP** | In-app release changelog / What’s new | 1.0 | 1–2 d | **deferred** | Not needed for now — use `LLM_CONTEXT.md` changelog only |
| **WEB-AUDIT-1** | Landing page audit after main features | 0 launch | 1–2 d | **todo** | Copy, hero, screenshots, mobile — post-pilot |
| **WEB-CTA-1** | Dedupe **7-day trial** buttons on landing (keep 1–2) | 0 launch | 0.5 d | **todo** | Hero + pricing; trim nav/footer/section repeats — § WEB-CTA-1 |
| **WEB-MEDIA-1** | Feature videos + new UI screenshots + restore feature explain content | 0 launch | 2–5 d | **todo** | Replace stale marketing PNGs; short demo clips — § WEB-MEDIA-1 |
| **BRAND-LOGO-2** | New application logo (PWA, login, shell, favicon) | 0 launch | 1–2 d | **todo** | [BRAND_ICON_GUIDE](BRAND_ICON_GUIDE.md); `productBrand.ts`, `public/` |
| **AUDIT-LOG-1** | **Activity** hub — tenant audit trail (owner + staff actions) | 1–2 | 2–3 wk | **backlog** | Route `/app/activity`; § AUDIT-LOG-1 — depends **COMM-2** for “employee” |
| **AUDIT-LOG-1a** | `tenant_activity_log` table + RPC write hooks | 1–2 | 3–5 d | **backlog** | Migration; append-only; no secrets |
| **AUDIT-LOG-1b** | Activity screen UI (list, filters, detail drawer) | 1–2 | 3–5 d | **backlog** | Home + Reports + drawer link |
| **AUDIT-LOG-1c** | Revert / undo from activity (entity-specific) | 1–2 | 3–5 d | **backlog** | Only where policy allows — not hard delete |
| **L2** | Prod auth smoke — register/login on prod | 0 ops | 1–2 h | **ready** | [P0_LAUNCH_RUNBOOK § L2](P0_LAUNCH_RUNBOOK.md) |
| **L6** | One pilot shop ~1 week (real bills) | 0 ops | 1 wk | **ready** | [ONBOARDING_FIRST_SHOP](ONBOARDING_FIRST_SHOP.md) |

---

## Detail — IRD-DISC-1 (pre-verification legal disclaimers) — **P0 before launch**

**Why:** BikriKhata is **not IRD-certified** for e-billing. Printed/shared documents are **working copies** only — not official legal invoices until the shop’s IRD-registered process issues the statutory document.

**Must ship before pilot week (L6) and ads** — every sales and purchase print/PDF/Share must show the disclaimer below (italic, below totals — match reference screenshots).

### Copy (exact)

| Document | Footer disclaimer |
|----------|-------------------|
| **Sales bill** (print, PDF, Share) | `* This is not the final invoice. Please contact the company for the official legal invoice.` |
| **Purchase bill** (print, PDF) | `* This is a Purchase Order, not the final invoice. Please contact the company for the official legal invoice.` |

### Implementation targets

| Surface | Files |
|---------|--------|
| Sales print / preview | `BillPrintView.tsx`, `billPdfDocument.ts`, `index.css` print rules |
| Purchase print | `PurchaseBillView.tsx`, purchase PDF path if any |
| Settings | Do **not** rely on free-text `bill_footer` only — **default-on** system disclaimer; optional future `tenant_settings.ird_certified` to hide when IRD-integrated |

### Acceptance

- Disclaimer visible on browser print preview and downloaded PDF for sales + purchase.
- Survives Share bill flow.
- `e2e:bill` or `e2e-tier-c` source grep for disclaimer strings.
- Manual: print one sales + one purchase bill; disclaimer readable at bottom.

**Later:** IRD API / certified e-bill → Phase 3 ([GTM_NEPAL §5](GTM_NEPAL.md)); remove or replace disclaimer when legally cleared.

---

## Detail — DEPLOY-DOM (split domains)

**Goal:** Marketing on **`https://bikrikhata.com`**; product on **`https://app.bikrikhata.com`**.

| Layer | Action |
|-------|--------|
| **DNS** | `bikrikhata.com` → Netlify (landing); `app.bikrikhata.com` → same or second Netlify site |
| **Netlify** | Option A: two sites (marketing repo path vs `app/` build). Option B: one site + subdomain redirect rules |
| **App routes** | Marketing `/`, `/privacy`, `/faq`, `/login`, `/register`; app `/` → redirect to `/app/home` on app subdomain |
| **Supabase Auth** | **Site URL** = `https://app.bikrikhata.com`; **Redirect URLs** include both domains + localhost |
| **Links** | Landing CTAs → `https://app.bikrikhata.com/login`; marketing footer unchanged |

**Acceptance:** Register/login on app subdomain; landing CTAs open app; no broken auth redirect.

---

## Detail — NOTIF-FIX (bell QA — not live DB yet)

**Scope:** Fix **computed** alerts in `NotificationPanel.tsx` (overdue bills, low stock, license renewal). **NOTIF-2A** (DB + Realtime) stays deferred.

**Test:** Manual §3.0b T0B7, G17; Settings overdue/due-soon days match bell list; tap opens correct route (`/app/products?filter=low`, overdue list).

---

## Detail — LOAD-1 (branded loader)

Show BikriKhata logo (from `productBrand.ts` / PWA icon) full-screen while:
- Supabase session resolving
- First `fetchDomainBundle` / license gate

Hide when shell ready or timeout with retry. No blank white flash on 3G.

---

## Detail — THEME-1 (dark / light)

- Toggle in **Settings → Business** or follow `prefers-color-scheme` with manual override
- Tailwind `class` strategy on `<html>`; persist choice
- Bill print stays light (print CSS unchanged)

---

## Detail — CHANGELOG-APP (in-app release notes) — **deferred**

**Status:** Not needed for now. Ship history stays in **`docs/LLM_CONTEXT.md`** changelog for dev/agents.

Revisit when dealers ask for in-app “What’s new” after updates (Settings card or post-deploy banner).

---

## Detail — WEB-AUDIT-1 (landing audit)

**When:** After pilot week + main app features stable.

**Checklist:** Hero matches product (stock hub, tax invoice); pricing = `launchPricing.ts`; FAQ accurate; mobile layout; contact form; `/login` links to app domain if **DEPLOY-DOM** shipped.

**Also track:** **WEB-CTA-1** (trial button count), **WEB-MEDIA-1** (videos + screenshots + feature copy).

Refs: [MARKETING_SCREENSHOTS_PLAN](MARKETING_SCREENSHOTS_PLAN.md), [MARKETING_HERO_IMAGE_BRIEF](MARKETING_HERO_IMAGE_BRIEF.md).

---

## Detail — WEB-CTA-1 (trial CTA dedupe)

**Problem:** Landing has too many **7-day free trial** / register CTAs (nav, hero, features, pricing, footer, contact, etc.) — feels repetitive.

**Goal:** Keep **1–2 primary trial CTAs** (e.g. hero + pricing block). Secondary links → **Log in** or **Contact** only.

**Files:** `PublicSignupCta.tsx`, `MarketingNav.tsx`, `MarketingFooter.tsx`, landing sections, `publicSignup.ts` / `launchPricing.ts` labels.

**Acceptance:** Count visible trial CTAs above fold + full scroll ≤ 2 trial-primary buttons; `e2e:p0-public` still passes.

---

## Detail — WEB-MEDIA-1 (videos, screenshots, feature storytelling)

**Problem:** Past landing trim removed useful **feature explain** content and **app screen** visuals (`#why-switch` band removed 2026-05-26). Marketing PNGs are **stale** vs P1 UI (stock hub, Home dashboard, compact lists, Settings tabs).

**Goal:**

| Deliverable | Notes |
|-------------|--------|
| **Fresh screenshots** | Capture from prod/dev: Home, sales invoice, stock, bill print, export — `app/public/marketing/*.png` |
| **Short demo videos** | 30–90 s clips or embedded YouTube: billing, stock, credit, export (Nepali or bilingual voice optional) |
| **Feature explain section** | Restore clear “what you get” band — not competitor comparison; pillars + screenshot or video per feature |
| **Phone row** | Update 4-phone marketing row per [MARKETING_SCREENSHOTS_PLAN](MARKETING_SCREENSHOTS_PLAN.md) |

**Not in scope:** Full video production agency; start with screen recordings + light edit.

**Acceptance:** Landing shows current UI; at least one video or animated GIF per major pillar; owner sign-off before ads scale.

---

## Detail — BRAND-LOGO-2 (application logo refresh)

Replace BikriKhata mark in:

| Surface | Path / config |
|---------|----------------|
| PWA / favicon | `app/public/`, `vite.config.ts` manifest |
| Login / register | marketing + app auth pages |
| App shell | header, loader (**LOAD-1**) |
| Source of truth | `app/src/config/productBrand.ts`, [BRAND_ICON_GUIDE](BRAND_ICON_GUIDE.md) |

**Acceptance:** Sharp on retina + PWA install; teal brand color unchanged unless brief says otherwise.

---

## Detail — UX-HUB-1 (entity hub + entry flow — one standard for whole app)

**Why:** Dealers want **fewer pages** and **less back-button** — list stays the “home” for each data type; add/edit should feel fast and predictable (Tally/BUSY: register open, voucher entry, back to register).

**Discuss first, then roll out** — not launch-blocking; pilot can use current list → form → back flow.

### Recommended approach (single standard)

**Pattern A — Hub page (default for every entity type)**

```
┌─────────────────────────────────────┐
│  [optional back]     [+ Add customer]│  ← ListPageHeader / AddEntityButton
│  Customers                           │
├─────────────────────────────────────┤
│  Search · filters · export           │  ← ListBrowsePanel
├─────────────────────────────────────┤
│  Row → tap opens detail              │  ← EntityListCard
│  Row → ⋮ Edit · Archive              │  ← UX-HUB-1d (no Delete)
├─────────────────────────────────────┤
│  pagination                          │
└─────────────────────────────────────┘
```

| After save | Go to |
|------------|--------|
| **Simple master** (customer, supplier, product) | **Same hub** + toast “Saved” (optional: open detail) |
| **Transaction** (payment, expense, damage) | **Hub or detail** of parent (e.g. customer detail), not `navigate(-1)` |
| **Complex document** (sales bill, purchase) | **Bill/purchase detail** (print/share) — list reachable via hub tab |

**Pattern B — Full-page form (keep for heavy entry only)**

- Sales invoice, purchase with lines, daily cash close.
- Header: `FormPageHeader` + **back to hub** (explicit `backTo="/app/purchases"`), not browser history.

**Pattern C — Inline / sheet (Phase 1b — simple masters only)**

- Add customer from customer list **without route change** (bottom sheet or slide-over).
- Edit 3–5 fields → Save → sheet closes, list row updates.
- Reduces pages; **UX-HUB-1c** / former **INLINE+**.

**Not in v1 hub standard**

- Hard **Delete** on lists — use **Archive** + [DELETE_POLICY](DELETE_POLICY.md).
- Different Add button styles per screen — one `AddEntityButton`.

### “Add entry” button (your screenshot)

| OK | Fix |
|----|-----|
| Teal primary, `+` icon, top-right on overview | Good — matches brand |
| Label **“Add entry”** wrapping to two lines on narrow width | Use **short labels**: `Add capital`, `Add customer`, `Add product` |
| One-off `Button` on Company overview | Roll into **`AddEntityButton`** + `whitespace-nowrap` (**UX-HUB-1a**) |

**Reference implementation today:** `ListPageHeader` + `AddEntityButton` on `ProductsPage`, `CustomersPage`, `PurchasesPage` hub.

### Entity rollout map (when we implement)

| Entity | Hub route | Add | Edit | After save |
|--------|-----------|-----|------|------------|
| Products | `/app/products` | top Add | detail or sheet | hub |
| Customers | `/app/customers` | top Add | detail / sheet | hub or customer detail |
| Suppliers | `/app/suppliers` | top Add | detail | hub |
| Purchases | `/app/purchases` | top Add | `/purchases/:id` | purchases hub |
| Payments | `/app/customers/:id` or payments hub (future) | tabs | — | customer detail |
| Capital | `/app/capital` list (new hub) or company | Add capital | edit row | capital list |
| Expense / damage / scheme | optional hub lists | + from Home | full form | hub when built |

### Delivery phases

| ID | Deliverable |
|----|-------------|
| **UX-HUB-1a** | One Add button component; grep replace ad-hoc “Add entry” |
| **UX-HUB-1b** | `commit*` success handlers → `navigate(hub)` + toast matrix |
| **UX-HUB-1c** | Sheet add/edit for customer (pilot), then product, supplier |
| **UX-HUB-1d** | Row ⋮ menu component shared across `EntityListCard` |
| Docs | Update [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md) + manual checklist |

### Acceptance (owner)

1. Every master list has **same** top-right Add control.  
2. Saving a new customer returns to **customer list** without pressing back.  
3. No **Delete** on lists; Archive only.  
4. Complex bills still use full form; user always knows how to get back to list (hub tab or explicit back).

Refs: [UI_CONSISTENCY_PLAN](UI_CONSISTENCY_PLAN.md) entity hub template; **UI-1** done (chrome only).

---

## Detail — AUDIT-LOG-1 (Activity hub — professional audit trail)

**Why:** Business owners (and later staff) need one place to answer: *Who changed this? When? Why? Can we undo it?* — same expectation as Tally **alteration log**, BUSY/Marg **audit trail**, or Xero **history**.

**Not launch-blocking** — ship after pilot (L6). Payment reversal (`0043`) is the first slice; full Activity hub is Phase 1+.

### What exists today (partial)

| Area | Today | Gap |
|------|--------|-----|
| Payment reverse | `payments.reversed_at`, `reversal_reason`; Customer → Payments → **Reversed** | No **who** reversed; not in central list |
| Bill edit | Row kept; totals via RPC | No amendment timeline UI (**TRUST-1**) |
| Masters | Archive/restore (`0037`) | No central log of who archived |
| Settings | Saved to `tenant_settings` | No diff log |

### Target UX — **Activity** screen

| Item | Spec |
|------|------|
| **Route** | `/app/activity` (also **Reports hub** + **Home → Business overview** + drawer **Activity**) |
| **Audience** | Tenant **owner** sees all; **staff** sees own actions when **COMM-2** ships |
| **List columns** | Date/time (AD + BS), **User** (name/email), **Action** (created / edited / reversed / archived), **Entity** (bill, payment, product, …), **Summary** (e.g. “INV-12 · NPR 5,000”), **Reason** (if required) |
| **Filters** | Date range, user, action type, entity type, search (bill no., customer name) |
| **Detail** | Tap row → before/after snapshot (JSON diff for settings), link to live record, link to related reversal |
| **Export** | CSV “Activity register” for CA / dispute (Tier A style) |

### Events to log (Phase 1)

| Category | Actions | Reason required? |
|----------|---------|------------------|
| Sales bill | create, edit (cap paid, lines, discount) | On material total change |
| Purchase | create, edit, due-date settle | On paid cap / total change |
| Payment | receive, advance, **reverse** | Reverse always |
| Return | create | Optional |
| Expense / damage / stock adj. | create | Optional |
| Supplier payment | create | Optional |
| Master | archive, restore | Optional |
| Settings | save (keys only, no API keys) | — |
| Daily cash | close | — |

**Write path:** security-definer helper `log_tenant_activity(...)` called from existing RPCs (`create_sales_bill`, `reverse_customer_payment`, `upsert` paths, etc.) — **never** only from React.

### Revert / undo policy (professional norm)

Align with [DELETE_POLICY](DELETE_POLICY.md) — **ledger rows are not deleted**.

| Entity | From Activity UI | Correct action |
|--------|------------------|----------------|
| Payment | **Revert** → same as Reverse (reason pre-filled or new) | `reverse_customer_payment` |
| Sales / purchase bill | **No delete** | Edit bill, or return/credit note, or void (future) |
| Master archive | **Restore** | `set_*_active(true)` |
| Settings | **No auto-revert** | Show diff; user re-saves manually |
| Stock / expense | **No undo** (v1) | Opposing entry (future) |

Activity shows **Revert** only when an RPC exists — greyed + tooltip otherwise (“Edit the bill or post a return”).

### Data model (sketch — **AUDIT-LOG-1a**)

Table `tenant_activity_log` (append-only, RLS by `tenant_id`):

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| tenant_id | uuid | |
| actor_user_id | uuid FK → auth.users | Who did it |
| actor_email | text | Denormalized for list display |
| action | text | `payment.reversed`, `sale.created`, … |
| entity_type | text | `payment`, `sales_bill`, `product`, … |
| entity_id | uuid | Nullable |
| entity_label | text | e.g. `INV-1042`, `Roman Days Hotel` |
| reason | text | User-entered when required |
| metadata | jsonb | Amounts, diff summary, related ids |
| created_at | timestamptz | Server time |

Indexes: `(tenant_id, created_at desc)`, `(tenant_id, entity_type, entity_id)`.

**Quick win before full hub:** add `reversed_by uuid` on `payments` + backfill from `auth.uid()` in `reverse_customer_payment`.

### Delivery phases

| ID | Deliverable | Effort |
|----|-------------|--------|
| **AUDIT-LOG-1a** | Migration + `log_tenant_activity` + hooks on payment reverse, bill create/edit, archive | 3–5 d |
| **AUDIT-LOG-1b** | `/app/activity` UI + export row | 3–5 d |
| **AUDIT-LOG-1c** | Revert/Restore shortcuts from activity rows | 3–5 d |
| **COMM-2** | Owner vs staff roles (filter “my actions” vs “all”) | 4–7 d |
| **TRUST-1** | Per-bill amendment timeline (subset of activity) | 2 d |
| Platform | Super-admin read-only (**PLAT-1**) + Sentry | Phase 2 |

### Acceptance (owner sign-off)

1. Reverse a payment in app → Activity shows row with user, time, reason, NPR amount.  
2. Edit a sales bill total → Activity shows edit + link to bill.  
3. Filter last 7 days + export CSV opens in Excel.  
4. No hard delete anywhere; Revert on payment matches customer balance.

Refs: **TRUST-1**, **COMM-2**, [DELETE_POLICY](DELETE_POLICY.md), `data-model.md` (update when **AUDIT-LOG-1a** ships).

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

## Detail — DATE-BS-1 (Nepali date in picker)

**Problem:** Native `<input type="date">` popup is **English (AD) only** — browsers do not support BS inside the calendar. Today: pick AD → app shows `22/02/2083 (5 Jun 2026)` on a line below (`DateFormField` + `DateDisplay`).

**Goal:** Dealer picks dates in **Bikram Sambat first** (forms, filters, reports, license expiry).

**Chosen approach (not in scope):** ~~Full Nepali calendar month grid~~ — too heavy for mobile; **do not build** grid picker.

**Ship:** **BS dropdowns** — day / month / year `<select>` in Bikram Sambat; compact AD preview on same row (`22/02/2083 · 5 Jun 2026`). Use `bikram-sambat` (or similar) for accurate BS↔ISO; retire approximate `toMiti` in `utils.ts` for form picks.

**Scope when promoted:** `DateFormField` everywhere (sales due date, bill date, purchase, payment, export range, Settings license, list filters). Store **ISO (AD)** in DB unchanged.

**Acceptance:** Pick BS date on phone → correct ISO saved; reopen shows same BS+AD; e2e date conversion tests; manual checklist § dates.

**Current (Phase 0):** AD native picker + BS line below — no custom picker.

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

*Last updated: 2026-06-05 — **IRD-DISC-1** P0 legal disclaimers before launch (not IRD e-bill certified).*
