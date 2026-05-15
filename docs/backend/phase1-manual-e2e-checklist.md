# Phase 1 — Manual E2E test checklist (complete)

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Automated E2E](./phase1-use-cases-and-tests.md) · [Testing live](./testing-live-supabase.md) · [Data model](./data-model.md)

Use this **one document** for everything scripts do **not** fully cover, plus step-by-step manual tests for **every feature**, edge case, and calculation check.

**Companion (automated):** [`phase1-use-cases-and-tests.md`](./phase1-use-cases-and-tests.md)  
**Run scripts first:** `npm run e2e:full` (needs `npm run dev` for UI part)

---

## 0. Before you start

| Item | Action |
|------|--------|
| Migrations | `0001` → `0002` → `0003` → **`0005`** applied in Supabase SQL Editor |
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
| G2 | **Supplier add in UI** | API insert only | No “New supplier” screen — add via Supabase or accept gap |
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
| G16 | **Customer PAN** | Not in schema | Field on form if present; DB column when added |
| G17 | **Notifications panel** | — | Bell icon list; links open correct screens (static data today) |
| G18 | **Daily cash → Supabase** | Demo toast only | Confirm **no** `daily_cash` row after save (expected until wired) |
| G19 | **Scheme → Supabase** | Demo toast only | Confirm **no** `schemes` row (expected until wired) |
| G20 | **Dashboard charts** | — | `/app/dashboard` loads; data matches your tenant (if wired) |
| G21 | **Company overview maths** | Partial live capital | Net worth, assets, liabilities vs your entries + stock |
| G22 | **Capital edit / history / soft-delete** | Insert + list | Edit entry, view history (Phase 2-C); delete behaviour |
| G23 | **Bill print / PDF** | Footer text in UI script | Full A4 layout, logo, line wrap, browser print to PDF |
| G24 | **RLS / second tenant** | Optional API if service key | Second login cannot see first tenant’s customers/bills |
| G25 | **Register + pending approval** | — | New signup → pending → activate → login |
| G26 | **Offline / PWA** | — | Refresh mid-form; install PWA if used |
| G27 | **Mobile layout** | UI script uses mobile width | Real phone: sticky bar, pickers, bottom nav |
| G28 | **Sign out + re-login** | Live script | Data still correct; no stale header name |
| G29 | **Demo mode** (`VITE_*` unset) | — | localStorage persistence; Reset demo data in Settings |
| G30 | **Performance** | — | Customer/product lists with 100+ rows; search |

---

## 2. Feature & use case catalog (Phase 1)

| Module | Use cases | Route / entry |
|--------|-----------|----------------|
| **Auth** | Login, register, pending tenant, no tenant, sign out | `/login`, `/register`, `/pending-approval`, `/no-tenant` |
| **Home** | KPIs, quick actions, aging buckets, overdue list, period lists | `/app/home`, `/app/home/overdue`, `/app/home/aging/:bucket`, `/app/home/period/:type` |
| **Settings** | Business profile, invoice prefix, footer, alerts, product defaults | `/app/settings` |
| **Products** | List, search, add, edit, inactive/active | `/app/products`, `/app/products/new`, `.../edit/:id` |
| **Customers** | List, filter outstanding, add, edit, detail, new bill from customer | `/app/customers`, `.../new`, `.../edit/:id`, `.../:id` |
| **Suppliers** | List, expandable cards (read-only add in UI) | `/app/suppliers` |
| **Stock** | On-hand from `v_stock` | `/app/stock` |
| **Sale** | New bill, edit (demo / blocked live), preview, print | `/app/sales/new`, `/app/sales/edit/:billNo` |
| **Bill detail** | View, print, return, pay, edit pencil | `/app/bills/:billNo` |
| **Payment** | Customer payment, bill allocation | `/app/payments/new` |
| **Return** | Return against bill, stock back, credit | `/app/returns/new` |
| **Purchase** | Stock in, supplier payable | `/app/purchases/new` |
| **Supplier payment** | Pay down POs | `/app/supplier-payments/new` |
| **Expense** | Record expense | `/app/expenses/new` |
| **Damage** | Stock out | `/app/damages/new` |
| **Daily cash** | Draft, lock day (demo persistence) | `/app/daily-cash` |
| **Scheme** | Promo on product (demo persistence) | `/app/schemes/new` |
| **Company** | Overview, capital KPIs | `/app/company` |
| **Capital** | List, add entry | `/app/capital`, `/app/capital/new` |
| **Dashboard** | Private reports | `/app/dashboard` |
| **More** | Hub for all actions | `/app/more` |

---

## 3. Manual test procedures (step-by-step)

Use **Pass / Fail / N/A** and notes. Verify in **Supabase** where indicated.

---

### 3.1 Auth & tenant (MAN-AUTH)

| ID | Steps | Expected |
|----|-------|----------|
| A1 | Open `/login` with valid E2E credentials → Sign in | Lands on `/app/home`; header shows shop name from settings |
| A2 | Wrong password | Error message; stay on login |
| A3 | Sign out from Settings | Redirect to `/login`; cannot open `/app/home` without login |
| A4 | **(Live)** Register new business on `/register` | Success or email-confirm message per Supabase config |
| A5 | **(Live)** If tenant `pending` | `/pending-approval`; after `active` in DB, refresh → home |
| A6 | **(Live)** User with no `tenant_users` row | `/no-tenant` page |

---

### 3.2 Settings — all fields (MAN-SET)

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
| S9 | **Edge:** Save with empty trading name | Validation error or safe default |

---

### 3.3 Products (MAN-PRD)

| ID | Steps | Expected |
|----|-------|----------|
| P1 | More → Products → New: code, name, buy/sell/MRP, category, min qty | Saves; appears in list |
| P2 | Edit product: change sell price | List and sale picker show new price |
| P3 | Search product by name | Filters list |
| P4 | **Edge:** Sell price &lt; buy price | Allowed or warning per product policy |
| P5 | Use product on sale; check Stock page | On-hand decreases after sale |

---

### 3.4 Customers (MAN-CUS)

| ID | Steps | Expected |
|----|-------|----------|
| C1 | Customers → New: name, phone, area, address, credit limit | Saves; list shows customer |
| C2 | Edit customer name | Detail page and sale picker updated |
| C3 | Filter “with balance” if available | Only outstanding &gt; 0 |
| C4 | Customer detail → outstanding, bill history | Matches Supabase `v_customer_balance` / bills |
| C5 | From detail → **New bill** | Sale opens with customer pre-selected |
| C6 | **Edge:** Credit limit 0 vs high limit | Note behaviour on large credit sale |

---

### 3.5 Suppliers (MAN-SUP)

| ID | Steps | Expected |
|----|-------|----------|
| SP1 | Open Suppliers list | Shows seeded/live suppliers |
| SP2 | **Gap G2:** Look for “New supplier” button | Document if missing; add supplier in Supabase Table Editor |
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
| SA14 | **Save & Print** | Print view opens; header/footer from settings |
| SA15 | **Live edit (G1):** Bill detail → Edit → Save | Toast: not supported yet (Phase 1) |
| SA16 | **Demo edit:** unset Supabase env, edit bill | Updates in demo storage |
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
| B1 | Open bill from home/customer | Lines, totals, paid, balance correct |
| B2 | Print from bill detail | Layout readable; footer text correct |
| B3 | Return button | Opens return with customer + bill pre-filled |
| B4 | Pay button (if balance &gt; 0) | Opens payment with customer |
| B5 | Paid bill: no pay button / edit behaviour | Consistent with status |

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
| PU1 | Purchase: supplier + product, qty 50 rate 80 | `purchases` total 4000; stock +50 |
| PU2 | **Multi-line purchase** | Subtotal = sum of lines |
| PU3 | Supplier payment **500** on PO 4000 | `purchases.paid` = 500 (or FIFO across POs) |
| PU4 | Second PO unpaid; pay again | Older PO paid first (FIFO) — note actual behaviour |
| PU5 | Stock page after purchase | Closing stock increased |

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
| ST1 | Note product X closing stock | Record number |
| ST2 | After sale/purchase/return/damage sequence | `closing = opening + purchased − sold − damaged + returned` |
| ST3 | Compare Stock page vs `v_stock` in Supabase | Match |

---

### 3.13 Capital & company (MAN-CAP)

| ID | Steps | Expected |
|----|-------|----------|
| CAP1 | More → Capital entries → Add: owner capital NPR 25000 | List shows entry; `capital_entries` row |
| CAP2 | Company overview → capital section | Totals include new entry |
| CAP3 | See all → full list | All entries visible |
| CAP4 | Fixed asset with current value ≠ amount | Book value on overview |
| CAP5 | Loan category | Shown as liability not in “invested” KPI |
| CAP6 | **G22:** Edit/delete capital | Document result (Phase 2-C if not available) |

---

### 3.14 Daily cash & scheme — demo only (MAN-DEMO)

| ID | Steps | Expected |
|----|-------|----------|
| DC1 | Daily cash → change physical count → Save draft | Toast success; **no DB row** (Phase 1) |
| DC2 | Lock day with variance note | Toast; UI locked state |
| SC1 | Scheme: name, product, dates, discount → Save | Toast; navigates home; **no DB row** (Phase 1) |

---

### 3.15 Home, overdue, aging (MAN-HOME)

| ID | Steps | Expected |
|----|-------|----------|
| H1 | Home KPIs load | No infinite loading |
| H2 | Tap overdue / aging bucket | Correct list of customers/bills |
| H3 | Notification bell | Panel opens; tap item navigates (if link exists) |
| H4 | Quick “New bill” | Opens sale |

---

### 3.16 Dashboard & reports (MAN-RPT)

| ID | Steps | Expected |
|----|-------|----------|
| RP1 | Dashboard `/app/dashboard` | Loads without crash |
| RP2 | Company overview net worth | Plausible vs manual calc |
| RP3 | Supplier ledger link from More | Opens period/supplier view |

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
| 1 | Login |
| 2 | Change settings footer → save |
| 3 | Add customer |
| 4 | Add product |
| 5 | New sale (credit with due date) |
| 6 | Payment on bill |
| 7 | Return 1 item |
| 8 | Purchase |
| 9 | Supplier payment |
| 10 | Expense + damage |
| 11 | Capital entry |
| 12 | Sign out |

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

| Suite | Automated (`e2e:full`) | Manual (this doc) | Tester | Date |
|-------|------------------------|-------------------|--------|------|
| API matrix 45 checks | ☐ | — | | |
| UI script ~20 steps | ☐ | — | | |
| Gaps G1–G30 | — | ☐ | | |
| Full manual §3 | — | ☐ | | |

**Notes / bugs found:**

```
(attach screenshots, bill_no, steps to reproduce)
```

---

## 7. When Phase 2 lands — retest

- [ ] Bill edit + `sales_bill_audit` history  
- [ ] Supplier New UI  
- [ ] Live daily cash + schemes tables  
- [ ] Live notifications  
- [ ] Capital edit + audit history UI  

Update this file when those features ship.

---

**See also:** [Automated E2E](./phase1-use-cases-and-tests.md) · [Backend checklist](./BACKEND-TODO.md) · [Data model](./data-model.md) · [Docs hub](../README.md)
