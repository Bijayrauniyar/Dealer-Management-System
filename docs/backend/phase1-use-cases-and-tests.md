# Phase 1 — use cases, calculations, and automated tests

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Manual E2E](./phase1-manual-e2e-checklist.md) · [Testing live](./testing-live-supabase.md) · [Data model](./data-model.md)

Run migrations `0001` → `0002` → `0003` → **`0005`** (RPC fixes) before live tests.

**Manual E2E (everything scripts miss + step-by-step for all features):** [`phase1-manual-e2e-checklist.md`](./phase1-manual-e2e-checklist.md)

---

## How to run tests

| Command | What it does |
|---------|----------------|
| `npm run e2e:smoke` | Schema + RPC exists (no login) |
| `npm run e2e:live` | Login + basic reads (`E2E_EMAIL` / `E2E_PASSWORD`) |
| `npm run e2e:matrix` | **Full API matrix** — masters, maths, balances, stock |
| `npm run e2e:ui` | **Browser UI** — forms + navigation (needs `npm run dev`) |
| `npm run e2e:ui:setup` | Install Playwright Chromium (once) |
| `npm run e2e:all` | API matrix then UI |
| `npm run e2e:full` | smoke → live → matrix → UI |

Credentials: `app/.e2e-credentials.local` (from `node scripts/create-e2e-user-and-test.mjs`).

---

## A. Master data

| ID | Use case | UI path | DB | Expected |
|----|----------|---------|-----|----------|
| M1 | Tenant active | Login | `tenants.status = active` | Reach `/app/home` |
| M2 | Settings load/save | Settings → Save | `tenant_settings` | Header name/region/footer update after save |
| M3 | Add product | Products → New | `products` | Row with code, prices, `is_active` |
| M4 | Edit product | Products → edit | `products` | `sale_price` / `purchase_price` updated |
| M5 | Add customer | Customers → New | `customers` | Row; appears in sale picker |
| M6 | Add supplier | Table Editor / API | `suppliers` | Row; appears on purchase |
| M7 | List reads | Home, Customers, Stock | views + tables | RLS: only current tenant |

---

## B. Sales bill — calculations (RPC `create_sales_bill`)

**Formula (server):**

```
subtotal = Σ(qty × rate)
total    = subtotal − discount + vat_amount + extra_charges
paid     = min(p_paid, total)   // at billing
open     = total − paid         // on bill
```

| ID | Scenario | Input | Expected `sales_bills` |
|----|----------|-------|------------------------|
| S1 | Simple credit sale | 10 × 100, disc 0, VAT 0, paid 0 | subtotal 1000, total 1000, paid 0 |
| S2 | Discount + VAT + terms | 10×100, disc 50, VAT 123, extra 20, paid 0 | total = 1000−50+123+20 = **1093** |
| S3 | Partial pay at billing | total 1000, p_paid 400 | paid 400, open 600 |
| S4 | Full pay at billing | total 500, p_paid 500 | paid 500, open 0 |
| S5 | Over-pay at billing | total 500, p_paid 800 | paid **500** (capped) |
| S6 | Bill number | prefix `INV` in settings | `bill_no` like `INV-<n>` |

**UI (Sale entry):** line amount = `qty × rate × (1 − lineDisc%)`; bill discount %/flat; VAT 13% on (afterDisc + terms); **due date required** if balance &gt; 0.

---

## C. Customer payment (`apply_customer_payment`)

| ID | Scenario | Expected |
|----|----------|----------|
| P1 | Allocate to one bill | `sales_bills.paid` += amount (per allocation) |
| P2 | FIFO UI | User selects bills; total applied ≤ amount entered |
| P3 | After pay | `v_customer_balance.balance` decreases |
| P4 | Payment row | `payments` row per allocation slice |

---

## D. Goods return (`apply_goods_return`)

| ID | Scenario | Expected |
|----|----------|----------|
| R1 | Return qty on bill | `returns` rows; stock +return qty in `v_stock` |
| R2 | Credit on bill | `paid` on bill += min(credit_amount, open) |
| R3 | Credit capped | credit 500 on open 200 → only 200 applied |
| R4 | Customer balance | `v_customer_balance` credits include return credits |

---

## E. Purchase & supplier payment

| ID | Scenario | Expected |
|----|----------|----------|
| PU1 | Record purchase | `purchases` + `purchase_items`; `v_stock` +qty |
| PU2 | Supplier payment | `purchases.paid` increases FIFO on unpaid POs |
| PU3 | Payable | `v_supplier_balance` decreases |

---

## F. Expense & damage

| ID | Scenario | Expected |
|----|----------|----------|
| E1 | Expense | `expenses` row |
| D1 | Damage | `damages` row; `v_stock` −qty |

---

## G. Stock view (`v_stock`)

```
closing = opening + purchased − sold − damaged + returned
```

After S1 (sell 10), PU1 (buy 50), D1 (damage 2), R1 (return 1):  
`closing = 0 + 50 − 10 − 2 + 1 = 39` (with opening 0).

---

## H. Edge cases / known limits

| Topic | Behaviour |
|-------|-----------|
| Edit existing bill (live) | **Blocked in Phase 1** — toast; use new bill. **Phase 2-D:** `update_sales_bill` + `sales_bill_audit` (see `BACKEND-TODO.md`, `data-model.md`) |
| Demo mode | All data in `localStorage` via `appStore` |
| Customer PAN | Not in DB schema yet |
| Supplier “New” in UI | Not wired (use SQL/Table Editor) |
| RPC bugs without 0005 | payment / return / purchase RPCs fail — run `0005_fix_phase1_rpc_jsonb.sql` |

---

## J. Test coverage map (what scripts actually assert)

### `e2e:matrix` (API) — **45 checks** — calculation & balance accuracy

| Area | Covered |
|------|---------|
| Settings | Footer, prefix, **name, overdue_days, default_markup_pct** round-trip |
| Sale | S2 maths (1093), partial pay, overpay cap, prefix, **multi-line subtotal (350)** |
| Payment / return / purchase / supplier pay | Balances + capped credit |
| Stock | `v_stock.closing` after full flow |
| Capital | **Insert + read** `capital_entries` |
| Views | `v_customer_balance`, **`v_supplier_balance`** non-negative |
| RLS | **Scoped customer count** if `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`; else skipped |

**Still API-only gaps:** line discount %, bill terms %, multi-PO FIFO, `%` VAT from lines, every `tenant_settings` column.

### `e2e:ui` (browser) — **~20 steps** — flows + selected UI↔DB checks

| Step | Asserts |
|------|---------|
| Core flows | Login, settings, customer/product forms, sale → damage |
| **4a–4d** | **UI grand total 500 = DB total**; **bill footer on print**; **edit bill blocked** (toast) |
| **12–14** | **Capital** add + list; **daily cash** draft toast; **scheme** save (demo/local) |

### Cannot fully automate yet

| Area | Why |
|------|-----|
| **Bill edit (success path)** | Phase **2-D** — only **blocked** behaviour is tested |
| **Supplier New UI** | No form/route — API insert only |
| **Notifications** | Static UI; no live table |
| **Daily cash / scheme DB** | Demo save (timeout), not Supabase |
| **PDF download** | Print view text only, not PDF binary |
| **Line discount % / bill terms in UI** | Not in UI E2E matrix |
| **RLS without service role** | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for cross-count check |

---

## I. What each script asserts

### `e2e-phase1-matrix.mjs` (API)

- Settings round-trip (footer text)
- Masters: customer, supplier, product insert + product price update
- Sale S2 maths on `sales_bills` row
- Payment reduces open balance
- Return increases `paid` and caps credit
- Purchase + supplier payment on `purchases.paid`
- `v_customer_balance` and `v_stock` numeric checks
- Expense + damage rows exist

### `ui-e2e-phase1.mjs` (UI)

- Login, settings save, product form, **customer form**
- Sale (with due date), payment, return, purchase, supplier pay, expense, damage
- Product visible in list

Extend matrix when adding supplier form, bill edit, or PAN field.

---

**See also:** [Manual checklist](./phase1-manual-e2e-checklist.md) · [Testing live](./testing-live-supabase.md) · [Backend checklist](./BACKEND-TODO.md) · [Docs hub](../README.md)
