# Phase 1 — Manual E2E test checklist (complete)

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Automated E2E](./phase1-use-cases-and-tests.md) · [Testing live](./testing-live-supabase.md) · [Data model](./data-model.md)

Use this **one document** for everything scripts do **not** fully cover, plus step-by-step manual tests for **every feature**, edge case, and calculation check.

**Phase 0 Tier A (2026-05-26):** Signed off — [`../PHASE0_SIGNOFF.md`](../PHASE0_SIGNOFF.md). Apply migrations **`0019`–`0023`** before §3.2 Settings / Export / stock tests.

**Phase 0 Tier B (2026-05-26):** Signed off — migration **`0024`**, deploy — [`../PHASE0_SIGNOFF.md`](../PHASE0_SIGNOFF.md).

**Companion (automated):** [`phase1-use-cases-and-tests.md`](./phase1-use-cases-and-tests.md)  
**Run scripts first:** `npm run e2e:phase0` (Tier A+B+C source) then `e2e:phase0:live` if DB touched; full regression: `e2e:full` (needs `npm run dev` for UI part)

**Phase 0 Tier C:** Signed off — [`../PHASE0_SIGNOFF.md`](../PHASE0_SIGNOFF.md). **This doc is the master** for all manual rows.

---

## Maintaining this checklist (required on every feature)

When you **add, change, or remove** a user-facing feature, update **this file in the same PR** as code (with e2e scripts — see [§ Keeping tests in sync](./phase1-use-cases-and-tests.md#keeping-tests-in-sync-required-on-every-change)):

| Step | What to do |
|------|------------|
| 1 | Add or edit a row in **§2 Feature catalog** (module + routes). |
| 2 | Add step-by-step rows under the right **§3.x** section (or create `§3.xx` for a new module). |
| 3 | If scripts cannot cover it, add a **§1 Gaps** row (G#). Remove obsolete G# when automated. |
| 4 | For Phase 0 tiers, use **§3.0a–c** below; historical tier lists in `docs/archive/YOUR_TURN_*.md`. |
| 5 | Note new migrations in **§0** and [supabase README](../../app/supabase/README.txt). |
| 6 | On release, tick **§6 Sign-off** (automated + manual suites). |

Agents: `.cursor/rules/docs-on-change.mdc` enforces doc + e2e + manual checklist together.

---

## Phase 0 manual index (A · B · C)

| Tier | What shipped | Manual section | Automated |
|------|----------------|----------------|-----------|
| **A** | Export tab, product categories, stock adjustment, list page size, district on bill, rebrand | [§3.0a](#30a-phase-0--tier-a-man-t0a) | `e2e:tier-a` / `e2e:export` |
| **B** | Oversell block (0024), PageBackLink, VAT address validation, credit warning, notifications | [§3.0b](#30b-phase-0--tier-b-man-t0b) | `e2e:tier-b` / `e2e:tier-b:live` |
| **C** | Bottom tabs, drawer, Reports hub, Support, Share bill, Home tabs, customer PAN/VAT | [§3.0c](#30c-phase-0--tier-c-man-t0c) | `e2e:tier-c` / `e2e:phase0` |

---

## 0. Before you start

| Item | Action |
|------|--------|
| Migrations | `0001`–`0003`, **`0005`**–`0010`, **`0013`–`0017`**, **`0019`–`0026`**, **`0034`–`0039`** per [supabase README](../../app/supabase/README.txt) |
| Env | `app/.env.local` has `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| Test user | `node scripts/create-e2e-user-and-test.mjs` → `app/.e2e-credentials.local` |
| Tenant | `tenants.status = 'active'` for your user |
| App | `cd app && npm run dev` → http://localhost:5173 |
| Supabase | Dashboard → Table Editor / SQL Editor to verify rows |
| Print test | Use browser Print preview (Cmd+P) where noted |

**Record:** tester name, date, build/commit, pass/fail per row.

---

## 1. What automated scripts do NOT cover (you must test manually)

Check each row after manual testing.

| # | Area | Scripts cover | You must verify manually |
|---|------|---------------|---------------------------|
| G1 | **Bill edit (success)** | Only “blocked” toast in live | Full edit flow when Phase 2-D ships; until then confirm block message is clear |
| G2 | ~~Supplier add in UI~~ | **Shipped** | Add supplier + **Edit supplier** on list expand / purchase history |
| G3 | **Every `tenant_settings` field** | Footer, prefix, name, overdue, markup | Phone, address, PAN, VAT flags, due_soon_days, default_min_qty, legal_name, etc. |
| G4 | **Line-level discount %** on sale | — | Change product discount %; confirm line amount and grand total |
| G5 | **Bill discount % vs flat** | Flat discount in API matrix | Toggle % vs NPR on sale form; verify sticky totals |
| G6 | **Bill terms / extra charges** | `extra_charges` in API | Add bill terms % or NPR; VAT on/off; match print + DB |
| G7 | **VAT computed from lines** | Fixed `vat_amount` in API | Enable VAT per product; 13% on eligible lines only |
| G8 | **Multi-line sale (UI)** | API multi-line | 2+ products on one bill; preview + print layout |
| G9 | **Payment: multi-bill allocation** | Single-bill API | Pay customer with 2+ open bills; partial on each |
| G10 | **Payment: over-allocation** | — | Enter pay amount &gt; selected bills; UI should prevent or warn |
| G11 | **Return: partial credit** | Full credit cap in API | Return 1 line only; credit &lt; bill open |
| G12 | **Purchase: multi-line PO** | Single line in API | 2 products on one purchase; stock for both |
| G13 | **Supplier pay: multiple POs** | One PO in API | Two unpaid POs; one payment; FIFO which PO gets paid |
| G14 | **Opening stock ≠ 0** | Tests assume opening 0 | Product with opening stock; after sale/purchase/damage/return check Stock page |
| G15 | **Customer credit limit** | — | Sale pushing outstanding over limit (if UI enforces) |
| G16 | **Customer PAN / VAT on print** | DB + form in `e2e:tier-c:live` | Bill print shows buyer PAN/VAT when filled (0026); layout readable |
| G17 | **Notifications panel** | Link targets in source | Bell list; tap low-stock → `/app/products?filter=low`; overdue → sensible route |
| G18 | **Daily cash → Supabase** | Partial wiring | Confirm `daily_cash` row behaviour matches current implementation |
| G19 | **Scheme → Supabase** | Menu → Entry → Scheme save | Row in `scheme_tracker`; sale qty 10 → free line if buy-10-get-1 |
| G20 | **Dashboard charts** | — | `/app/dashboard` loads; data matches your tenant (if wired) |
| G21 | **Company overview maths** | Partial live capital | Net worth, assets, liabilities vs your entries + stock |
| G22 | **Capital edit / history / soft-delete** | Insert + list | Edit entry, view history (Phase 2-C); delete behaviour |
| G23 | **Bill print / PDF** | Footer text in UI script | Full A4 layout, logo, line wrap, browser print to PDF |
| G24 | **RLS / second tenant** | Optional API if service key | Second login cannot see first tenant’s customers/bills |
| G25 | **Register + pending approval** | — | New signup → pending → activate → login |
| G26 | **Offline / PWA** | — | Refresh mid-form; install PWA if used |
| G27 | **Mobile layout** | UI script uses mobile width | Real phone: sticky bar, pickers, bottom nav |
| G28 | **Log out + re-login** | Live script | Data still correct; no stale header name |
| G29 | **MissingSupabaseEnv** (`VITE_*` unset) | — | App shows setup screen; no data access |
| G30 | **Performance** | — | Customer/product lists with 100+ rows; search |

---

## 2. Feature & use case catalog (Phase 1)

| Module | Use cases | Route / entry |
|--------|-----------|----------------|
| **Auth** | Log in, register, pending tenant, no tenant, log out | `/login`, `/register`, `/pending-approval`, `/no-tenant` |
| **Home** | `DateDisplay` (BS + AD); today KPIs; attention cards; **6** quick-action tiles; categorized overview (Receivables, Payables, Business position, Reports & data); recent bills | `/app/home`, `/app/home/overdue`, `/app/home/outstanding`, … |
| **Stock** | Product/inventory hub — title **Stock**, on-hand qty, **Add purchase** | `/app/products`, `/app/products?filter=low`; `/app/stock` redirects here |
| **Settings** | Tabbed: Business, Bills & tax, Catalog & stock, Data & account | `/app/settings` |
| **Customers** | List (`EntityList`), filter outstanding, add, edit, detail, new bill | `/app/customers`, `.../new`, `.../edit/:id`, `.../:id` |
| **Products** | List, search, add, edit, archive/restore, 4-dec prices | `/app/products`, `/app/products/new`, `.../edit/:id` |
| **Suppliers** | List, detail, add/edit (`EntityList`) | `/app/suppliers`, `…/new`, `…/:id`, `…/edit/:id` |
| **Stock adjustment** | Manual +/- qty when enabled | `/app/stock-adjustment/new` |
| **MRP stickers** | Saved designs (history, multi-select print), designer with live preview + A4 sheet print (`0045`) | `/app/mrp-stickers`, `…/new`, `…/edit/:id` |
| **Sale** | New bill, edit existing (`update_sales_bill`), preview, print | `/app/sales/new`, `/app/sales/edit/:billNo` |
| **Bill detail** | View, **Share**, Print, PDF, Return, **Collect** (green), Edit | `/app/bills/:billNo` |
| **Payment** | Customer payment, bill allocation | `/app/payments/new` |
| **Return** | Return against bill, stock back, credit | `/app/returns/new` |
| **Purchases hub** | Invoice list (paid/unpaid filter, by supplier, sort), Suppliers tab, new invoice | `/app/purchases` |
| **Purchase entry** | Stock in, supplier payable, due date | `/app/purchases/new` |
| **Supplier payment** | Pay down POs | `/app/supplier-payments/new` |
| **Expense** | Record expense | `/app/expenses/new` |
| **Damage** | Stock out | `/app/damages/new` |
| **Daily cash** | Draft, lock day (partial Supabase wiring) | `/app/daily-cash` |
| **Scheme** | Promo on product (UI; DB TBD) | `/app/schemes/new` |
| **Company** | Overview, capital KPIs | `/app/company` |
| **Capital** | List, add entry | `/app/capital`, `/app/capital/new` |
| **Dashboard** | Private reports | `/app/dashboard` |
| **Menu (☰)** | Drawer: Masters, Entry, Reports, Support | Header left |
| **Reports** | Reports hub (replaces old More) | `/app/reports` |
| **Support** | Inquiry form → `platform_inquiries` + WhatsApp; platform contacts | `/app/support` |

---

## 3. Manual test procedures (step-by-step)

Use **Pass / Fail / N/A** and notes. Verify in **Supabase** where indicated.

---

### 3.0 Phase 0 — Tier A (MAN-T0A)

Migrations **0019–0023**. Automated: `npm run e2e:tier-a` (+ `:live`).

| # | Step | Pass |
|---|------|------|
| T0A1 | Header **Settings** (gear) → `/app/settings` | |
| T0A2 | **Export** tab → download **Products** CSV → open in Excel (UTF-8, header row) | |
| T0A3 | **Business** → add category (e.g. Snacks) → Save → **Products → New** | Category in dropdown + filters |
| T0A4 | New product: **Opening qty** on create only → **Stock** tab on Home | Opening / on-hand visible |
| T0A5 | **Stock** tab in Settings → enable **Allow stock adjustment** → Save | Drawer → Stock adjustment entry |
| T0A6 | Stock adjustment +5 on a SKU → Home **Stock** tab | On-hand +5 |
| T0A7 | **Rows per page** (e.g. 20) → Save | Lists paginate consistently |
| T0A8 | VAT registered + VAT number → sales bill **Print** | Title **TAX INVOICE** |
| T0A9 | Toggle **district/province on bill** → print | District appears only when on |
| T0A10 | Login / branding | **BikriKhata** on login screen | |

---

### 3.0b Phase 0 — Tier B (MAN-T0B)

Migration **0024**. Automated: `npm run e2e:tier-b` (+ `:live` includes oversell RPC).

| # | Step | Pass |
|---|------|------|
| T0B1 | Product form → **Back** → previous screen (not blank) | |
| T0B2 | Settings → **Back** | |
| T0B3 | VAT registered ON, address incomplete → **Save blocked** with clear message | |
| T0B4 | VAT registered ON, address + VAT number filled → Save OK | |
| T0B5 | Sale over customer **credit limit** → **warning**; bill can still save if you proceed | |
| T0B6 | Sale qty **greater than on-hand** → error; bill not saved (0024) | |
| T0B7 | Notifications bell → tap overdue / low-stock items | Opens correct screen (e.g. stock tab for low stock) |
| T0B8 | Edit existing bill: change qty within stock | Saves via `update_sales_bill` |

---

### 3.0c Phase 0 — Tier C (MAN-T0C)

Migrations **0025** (optional), **0026** (customer tax). Automated: `npm run e2e:tier-c` / `npm run e2e:phase0`.

| # | Step | Pass |
|---|------|------|
| T0C1 | Bottom tabs: **Home · Customers · + · Stock · Reports**; centre **+** opens quick entry sheet | |
| T0C2 | **Customers** tab → `/app/customers`; **Stock** → `/app/products` (title **Stock**) | |
| T0C3 | Header **☰** drawer: **Masters**, **Entry**, **Reports**, **Support** links work | |
| T0C4 | `/app/more` → redirects to **Reports** | |
| T0C5 | **Help & support** — BikriKhata (platform) contact; not shop retail helpline | |
| T0C6 | **No Support tab** in Settings (help only via menu) | |
| T0C7 | Home: **DateDisplay** (BS + AD), today strip, attention cards, **6** quick-action tiles, overview sections (Receivables / Payables / Business position / Reports & data) | |
| T0C8 | Customer form: optional **PAN / VAT** → save → print bill with customer | |
| T0C9 | Bill detail: **Share** (outline) + Print + PDF; **Collect** green when balance due | |
| T0C10 | **Products** / **Suppliers** masters: same **Add** button style ([UI_CONSISTENCY_PLAN](../UI_CONSISTENCY_PLAN.md)) | |

---

### 3.0d P1 product (MAN-P1) — UI, pricing, support

Migrations **0034**–**0039** on prod. Automated: `npm run e2e:tier-c` / `e2e:phase0`.

| # | Step | Pass |
|---|------|------|
| T1P1 | **Stock** tab → page title **Stock**; each row shows on-hand qty; **Add purchase** works | |
| T1P2 | Product form → buy price **98.4567** → save → reopen → value still **98.4567** (`0039`) | |
| T1P3 | Sales line + purchase line accept 4-decimal rates; bill **grand total** still 2-dec NPR | |
| T1P4 | **Customers** / **Suppliers** / **Stock** lists — compact divided rows (`EntityList`, 2 lines max) | |
| T1P5 | Sales invoice due date — AD picker + **BS line below** (`DateFormField`) | |
| T1P6 | **Support** → submit inquiry → row in `platform_inquiries` → WhatsApp button | |
| T1P7 | Settings tabs: **Business · Bills & tax · Catalog & stock · Data & account** | |
| T1P8 | Archive product → **Archives** hub or Active/Archived filter → restore (`0037`) | |
| T1P9 | Settings → Bills & tax → upload payment QR → balance-due sales bill print shows QR (`0035`–`0036`) | |
| T1P10 | Settings → Business → custom units → product form unit dropdown (`0038`) | |

| T1P11 | **IRD-DISC-1** — Sales print/PDF/Share shows: *This is not the final invoice…* | |
| T1P12 | **IRD-DISC-1** — Purchase print shows: *This is a Purchase Order, not the final invoice…* | |

---

### 3.0e P0 marketing (MAN-P0) — pre-ads

Automated: `npm run e2e:p0-public` (included in `e2e:phase0`). Runbook: [P0_LAUNCH_RUNBOOK.md](../P0_LAUNCH_RUNBOOK.md).

| # | Step | Pass |
|---|------|------|
| P0M1 | `/` landing: hero **bill** (fits frame), **3 mobile screens**, distributor section, pricing checklist, CTAs | |
| P0M2 | `/privacy` and `/terms` readable; footer links from landing | |
| P0M3 | `/register` → creates pending workspace → `/pending-approval` (call/contact); after `approve_tenant` in SQL → `/app/home` + trial banner | |
| P0M4 | Signed in: visit `/` → redirects to `/app/home` | |
| P0M5 | Unknown URL → `/` (not forced to login) | |
| P0M6 | **`/#faq`** or **`/faq`** — expand **What is BikriKhata?** and **Can I sign up on the website by myself?**; trial/pricing match `#pricing`; no IRD e-file claims | |
| P0M7 | Footer **FAQ** link scrolls to section | |

---

### 3.0d Navigation & shell (MAN-NAV) — cross-tier

| # | Step | Pass |
|---|------|------|
| NAV1 | Bottom **Home** highlights on `/app/home` (no tab query) | |
| NAV2 | From customer detail → back → sensible screen | |
| NAV3 | Reports hub links (outstanding, dashboard, company, export hint) | |
| UI1 | New form pages use **FormPageHeader** + **PageBackLink** where expected | |

---


### 3.1 Auth & tenant (MAN-AUTH)

| ID | Steps | Expected |
|----|-------|----------|
| A1 | Open `/login` with valid E2E credentials → Log in | Lands on `/app/home`; header shows shop name from settings |
| A2 | Wrong password | Error message; stay on login |
| A3 | Sign out from Settings | Redirect to `/login`; cannot open `/app/home` without login |
| A4 | **(Live)** Register new business on `/register` | Success or email-confirm message per Supabase config |
| A5 | **(Live)** If tenant `pending` | `/pending-approval`; after `active` in DB, refresh → home |
| A6 | **(Live)** User with no `tenant_users` row | `/no-tenant` page |

---

### 3.2 Settings — tabs (MAN-SET)

| # | Step | Pass |
|---|------|------|
| STab1 | Header **Settings** icon → `/app/settings` | |
| STab2 | **Export** tab → download Products CSV; open in Excel (UTF-8 header row) | |
| STab3 | **Business** → **Rows per page** (e.g. 20) → Save | Applies to customers, products, stock, suppliers — not stock-only |
| STab3b | **New product** → category **Add** (e.g. “Beverages”) | Category in dropdown + filters; no Settings step |
| STab4 | **Stock** tab → stock adjustment toggle → Save | Menu → Masters shows Stock adjustment when enabled |
| STab6 | Menu → **Help & support** (`/app/support`) | Phone, email, WhatsApp from `PLATFORM_SUPPORT` in app config |
| STab7 | Settings tabs: **no Support tab** (Tier C) | Only Business, Bills & VAT, Stock, Export |
| STab8 | **Subscription** card (bottom, above Log out) | Plan label, valid-until date, days remaining; warn styling when ≤30 days |
| STab9 | Tenant with ≤30 days on trial or paid plan | Amber header banner; bell → **Other** shows subscription alert; first open of day → renewal bottom sheet |
| STab10 | Tenant with &gt;30 days on annual plan | No renewal popup on open; Settings still shows subscription days |
| STab5 | VAT registered + VAT number → print sales bill title **TAX INVOICE** | |
| STab5b | PAN only (not VAT) → print sales bill title **SALES INVOICE** | |
| STab5b | Bill letterhead: **Address line 1** only by default; **VAT/PAN** + **Ph** right | Toggle “Include district and province on invoices” to add admin line |
| STab5c | Address line 1 on bill matches Settings; district not on bill until toggle | |

### 3.2b Settings — all fields (MAN-SET)

| ID | Steps | Expected |
|----|-------|----------|
| S1 | Open Settings; wait for load | All fields populated (not blank forever) |
| S2 | Change **trading name** + **region** → Save | Toast “Settings saved”; **header** updates without hard refresh |
| S3 | Set phone, mobile, email, full address, district, province | Save → reload page → values persist (`tenant_settings`) |
| S4 | PAN, VAT registered toggle, VAT number | Save → DB columns match |
| S5 | Invoice prefix e.g. `TST` | New bill number starts with `TST-` |
| S6 | Bill footer multi-line text | Save → open new bill **Print preview** → footer visible |
| S7 | Overdue days = `7`, Due soon = `3` | Save → (notifications/home use these when live) |
| S8 | Default markup % and min qty | New product form pre-fills or hints use these |
| S9 | **Default VAT %** e.g. 13 | Product buy hint and purchase totals use this rate |
| S10 | **Edge:** Save with empty trading name | Validation error or safe default |
| S11 | Settings → **Rate (selling price)** → Save → new sale | Line total = **Qty × Rate**; print column **Rate**; Amt = Rate × Qty |
| S11b | Settings → **MRP + line discount** → product with line Disc% | Print shows **MRP** + **Disc%**; Amt = MRP × Qty × (1−Disc%) |
| S11c | Reopen saved bill MXMPRV-28 (or any) → Print | MRP/Rate column matches Amt (no 100 vs 1,500 mismatch) |
| S11d | Product with 18 PCS/Ctn → sale **1 Ctn** → Print | Rate ≈ per-PCS (e.g. 58.48); Qty `1 Ctn (18 PCS)`; Amt = internal line total; PDF download matches print |
| S11e | Sale form pack line | MRP/sell inputs in **per PCS**; hint shows total per Ctn; line total unchanged |
| S12 | Settings → **Purchase bill rate** = **Rate incl. VAT** → Save | Purchase detail print shows incl. rate column |
| S13 | Settings → enable **payment QR**, **upload QR image** + **Bank details** → Save | Credit bill print shows QR block + bank line + bill ref; toggle off or fully paid bill hides QR |
| S14 | Settings → **Product units** — add **Bag** → Save → new product form | **Bag** appears in base unit dropdown |
| S14b | New product → **+ Add unit** → **Drum** → pick as base unit | Unit saved to Settings; product saves with Drum |
| S17b | Return entry — pick customer + bill → **+** on a line → Save | Return saves; credit shows on customer |
| S15 | **More → Archives** (or drawer → Archives) → **Products** tab → **Restore** | Product returns to active list and sale picker |
| S16 | Archive customer (zero balance) → **Archives → Customers** → **Restore** | Customer hidden from sale picker until restored |
| S17 | Settings → Export → period **Expenses** / **Damages** / **Goods returns** CSV | Files open with dated rows for selected range |

---

### 3.3 Products (MAN-PRD)

| ID | Steps | Expected |
|----|-------|----------|
| P1 | Menu → Products → New: name, buy **excl. VAT**, MRP, category, min qty; **opening qty** optional; **HSN code** optional (`0034`) | Saves; opening qty editable only on create; HSN blank OK |
| P1b | Edit same product | Opening qty read-only summary; on-hand shown; corrections via Purchase or Stock adjustment (if enabled) |
| P2 | Edit product: change sell price | List and sale picker show new price |
| P3 | Search product by name | Filters list |
| P4 | **Edge:** Sell price 0 or &lt; buy excl. | Sell optional; margin preview when both &gt; 0 |
| P5 | Use product on sale; check Stock page | On-hand decreases after sale |

---

### 3.4 Customers (MAN-CUS)

| ID | Steps | Expected |
|----|-------|----------|
| C1 | **Home → Customers tab** or drawer → Customers → New: name, phone, area, address, credit limit | Saves; appears in Home list |
| C1b | Optional **PAN** and **VAT** on customer form → Save | Values in `customers`; print on bill when set |
| C2 | Customer detail → **Edit** → change name | Saves; detail and sale picker updated |
| C3 | Filter “with balance” if available | Only outstanding &gt; 0 |
| C4 | Customer detail → outstanding, bill history | Matches Supabase `v_customer_balance` / bills |
| C5 | From detail → **Sales invoice** | Sale opens with customer pre-selected; **Edit customer** on same actions block |
| C6 | **Edge:** Credit limit 0 vs high limit | Note behaviour on large credit sale |

---

### 3.5 Suppliers (MAN-SUP)

| ID | Steps | Expected |
|----|-------|----------|
| SP1 | Open Suppliers list | Shows seeded/live suppliers |
| SP2 | Add supplier · expand card → **Edit supplier** | Name/phone/address save; opening payable only on create |
| SP3 | After manual/API supplier add | Appears on Purchase picker |
| SP4 | Supplier payable on Company overview | Roughly matches sum of unpaid purchases |

---

### 3.6 Sale — calculations & edge cases (MAN-SALE)

**Reference formula (server):**

```
subtotal = Σ(qty × rate)   // UI may apply line discount % before sum
total    = subtotal − bill_discount + vat_amount + extra_charges
paid     = min(amount_received, total)
open     = total − paid
```

| ID | Steps | Expected |
|----|-------|----------|
| SA1 | New sale: 1 line 10 × 100, no discount/VAT, paid 0, **due date set** | Saves; open = 1000; `sales_bills` + `sales_items` rows |
| SA2 | **S2 maths:** 10×100, bill disc **50**, VAT **123**, extra **20**, paid 0 | Grand total **1093** on screen and in DB |
| SA3 | Partial pay at billing: paid **400** on 1093 | paid=400, open=693 |
| SA4 | Full pay at billing: paid = total | open=0; bill status paid |
| SA5 | Over-pay at billing: paid **800** on total 500 | paid capped at **500** in DB |
| SA6 | **Line discount %:** product with 10% disc, qty 10 rate 100 | Line amount 900; subtotal 900 |
| SA7 | **Bill discount %:** 5% on subtotal 1000 | Discount 50; total adjusts |
| SA8 | **Bill discount flat:** NPR 100 off | Total reduces by 100 |
| SA9 | **Bill terms:** add terms amount | Included before VAT per UI rules |
| SA10 | **VAT toggle ON** with VAT-applicable product | VAT line appears; total includes 13% on correct base |
| SA11 | **VAT OFF** | No VAT line; total excludes VAT |
| SA12 | **Multi-line:** 2 different products | Subtotal = sum of lines; one bill_no |
| SA13 | **Preview bill** button | Preview modal matches sticky totals |
| SA14 | **Save** → bill detail → **Print** | Print view opens; header/footer from settings (no print on save) |
| SA14b | Add product line on sale form | **Rate (sell)** + **Label MRP** side by side; **Bill prints:** badge on Items header |
| SA15 | **Live edit:** Bill detail → Edit → change qty/rate → Save | `update_sales_bill` succeeds; totals/stock updated in DB |
| SA16 | **Edit blocked:** reduce total below `paid` | RPC error or validation; bill unchanged |
| SA17 | Sale without customer | Validation error |
| SA18 | Sale without line items | Validation error |
| SA19 | Credit sale without due date | Validation error |

**Manual calc sheet (fill in):**

| Case | Subtotal | Discount | VAT | Extra | Total | Paid | Open |
|------|----------|----------|-----|-------|-------|------|------|
| SA2 | 1000 | 50 | 123 | 20 | 1093 | 0 | 1093 |
| Your SA7 | | | | | | | |

---

### 3.7 Bill detail (MAN-BILL)

| ID | Steps | Expected |
|----|-------|----------|
| B1 | Open bill from Home customer row / customer detail | Lines, totals, paid, balance correct |
| B2 | **Share** (mobile: system sheet; desktop: PDF download toast) | PDF readable |
| B3 | **Print** and **PDF** buttons (outline style) | Same bill content |
| B4 | **Collect · NPR …** (green) when balance &gt; 0 | Opens payment with customer |
| B5 | **Return** (outline) | Return form with customer + bill |
| B6 | **Edit** when not fully paid | Sale edit opens |
| B7 | Paid bill: Collect hidden; behaviour consistent | |
| B8 | Print layout | Footer, VAT title, customer PAN/VAT if set |

---

### 3.8 Customer payment (MAN-PAY)

| ID | Steps | Expected |
|----|-------|----------|
| PY1 | Payment → select customer with open bills | Bills listed with balances |
| PY2 | Allocate **250** to one bill | `sales_bills.paid` += 250; `payments` row |
| PY3 | **Multi-bill:** 2 open bills, split payment | Both bills’ paid increase; total applied ≤ entered |
| PY4 | **Select all** + amount | Distributes per UI rules |
| PY5 | Customer with no open bills | “No open bills” or empty state |
| PY6 | After payment, customer outstanding on Home | Decreased |
| PY7 | Payment → **Advance only** tab, customer with no open bills, NPR 500 | `payments` row with `bill_id` null; customer Advance KPI increases |
| PY8 | Customer with advance → **New sales invoice** | Banner shows advance; on save toast mentions advance applied; `sales_bills.paid` includes advance |
| PY9 | Customer detail → Payments → **Reverse** on a receipt (reason ≥ 3 chars) | `reversed_at` set; receivable/advance KPIs update; row shows Reversed badge |
| PY10 | Customer detail → Bills tab | Lists **all** invoices (paid + open), not only open |

---

### 3.9 Goods return (MAN-RET)

| ID | Steps | Expected |
|----|-------|----------|
| R1 | Return: pick customer + bill, 1 line qty 1 | `returns` row; stock increases |
| R2 | Credit **capped:** bill open 200, try credit 500 | Only 200 applied to `paid` |
| R3 | Full return credit | Bill open → 0 |
| R4 | Return without bill selection | Validation or blocked |

---

### 3.10 Purchase & supplier payment (MAN-PUR)

| ID | Steps | Expected |
|----|-------|----------|
| PU1 | Purchase: supplier + **invoice no.** + product, qty 50, buy excl. 80 | `purchases` total incl. VAT; stock +50 |
| PU2 | **Multi-line purchase** | Subtotal excl + VAT % = total on screen and DB |
| PU2b | **Purchase bill discount** | 5 × 100 excl, flat discount 100 (label Scheme B4G1) → taxable 400, VAT 52, total 452; print shows discount row; edit reloads discount |
| PU2c | **Purchase preview before save** | Eye icon on sticky bar → full-screen preview; Print / PDF / Close (same as sales invoice) |
| PU3 | Supplier payment **500** on unpaid purchase | `purchases.paid` = 500 (or FIFO across POs) |
| PU4 | Second PO unpaid; pay again | Older PO paid first (FIFO) — note actual behaviour |
| PU5 | Stock page after purchase | Closing stock increased |
| PU6 | Purchase detail bill | Compact header: supplier left, invoice + date + supplier VAT right; no PO in UI |
| PU7 | Edit purchase | Invoice no. locked if already set; lines/date/supplier update |

---

### 3.11 Expense & damage (MAN-EX-DMG)

| ID | Steps | Expected |
|----|-------|----------|
| E1 | Expense NPR 99, category | `expenses` row in Supabase |
| D1 | Damage: product, qty 2, reason | `damages` row; stock −2 |
| D2 | Damage qty &gt; on hand | Error or allowed per policy |

---

### 3.12 Stock (MAN-STK)

| ID | Steps | Expected |
|----|-------|----------|
| ST1 | Home → **Stock** tab: search, filters, export | Same browse pattern as Customers |
| ST2 | Note product X closing stock | Record number |
| ST3 | After sale/purchase/return/damage/adjustment sequence | `closing` matches movement |
| ST4 | Compare Home Stock list vs `v_stock` in Supabase | Match |

---

### 3.13 Capital & company (MAN-CAP)

| ID | Steps | Expected |
|----|-------|----------|
| CAP1 | Reports → Capital entries → Add: owner capital NPR 25000 | List shows entry; `capital_entries` row |
| CAP2 | Company overview → capital section | Totals include new entry |
| CAP3 | See all → full list | All entries visible |
| CAP4 | Fixed asset with current value ≠ amount | Book value on overview |
| CAP5 | Loan category | Shown as liability not in “invested” KPI |
| CAP6 | **G22:** Edit/delete capital | Document result (Phase 2-C if not available) |

---

### 3.14 Daily cash & scheme (MAN-DC-SC)

| ID | Steps | Expected |
|----|-------|----------|
| DC1 | Daily cash → change physical count → Save draft | Toast success; verify `daily_cash` row if wired |
| DC2 | Lock day with variance note | Toast; UI locked state |
| SC1 | Scheme: name, product, buy/free qty, dates → Save | `scheme_tracker` row; Home → **On scheme**; new sale qty qualifies → free line |

---

### 3.15 Home, browse, overdue (MAN-HOME)

| ID | Steps | Expected |
|----|-------|----------|
| H1 | Home loads: date row + green **Sales invoice** | No infinite loading |
| H2 | **Customers** tab: search, Status, Area filters | List updates; **Clear ›** on zero balance rows |
| H3 | **Stock** tab: search, low-stock filter | SKUs match `v_stock` |
| H4 | Drawer or Reports → **Outstanding / Overdue / Aging** | Correct lists |
| H5 | Notification bell | Panel opens; links work (Tier B) |
| H6 | **Export all (N)** on browse card | CSV = all **filtered** rows, not one page only |
| H7 | Settings **Rows per page** → Home list pagination | Page size applies |

---

### 3.16 Reports hub & dashboard (MAN-RPT)

| ID | Steps | Expected |
|----|-------|----------|
| RP1 | Bottom **Reports** or `/app/reports` | Hub lists links (dashboard, outstanding, company, …) |
| RP2 | Dashboard `/app/dashboard` | Loads without crash |
| RP3 | Company overview net worth | Plausible vs manual calc |
| RP4 | Supplier ledger from hub/drawer | Opens period/supplier view |
| RP5 | **Help & support** from drawer only | Not under Settings tabs |

---

### 3.16b MRP stickers (MAN-MRP) — needs `0045`

| ID | Steps | Expected |
|----|-------|----------|
| MRP1 | Drawer → **Tools → MRP stickers** → **New sticker**: title `MRP NRS 95/-`, 2 lines, preset Medium 45×25 | Live preview at real size; "X stickers/page · Y pages"; fonts auto-fit until edited |
| MRP2 | **Save & print** | Browser print dialog; A4 filled with repeated sticker grid (2 mm cut gap); design appears in list with printed date |
| MRP3 | Change qty to 130 with 65/page | Shows 2 pages; print produces 2 sheets |
| MRP4 | Create a 2nd design (different size); tick both → **Print selected (2)** | One print job; each design starts on its own page |
| MRP5 | Row actions: **Edit** reloads values; **Duplicate** adds copy; **Delete** asks confirm then removes | History stays tenant-scoped |
| MRP6 | Without migration `0045` | List shows friendly "run migration 0045" error, no crash |

---

### 3.17 Security & multi-tenant (MAN-SEC)

| ID | Steps | Expected |
|----|-------|----------|
| SEC1 | Login as Tenant A; note customer count | N rows |
| SEC2 | Login as Tenant B (different user) | Cannot see Tenant A customers in UI |
| SEC3 | **SQL:** as authenticated user, only own `tenant_id` rows | RLS blocks other tenants |

---

### 3.18 Regression smoke (15 min) (MAN-SMOKE)

| # | Action |
|---|--------|
| 1 | Login → Home **Customers** tab visible |
| 2 | Change settings footer → save |
| 3 | Add customer from Home tab or Products master |
| 4 | Add product |
| 5 | New sale (credit with due date) |
| 6 | Payment on bill |
| 7 | Return 1 item |
| 8 | Purchase |
| 9 | Supplier payment |
| 10 | Expense + damage |
| 11 | Capital entry |
| 12 | Log out |

---

## 4. Edge-case matrix (quick reference)

| Scenario | Where to test | Pass criteria |
|----------|---------------|---------------|
| Empty customer on sale | Sale | Blocked |
| Credit sale no due date | Sale | Blocked |
| Over-pay at billing | Sale | paid ≤ total |
| Return credit &gt; open | Return | credit capped |
| Multi-line sale totals | Sale | subtotal = sum lines |
| Bill edit live | Bill → Edit | Toast block (Phase 1) |
| Settings → header | Settings | Name updates live |
| Payment multi-bill | Payment | Balances correct |
| Stock after full cycle | Stock + DB | Formula holds |
| Capital loan vs capital | Capital | KPIs classify correctly |
| Daily cash / scheme DB | After save | No false expectation of DB row |

---

## 5. Supabase verification cheatsheet

After manual flows, spot-check in **Table Editor**:

| After action | Tables to check |
|--------------|-----------------|
| Settings save | `tenant_settings` |
| Customer save | `customers` |
| Product save | `products` |
| Sale | `sales_bills`, `sales_items` |
| Payment | `payments`, `sales_bills.paid` |
| Return | `returns`, `sales_bills.paid`, `v_stock` |
| Purchase | `purchases`, `purchase_items`, `v_stock` |
| Supplier pay | `purchases.paid` |
| Expense | `expenses` |
| Damage | `damages`, `v_stock` |
| Capital | `capital_entries` |

**Views:** `v_stock`, `v_customer_balance`, `v_supplier_balance`

---

## 6. Sign-off

| Suite | Automated | Manual (this doc) | Tester | Date |
|-------|-----------|-------------------|--------|------|
| Phase 0 `e2e:phase0` | ☐ | — | | |
| Phase 0 `e2e:phase0:live` | ☐ | — | | |
| §3.0a Tier A (T0A1–T0A10) | — | ☐ | | |
| §3.0b Tier B (T0B1–T0B8) | — | ☐ | | |
| §3.0c Tier C (T0C1–T0C10) | — | ☑ | 2026-05-26 prod + deploy | |
| §3.0d P1 product (T1P1–T1P12) | — | ☐ | 2026-06-05 — after deploy + IRD-DISC-1 | |
| API matrix (`e2e:matrix`) | ☐ | — | | |
| UI script (`e2e:ui`) | ☐ | — | | |
| Gaps G1–G30 | — | ☐ | | |
| Full manual §3 (all modules) | — | ☐ | | |

**Notes / bugs found:**

```
(attach screenshots, bill_no, steps to reproduce)
```

---

## 7. When new features ship — retest

**Rule:** Add manual rows to §2 + §3 (and e2e scripts) in the **same PR** as the feature.

### Phase 1+ (planned)

**SSOT:** [BACKLOG § Feature status index](../BACKLOG.md#feature-status-index-single-source-of-truth) — update there first; checklist below mirrors active todo only.

- [x] UI-1 full symmetry pass — §3.0d MAN-P1 + [UI_CONSISTENCY_PLAN](../UI_CONSISTENCY_PLAN.md) (2026-06-05)
- [ ] **IRD-DISC-1** — sales + purchase print/PDF legal disclaimers (before pilot)
- [ ] **DEPLOY-DOM** — `app.bikrikhata.com` + `bikrikhata.com` split ([BACKLOG](../BACKLOG.md))
- [ ] **NOTIF-FIX** — notification bell test + fix (T0B7, G17)
- [ ] **LOAD-1** — branded logo loader on slow load
- [ ] **THEME-1** — dark / light theme toggle
- ~~**CHANGELOG-APP**~~ — deferred (not needed for now)
- [ ] **WEB-CTA-1** — landing trial CTAs: keep 1–2 only
- [ ] **WEB-MEDIA-1** — demo videos + new UI screenshots + feature explain on website
- [ ] **BRAND-LOGO-2** — new application logo (PWA, login, shell)
- [ ] **AUDIT-LOG-1** — activity log & monitoring (post-launch)
- [ ] **WEB-AUDIT-1** — full landing audit after media refresh
- [ ] Sales orders / salesman (SF-0, ORD-*) — new §3.xx
- [ ] Bill edit audit history  
- [ ] Live daily cash + schemes tables  
- [ ] Live notifications DB  
- [ ] Capital edit + audit history UI  
- [ ] Data export P1 (`.xlsx` pack) — [DATA_EXPORT_SPEC.md](../DATA_EXPORT_SPEC.md)

### Phase 2

- [ ] Full backup / restore (IMP-0/2)  
- [ ] Parent/child categories (CAT-1)

---

**See also:** [Automated E2E](./phase1-use-cases-and-tests.md) · [Backend checklist](./BACKEND-TODO.md) · [Data model](./data-model.md) · [Docs hub](../README.md)
