# Backend data model

> Last updated: 2026-05-20 — live Supabase app (React + TanStack Query).  
> Stack: **Supabase** (PostgreSQL + Row Level Security + RPCs; Edge Functions planned Phase 2).

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Backend checklist](./BACKEND-TODO.md) · [Testing live](./testing-live-supabase.md) · [Migrations](../../app/supabase/README.txt)

---

## Live app — client persistence

The React app is **Supabase-only**. Reads and writes go through [`app/src/lib/live/domainLive.ts`](../../app/src/lib/live/domainLive.ts); UI hooks in [`app/src/store/domainHooks.ts`](../../app/src/store/domainHooks.ts) (TanStack Query, key `["domain", "v2"]` — scoped by workspace `tenant_id`, including for `super_admin`).

| Concern | Behaviour |
|---|---|
| **Reads** | `fetchDomainBundle()` — parallel PostgREST queries + views (`v_stock`, `v_customer_balance`, `v_supplier_balance`). |
| **Writes (money/stock)** | Postgres RPCs: `create_sales_bill`, `update_sales_bill`, `apply_customer_payment`, `apply_goods_return`, `record_purchase`, `apply_supplier_payment`, `record_expense`, `record_damage`. |
| **Writes (masters)** | Direct upsert on `products`, `customers`; `tenant_settings` from Settings page. |
| **Bill numbers** | Server assigns prefix + sequence via `create_sales_bill`; client can peek next via `peekNextBillNoLive`. |
| **Test data** | `npm run seed:demo` seeds a **live tenant** via RPCs (not browser storage) — see [seed-demo-and-reset.md](./seed-demo-and-reset.md). |

Without `VITE_SUPABASE_*`, the app shows **`MissingSupabaseEnv`** (no offline demo).

---

## Tenancy

Every table has a `tenant_id uuid NOT NULL` column.  
All queries are filtered by `tenant_id` via RLS policies (`auth.uid()` → `users.id` → `users.tenant_id`).

---

## `platform_inquiries` (marketing — not tenant-scoped)

> **Migration:** `app/supabase/migrations/0027_platform_inquiries.sql`

Inbound leads from the public landing **Contact** form (`/#contact`). **No `tenant_id`** — BikriKhata platform team only.

| Column | Notes |
|--------|--------|
| `full_name`, `email`, `phone` | Required |
| `business_name`, `business_type` | Required (e.g. Distributor, Wholesaler) |
| `message` | Optional |
| `inquiry_purpose` | e.g. `Start Your FREE 1-Week Trial Today`, `Book a demo` (**0029**) |
| `status` | `new` · `contacted` · `closed` |
| `source` | `landing`, `demo`, … |

**Write:** RPC `submit_platform_inquiry` (preferred), else PostgREST `insert` (**0027**–**0028**).  
**Read:** Supabase → Table Editor. **Email alerts:** migration **0033** + Edge Function `notify-platform-inquiry` + Resend — [CONTACT_FORM_EMAIL_SETUP.md](../CONTACT_FORM_EMAIL_SETUP.md) (`npm run setup:contact-email`). Trigger table: `platform_system_config` key `supabase_project_url`.

---

## `tenants` (workspace + license)

> **Migration:** `0001_init.sql` (core); **`0030_tenant_license.sql`** (trial / paid dates).

| Column | Notes |
|--------|--------|
| `business_name`, `owner_name`, `phone`, `city` | From register / onboarding |
| `status` | `pending` (new signup) · `active` · `suspended` · `rejected` |
| `plan` | `trial` · `monthly` · `annual` (set on activation / payment) |
| `trial_ends_at` | Free trial end — set when **`approve_tenant`** runs (7 days from activation) |
| `subscription_ends_at` | Paid period end — set via **`set_tenant_subscription`** |
| `activated_at` | First activation timestamp |

**RPCs (super_admin, after 0031):** `approve_tenant(uuid, days default 7)`; `set_tenant_subscription(uuid, plan, days default null)`; `extend_tenant_license(uuid, extra_days)`. See [TENANT_ACTIVATION.md](../TENANT_ACTIVATION.md).

---

## `tenant_settings`
One row per tenant — stores the full business profile that appears on invoices and the Settings screen.

> **Migration:** Created and backfilled in `app/supabase/migrations/0002_tenant_settings_capital_audit.sql` (one default row per tenant that already existed when the migration runs).

| Column | Type | Notes |
|---|---|---|
| tenant_id | uuid PK FK → tenants | 1-to-1 with tenants table |
| name | text NOT NULL | Trading name — shown on app header |
| legal_name | text | Full registered name |
| region | text | Depot / coverage area description |
| phone | text | Landline |
| mobile | text | Primary mobile |
| email | text | |
| address_line1 | text | Street / locality |
| address_line2 | text | Ward / area |
| district | text | |
| province | text | |
| country | text DEFAULT 'Nepal' | |
| pan_number | text | 9-digit Nepal PAN — printed on all invoices |
| vat_registered | boolean DEFAULT false | |
| vat_number | text | 9-digit VAT; required if `vat_registered = true` |
| invoice_prefix | text DEFAULT 'INV' | Prepended to bill numbers |
| bill_footer | text | Footer text printed on every invoice |
| overdue_days | integer DEFAULT 7 | Bills past due by this many days are flagged as Overdue |
| due_soon_days | integer DEFAULT 3 | Bills due within this many days get a reminder |
| default_markup_pct | numeric(5,2) DEFAULT 15 (`0018`) | Default % markup over buy price (decimals OK, e.g. 4.5). Auto-calculates sell on new products; overridable per product. |
| default_vat_pct | numeric DEFAULT 13 | Default VAT % for purchase bills and sales when tenant is VAT registered (`0017`). |
| default_min_qty | integer DEFAULT 20 | Default low-stock threshold applied when creating a new product. Overridable per product. |
| product_categories | jsonb DEFAULT `["General"]` | Category dropdown options; appended from **product form** Add category (`0019`). |
| product_units | jsonb (`0038`) | Unit labels on product form (UNITS-1); default PCS, Pkt, Box, Ctn, Doz, Ltr, Kg |
| allow_stock_adjustment | boolean DEFAULT false | Enables `/app/stock-adjustment/new` (`0021`). |
| list_page_size | integer DEFAULT 10 | Rows per page on browse lists; Settings → Business tab (`0022`). Allowed: 10, 20, 50, 100. |
| show_district_province_on_bill | boolean DEFAULT false | When true, bill letterhead adds district · province · country after address lines (`0023`). |
| support_phone | text | Reserved (`0025`). **App support** for tenant owners = `PLATFORM_SUPPORT` in code, not these columns. |
| support_email | text | Reserved (`0025`). |
| support_whatsapp | text | Reserved (`0025`). |
| sales_bill_price_mode | text DEFAULT `mrp` (`0035`) | `mrp` \| `selling_price` — unit price column on sales invoice print |
| purchase_bill_price_mode | text DEFAULT `rate_excl` (`0035`) | `rate_excl` \| `rate_incl` — unit rate column on purchase invoice print |
| sales_bill_qr_image_url | text (`0035`) | Legacy pasted URL / data URL — prefer `sales_bill_qr_object_path` |
| sales_bill_qr_bank_text | text (`0035`) | Bank name + account line beside payment QR |
| sales_bill_qr_enabled | boolean (`0036`, default false) | Master toggle for payment QR on balance-due sales bills |
| sales_bill_qr_object_path | text (`0036`) | One QR per tenant in private `tenant-assets` bucket (`{tenant_id}/sales-bill-payment-qr.*`; upload replaces; max 1 MB) |
| updated_at | timestamptz | |

> **FE note:** Loaded via `useBusinessSettings()` (React Query); invalidate `DOMAIN_QUERY_KEY` on save from Settings page.
>
> **Bill letterhead (IRD):** `address_line1` / `address_line2` print on bills by default; `district` / `province` / `country` only when `show_district_province_on_bill`. VAT/PAN + phone right; **Tax Invoice** when VAT registered. See [IRD_BILL_LETTERHEAD.md](../IRD_BILL_LETTERHEAD.md).

---

## Core tables

### `customers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text NOT NULL | |
| phone | text | |
| area | text | Short locality name |
| address | text | Full address — printed on invoices |
| pan_number | text | Optional buyer PAN — printed on sales bills (`0026`) |
| vat_number | text | Optional buyer VAT — printed when filled (`0026`) |
| credit_limit | numeric DEFAULT 0 | |
| outstanding | numeric DEFAULT 0 | Denormalised; updated on each sale/payment/return |
| advance_credit | numeric DEFAULT 0 | Overpayments kept as credit |
| opening_balance | numeric DEFAULT 0 | Migrated from manual ledger |
| created_at | timestamptz | |

### `products`

**Pricing model (important for billing):**
- `mrp` — Maximum Retail Price printed on the product by the manufacturer. Displayed on the sales bill for the customer's reference. Never used in calculations.
- `cost_price` (DB: `purchase_price`) — Buy price from supplier, stored **VAT-inclusive**. **Private — never shown on bills.** The product form lets the dealer type buy price **excl. VAT**; the app converts using `tenant_settings.default_vat_pct` before save. Purchase entry prefills line cost as **excl.** via the same split. **`numeric(12,4)`** after migration `0039` (up to 4 decimals).
- `selling_price` (DB: `sale_price`) — Price charged to customers, **exclusive of VAT** (may be `0` until set). This is the basis for sale line rates when billing. **`numeric(12,4)`** after `0039`.
- `discount_pct` — Standard percentage discount auto-applied on new bills for this product (0 = none).
- `vat_applicable` — If true, VAT at `default_vat_pct` is added at the bill total level (not per line). The `selling_price` is the VAT-exclusive base.
- **Auto-calculation (FE):** Markup applies to buy **excl.** in the form; `selling_price = buy_excl × (1 + markup_pct / 100)`. `markup_pct` defaults to `default_markup_pct`. Sell price is optional on save; manual sell price back-calculates markup % for display.

**On a sales bill line (printed invoice):**
```
S.N | Particulars | Rate | Qty | [Disc%] | Amount
```
- **Rate** — Settings picks label MRP or sell price per **base unit (PCS)** when line UOM is pack (e.g. Ctn); otherwise per bill UOM. Header always **Rate**.
- **Qty** — entered UOM + count (e.g. `1 Ctn`) with base PCS subline when pack conversion applies (e.g. `(18 PCS)`). Unit column merged into Qty on print/PDF.
- **Disc%** — line discount when set. Column shown only when ≥ 1 line has a discount.
- **Amount** — `qty × per-UOM rate` (unchanged in DB/RPC). Print math: **Rate (per PCS) × base PCS = Amt** when pack UOM.
- **Sale entry form** — when line UOM is pack, MRP/sell inputs show **per PCS** with hint `X per Ctn`; stored values remain per pack UOM.
- **Rate (DB)** — `sales_items.rate` stores effective unit price per **bill UOM** so server `subtotal = sum(qty×rate)` matches the UI.

Then at bill footer:
```
Subtotal (Σ line amounts)
− Discount (bill-level flat or %, shown as "X% of subtotal" or "flat amount")
+ Bill terms (e.g. Transport charges)
+ VAT at default_vat_pct% (on taxable base = subtotal − discount + bill_terms; 13% if unset)
= Grand Total
```

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text NOT NULL | |
| category | text | |
| uom | text DEFAULT 'PCS' | Unit of Measure: PCS, Box, Ltr, Kg, Pkt, Ctn, Doz |
| description | text | Flavour, size, pack details |
| mrp | numeric(12,4) NOT NULL (`0039`) | MRP on product — shown on bill, not used in calc |
| purchase_price | numeric(12,4) NOT NULL (`0039`) | Buy price VAT-inclusive in DB; form entry is excl. VAT |
| sale_price | numeric(12,4) NOT NULL (`0039`) | Sell price excl. VAT (0 allowed) |
| discount_pct | numeric DEFAULT 0 | Standard % discount given on this product |
| vat_applicable | boolean DEFAULT false | If true, VAT at default_vat_pct added at bill footer |
| on_hand | integer DEFAULT 0 | Updated on each sale/purchase/return/damage |
| min_qty | integer DEFAULT 0 | Low-stock alert threshold — configurable per product |
| is_active | boolean DEFAULT true | Soft-delete |
| hsn_code | text nullable (`0034`) | Optional HSN code; saved on product; included in products export CSV |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `suppliers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text NOT NULL | Trading name |
| legal_name | text | Full registered company name |
| contact_person | text | Name of account manager / sales rep |
| phone | text | |
| email | text | |
| address_line1 | text | |
| address_line2 | text | |
| district | text | |
| country | text DEFAULT 'Nepal' | |
| pan_number | text | Supplier PAN — required for TDS records |
| vat_number | text | Blank if not VAT registered |
| payment_terms_days | integer DEFAULT 30 | Credit period in days |
| outstanding | numeric DEFAULT 0 | Denormalised payable balance |
| opening_balance | numeric DEFAULT 0 | Migrated from manual ledger |
| notes | text | Internal notes |
| created_at | timestamptz | |

---

## Transactions

### `sales`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| customer_id | uuid FK → customers | |
| bill_no | text | Paper bill reference e.g. "HB-142" |
| date | date NOT NULL | AD date |
| miti | text | Bikram Sambat date — computed in FE, stored for printing (e.g. "31/01/2083") |
| subtotal | numeric NOT NULL | `SUM(sale_lines.line_total)` — i.e. Σ (qty × rate × (1 − discount_pct/100)). Per-line discounts already applied. |
| discount_type | text CHECK IN ('flat','percent') | nullable |
| discount_value | numeric | % or flat figure |
| discount_amount | numeric DEFAULT 0 | Resolved flat deduction |
| after_discount | numeric NOT NULL | subtotal − discount_amount (taxable base) |
| bill_terms | text | Label for additional charges e.g. "Transport" |
| bill_terms_amount | numeric DEFAULT 0 | Add. charges amount |
| vat_rate | numeric DEFAULT 0 | 0 or 13 |
| vat_amount | numeric DEFAULT 0 | (after_discount + bill_terms_amount) × vat_rate / 100 |
| grand_total | numeric NOT NULL | after_discount + bill_terms_amount + vat_amount |
| notes | text | Remark / internal note |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

### `sale_lines`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sale_id | uuid FK → sales ON DELETE CASCADE | |
| product_id | uuid FK → products | |
| uom | text | Unit of Measure snapshot (PCS, Box, Ltr, etc.) |
| qty | integer NOT NULL CHECK > 0 | |
| mrp | numeric DEFAULT 0 | Snapshot of product MRP at billing time — for bill display only, not used in any calculation |
| rate | numeric NOT NULL | Snapshot of `products.selling_price` (excl. VAT) at billing time |
| discount_pct | numeric DEFAULT 0 | Snapshot of `products.discount_pct` — per-line product discount % |
| line_total | numeric GENERATED | `qty × rate × (1 − discount_pct / 100)` — stored as numeric(12,2) |
| add_less | numeric DEFAULT 0 | Phase 2: per-line adjustment (+/−) |

> **Important:** `sales.subtotal` = `SUM(sale_lines.line_total)` — per-line discounts are already baked in before the bill-level discount is applied.

**Discount flow (two levels):**
1. **Product-level discount** (`sale_lines.discount_pct`) — baked into each line amount.
2. **Bill-level discount** (`sales.discount_type / discount_value / discount_amount`) — applied on the subtotal after per-line discounts.

### `outstanding_bills`
Tracks per-bill balance (created when `sale.net_total > paid_now`):
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| sale_id | uuid FK → sales | |
| customer_id | uuid FK → customers | |
| original_amount | numeric | sale.net_total − paid_at_billing |
| balance | numeric | Remaining unpaid (decremented by payments) |
| due_date | date | |
| status | text CHECK IN ('open','partial','paid') | |
| created_at | timestamptz | |

---

### `payments` (live schema via `apply_customer_payment` / `0043`)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| customer_id | uuid FK → customers | |
| bill_id | uuid FK → sales_bills NULL | **NULL** = advance on account (unapplied) |
| payment_date | date NOT NULL | |
| amount | numeric NOT NULL | Receipt amount |
| mode | text | Cash, UPI, Cheque, … |
| notes | text | Reference / UTR |
| reversed_at | timestamptz NULL | Set by `reverse_customer_payment` (`0043`) |
| reversal_reason | text NULL | Required on reverse |

**Customer balance** (`v_customer_balance`): `opening + billed − payments (non-reversed) − returns`. Negative balance = **advance** (`advance_balance` = sum of orphan payments).

**RPCs (`0043`):**
- `apply_customer_payment` — bill allocation (existing).
- `record_customer_advance` — receipt with `bill_id` null.
- `reverse_customer_payment` — audit reversal; reduces `sales_bills.paid` if linked.
- `create_sales_bill` — auto-applies orphan advance FIFO via `allocate_advance_to_bill`; returns `advance_applied`.

**UI:** Payment in → **Against bills** or **Advance only**; customer detail → **Reverse** on payments tab (no hard delete).

---

### `returns`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| customer_id | uuid FK → customers | |
| sale_id | uuid FK → sales | Bill being returned against |
| credit_amount | numeric NOT NULL | Σ return_lines credit |
| reason | text | |
| date | date NOT NULL | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

### `return_lines`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| return_id | uuid FK → returns ON DELETE CASCADE | |
| sale_line_id | uuid FK → sale_lines | Original line |
| product_id | uuid FK → products | Denormalised |
| return_qty | integer NOT NULL CHECK > 0 | ≤ sale_lines.qty |
| rate | numeric NOT NULL | Snapshot of `rate` from original `sale_lines` row |
| discount_pct | numeric DEFAULT 0 | Snapshot of `discount_pct` from original `sale_lines` row |
| line_credit | numeric GENERATED | `return_qty × rate × (1 − discount_pct / 100)` — mirrors how the original line amount was calculated |

**Side effects:** increment `products.on_hand`; decrement `customers.outstanding` by `credit_amount` (or apply as credit note).

---

### `damages`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| product_id | uuid FK → products | |
| qty | integer NOT NULL | |
| reason | text CHECK IN ('melted','broken_packaging','expired','cold_chain_failure','transport_damage','other') | |
| notes | text | |
| date | date NOT NULL | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

**Side effects:** decrement `products.on_hand` by `qty`.

---

### `stock_adjustments` (`0020`)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| product_id | uuid FK → products | |
| adjustment_date | date | |
| qty_delta | numeric | Positive = add stock; negative = remove |
| reason | text | e.g. Physical count, Shrinkage |
| notes | text | |
| created_at | timestamptz | |

RPC: `record_stock_adjustment`. UI: `StockAdjustmentPage` when `tenant_settings.allow_stock_adjustment`. Included in `v_stock.adjusted` and closing formula.

---

### `purchases` *(implemented — see also [Purchase reference numbers](../PURCHASE_REFERENCE_NUMBERS.md))*

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| supplier_id | uuid FK → suppliers | |
| purchase_no | text | Internal PO e.g. `PO-00022` — not shown in UI |
| supplier_invoice_no | text | Supplier’s bill number (`0014`); immutable after first save (`0015`/`0016`) |
| purchase_date | date NOT NULL | |
| due_date | date | |
| subtotal_excl | numeric | Sum of line excl. amounts (`0017`) — before bill discount |
| discount | numeric DEFAULT 0 | Bill-level discount NPR (excl. base), before VAT (`0044`) |
| discount_label | text | Optional print label e.g. Scheme (B4G1) (`0044`) |
| vat_amount | numeric | VAT on `(subtotal_excl − discount)` (`0044`; was per-line sum in `0017`) |
| subtotal / total | numeric | `total` = taxable excl + VAT |
| paid | numeric | Supplier payments applied |
| payment_status | text | paid / partial / unpaid |
| notes | text | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

### `purchase_items` *(live table; replaces design doc `purchase_lines` below)*

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| purchase_id | uuid FK → purchases | |
| product_id | uuid FK → products | |
| qty | integer | Received qty for stock |
| rate_excl | numeric | Unit cost excl. VAT (`0017`) |
| rate | numeric | Unit cost incl. VAT per unit |
| unit | text | UOM when multi-UOM enabled |

**Bill discount flow (`0044`):** `subtotal_excl` = Σ(qty × rate_excl); `discount` = flat NPR (app resolves %); `vat_amount` = round((subtotal_excl − discount) × vat_pct / 100); `total` = taxable excl + VAT. Line rates unchanged — discount is header-only (e.g. supplier B4G1).

RPCs: `record_purchase`, `update_purchase` (from `0013`+). UI: `PurchasePage`, `PurchaseBillView`.

### `purchase_lines` *(design sketch — not the live table name)*
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| purchase_id | uuid FK → purchases ON DELETE CASCADE | |
| product_id | uuid FK → products | |
| uom | text | unit of measure e.g. "Pcs", "Box" |
| invoice_qty | integer NOT NULL | qty on supplier invoice |
| received_qty | integer NOT NULL | qty actually received at warehouse — may be ≤ invoice_qty |
| short_qty | integer GENERATED | invoice_qty − received_qty (≥ 0) |
| cost | numeric NOT NULL | cost per unit |
| line_total | numeric GENERATED | received_qty × cost |

**Short-receive logic:**
- If `short_qty > 0` the difference is saved against this line.
- A short-receive record links `supplier_id + invoice_no + product_id + short_qty`.
- On the *next* purchase against the same supplier, the UI surfaces pending short-receives so the dealer can match and clear them (i.e. "deduct X units from new invoice").
- Backend: add a `short_receives` table (or a partial-receive view) to track pending short amounts per supplier.

**Side effects (stock):**
- Stock on-hand comes from view `v_stock`: `opening_stock + purchased + adjusted − sold − damaged + returned` (`0020`; purchased = sum of `purchase_items.qty`).
- **Normal stock IN = purchase**. Opening qty on product form (`products.opening_stock`). Manual correction: **Stock adjustment** when enabled in Settings (`0021`).
- **Client export:** `app/src/lib/export/*` — CSV registers + ZIP backup; Settings → Export tab. Spec: [DATA_EXPORT_SPEC.md](../DATA_EXPORT_SPEC.md).
- **PERF-0:** `fetchDomainBundle()` loads `fetchSalesHeadersLive()` (no line items); bill detail/edit uses `fetchSaleByBillNoLive(billNo)`.
- Supplier payable follows purchase total (credit purchases).

---

### `short_receives` *(pending supplier claims)*
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| purchase_line_id | uuid FK → purchase_lines | |
| supplier_id | uuid FK → suppliers | |
| product_id | uuid FK → products | |
| invoice_no | text | original invoice reference |
| short_qty | integer | qty not delivered |
| cost | numeric | cost per unit at time of invoice |
| short_amount | numeric GENERATED | short_qty × cost |
| status | text | `pending` / `settled` / `adjusted_in_invoice` |
| settled_in_purchase_id | uuid FK → purchases nullable | purchase it was finally deducted from |
| notes | text | |
| created_at | timestamptz | |

---

### `supplier_payments`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| supplier_id | uuid FK → suppliers | |
| amount | numeric NOT NULL | |
| mode | text | |
| reference | text | |
| date | date NOT NULL | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

**Side effects:** decrement `suppliers.outstanding`.

---

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| category | text NOT NULL | e.g. "Vehicle fuel" |
| amount | numeric NOT NULL | |
| notes | text | |
| date | date NOT NULL | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

**Side effects:** increment `daily_cash.cash_paid_out` if category is cash expense.

---

### `daily_cash`
One row per day per tenant:
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| date | date NOT NULL UNIQUE per tenant | |
| opening_balance | numeric | Carried from previous day closing |
| cash_sales | numeric DEFAULT 0 | Auto-summed from sales where mode=cash |
| cash_receipts | numeric DEFAULT 0 | Auto-summed from payments where mode=cash |
| cash_paid_out | numeric DEFAULT 0 | Auto-summed from cash expenses + supplier payments |
| physical_count | numeric | Entered by user |
| variance | numeric GENERATED | physical_count − computed_balance |
| variance_note | text | Required if variance ≠ 0 |
| status | text CHECK IN ('draft','locked') DEFAULT 'draft' | |
| locked_at | timestamptz | |
| created_at | timestamptz | |

---

### `capital_entries`
Records every investment in the business from day 1 — fixed assets, owner capital, loans, deposits.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| category | enum('fixed_asset','inventory','deposit','owner_capital','loan') | |
| name | text NOT NULL | e.g. "Deep freezer Haier 500L" |
| amount | numeric NOT NULL | Original / purchase amount |
| current_value | numeric | Book value after depreciation (defaults to `amount`, updated manually) |
| date | date NOT NULL | Date of purchase / investment |
| notes | text nullable | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

**Side effects on save by category:**

| Category | Side effects |
|---|---|
| `owner_capital` | Increment `bank_balance.balance` or `daily_cash.owner_inject` for that date — owner brought cash in |
| `loan` | Increment `bank_balance.balance` by `amount`; add to `loan_outstanding` (tracked via `loan_repayments` table) |
| `fixed_asset` | No cash side effect (asset already physically acquired); recorded for balance sheet only |
| `inventory` | Increment `products.on_hand` for the relevant product (or link to a purchase record) |
| `deposit` | Decrement `bank_balance.balance` or `daily_cash.cash_paid_out`; deposit appears as asset |

---

### `bank_balance`
Tracks business bank account balance (manually updated — no bank API integration in v1):

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| balance | numeric NOT NULL DEFAULT 0 | Current bank balance |
| as_of_date | date NOT NULL | Date of last manual update |
| notes | text | e.g. "After NMB transfer on 14 May" |
| updated_by | uuid FK → users | |
| updated_at | timestamptz | |

> v2: Replace with bank statement import / open banking API.

---

### `loan_repayments`
Tracks EMI / partial repayments against a loan capital entry:

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| capital_entry_id | uuid FK → capital_entries | Must be category='loan' |
| amount | numeric NOT NULL | EMI or lump sum repaid |
| mode | text | Cash / Bank transfer |
| reference | text | Bank ref / receipt no. |
| date | date NOT NULL | |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

`loan_outstanding = capital_entries.amount − SUM(loan_repayments.amount)`

---

### `schemes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text NOT NULL | |
| product_id | uuid FK → products | |
| discount_type | text CHECK IN ('percent','flat') | |
| discount_value | numeric NOT NULL | |
| start_date | date NOT NULL | |
| end_date | date NOT NULL | |
| notes | text | |
| created_at | timestamptz | |

---

## Dashboard queries (period KPIs)

```sql
-- Total sales (period) — grand_total is after_discount + bill_terms + VAT
SELECT SUM(grand_total) FROM sales
WHERE tenant_id = $1 AND date BETWEEN $from AND $to;

-- Net profit (period) — returns reduce net revenue
SELECT
  COALESCE((SELECT SUM(grand_total)    FROM sales      WHERE tenant_id=$1 AND date BETWEEN $from AND $to), 0)
- COALESCE((SELECT SUM(credit_amount)  FROM returns    WHERE tenant_id=$1 AND date BETWEEN $from AND $to), 0)
- COALESCE((SELECT SUM(total)          FROM purchases  WHERE tenant_id=$1 AND date BETWEEN $from AND $to), 0)
- COALESCE((SELECT SUM(amount)         FROM expenses   WHERE tenant_id=$1 AND date BETWEEN $from AND $to), 0)
AS net_profit;

-- Outstanding aging buckets
SELECT
  CASE
    WHEN CURRENT_DATE - ob.due_date BETWEEN 0  AND 7  THEN '0-7'
    WHEN CURRENT_DATE - ob.due_date BETWEEN 8  AND 30 THEN '8-30'
    WHEN CURRENT_DATE - ob.due_date BETWEEN 31 AND 60 THEN '31-60'
    ELSE '60+'
  END AS bucket,
  SUM(ob.balance) AS amount
FROM outstanding_bills ob
WHERE ob.tenant_id = $1 AND ob.status != 'paid'
GROUP BY bucket;
```

---

## Company overview query (balance sheet)

```sql
-- ── ASSETS ───────────────────────────────────────────────────────────────────

-- 1. Fixed assets (book value)
SELECT SUM(current_value) FROM capital_entries
WHERE tenant_id=$1 AND category='fixed_asset';

-- 2. Security deposits
SELECT SUM(current_value) FROM capital_entries
WHERE tenant_id=$1 AND category='deposit';

-- 3. Stock at cost (LIVE — computed from products)
SELECT SUM(p.on_hand * p.cost_price) FROM products p
WHERE p.tenant_id=$1;

-- 4. Cash in hand (latest locked or draft daily_cash)
SELECT physical_count FROM daily_cash
WHERE tenant_id=$1 ORDER BY date DESC LIMIT 1;

-- 5. Bank balance (latest manual update)
SELECT balance FROM bank_balance
WHERE tenant_id=$1 ORDER BY as_of_date DESC LIMIT 1;

-- 6. Customer outstanding (receivable)
SELECT SUM(outstanding) FROM customers WHERE tenant_id=$1;


-- ── LIABILITIES ──────────────────────────────────────────────────────────────

-- 7. Supplier payable
SELECT SUM(outstanding) FROM suppliers WHERE tenant_id=$1;

-- 8. Loan outstanding
SELECT
  ce.amount - COALESCE(SUM(lr.amount), 0) AS loan_outstanding
FROM capital_entries ce
LEFT JOIN loan_repayments lr ON lr.capital_entry_id = ce.id
WHERE ce.tenant_id=$1 AND ce.category='loan'
GROUP BY ce.id;


-- ── OWNER EQUITY ─────────────────────────────────────────────────────────────

-- 9. Owner capital invested
SELECT SUM(amount) FROM capital_entries
WHERE tenant_id=$1 AND category='owner_capital';

-- 10. Retained earnings (P&L from inception — all time, no date filter)
--     Returns reduce net revenue (credit notes), so subtract — do not add.
SELECT
  COALESCE((SELECT SUM(grand_total)   FROM sales     WHERE tenant_id=$1), 0)
- COALESCE((SELECT SUM(credit_amount) FROM returns   WHERE tenant_id=$1), 0)
- COALESCE((SELECT SUM(total)         FROM purchases WHERE tenant_id=$1), 0)
- COALESCE((SELECT SUM(amount)        FROM expenses  WHERE tenant_id=$1), 0)
AS retained_earnings;

-- 11. Net worth = Total assets − Total liabilities
--     Should equal: Owner capital invested + Retained earnings
--     (If they don't match, there are unrecorded transactions — flag for audit)
```

> **Recommended:** Wrap this in a Supabase Edge Function `get_company_overview(tenant_id)`
> that returns all values in a single JSON response for the Company Overview page.

---

## Auth

- **Supabase Auth** with email + password (v1).
- `users` table: `id` (= `auth.uid()`), `tenant_id`, `role` (`owner` | `accountant`).
- RLS: all tables `USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))`.
- Google OAuth deferred to v2.

---

## Phase 2 — Planned features

> **Status: All items below are planned — not in v1 UI or backend.**  
> Phase 1 must be fully live and stable before any Phase 2 work begins.

---

### Cross-cutting policy — edits, inclusion in totals, audit, delete

> **Finalised product rules** for ledger-like data that affects **report totals** (capital first; other entities in later waves). Full detail under **Phase 2-C** (capital pilot) and **Phase 2-D** (bills — different pattern).

| Rule | Behaviour |
|------|-----------|
| **Include in calculations** | Rows have `included_in_reports` (default **true**). KPIs and company overview sums use only rows where this is true, `deleted_at` is null, and any entity-specific guards apply. |
| **Excluding from totals** | Turning **off** requires a **short reason** (stored on the row and/or in audit). Row **stays visible** with a badge such as “Excluded from totals” unless **soft-deleted**. |
| **History** | **Append-only** audit (`*_audit`) is **SELECT-only** for app users. Inserts/updates/deletes on the main table are logged with `before_row` / `after_row` and `changed_by` where implemented. |
| **Edits — non-amount** | **Allow** direct updates (name, notes, category, dates where allowed). Each change is audited. |
| **Edits — amounts** | Prefer **adjustment entry** (new row linked to prior entry) **or** an **audited update** behind an RPC that validates business rules. Avoid silent client-only amount changes. |
| **Delete** | **No hard delete** in the shop app (see [DELETE_POLICY.md](../DELETE_POLICY.md)). Financial/historical rows: soft hide / void / reverse only. Masters: **archive** (`is_active`). Future optional permanent master delete (unused only) is support/RPC — not v1 shop UI. |

**Rollout order**

1. **Pilot: capital** (Phase 2-C) — schema in `0002` already has `capital_entries` + `capital_entry_audit`; add inclusion columns + RPCs + UI.
2. **Sales bills** (Phase 2-D) — **not** the same as “untick from totals”: use **amendment** (`update_sales_bill`) + `sales_bill_audit`, or future **void** with reason; posted bills stay traceable.
3. **Later waves** (optional, same pattern where it fits): `expenses`, `damages`, purchases (heavier / stock), masters already use `is_active`.
4. **Data export** (Phase 2-E) — reporting CSV, full-tenant backup ZIP, migration columns — **deferred**; see [`../DATA_EXPORT_SPEC.md`](../DATA_EXPORT_SPEC.md) and [BACKEND-TODO § 2-E](./BACKEND-TODO.md). Today: single-bill PDF only; `papaparse` not wired.

---

### Phase 2-E — Data export (deferred)

> **Status:** Design + backlog only — not in app. Full spec: [`../DATA_EXPORT_SPEC.md`](../DATA_EXPORT_SPEC.md).

| Mode | Purpose |
|------|---------|
| **Reporting** | Date-range sales/purchase/payment registers, stock snapshot, customer outstanding — Excel-friendly CSV |
| **Migration / backup** | ZIP of relational CSVs + `README` + `manifest.json`; server-generated for large tenants |

**v1 scope when built:** Settings → Export hub; paginated reads (not full `fetchDomainBundle`); owner-only full ZIP. **Defer:** Tally sync, historical stock-as-of-date, bulk PDF ZIP.

---

### Phase 2-A — In-app notifications & reminders

#### Goal
Surface actionable alerts inside the app (bell icon) and optionally deliver them via SMS / WhatsApp so the dealer gets reminders even when the app is closed.

> **v1 status:** The `NotificationPanel` UI component is already built with static computed data. Phase 2-A replaces the static logic with a live `notifications` table + Supabase Realtime + optional SMS.

#### Notification event types

| # | Event | Trigger condition | Urgency | Delivery |
|---|---|---|---|---|
| 1 | Overdue bill | `outstanding_bills.balance > 0` AND `due_date < NOW() - overdue_days` | High | In-app + optional SMS |
| 2 | Due soon | `outstanding_bills.balance > 0` AND `due_date BETWEEN NOW() AND NOW() + due_soon_days` | Medium | In-app |
| 3 | Low stock | `products.on_hand ≤ products.min_qty` | Medium | In-app |
| 4 | Advance credit idle | `customers.advance_credit > 0` (unused ≥ 7 days) | Low | In-app |
| 5 | Short receive pending | `short_receives.status = 'pending'` | Medium | In-app |
| 6 | Daily cash open | Today's `daily_cash.status = 'draft'` after 7 PM | Low | In-app |
| 7 | Cheque clearing due | `payments.cheque_clearing_date = TODAY` AND `mode = 'cheque'` | High | In-app |
| 8 | Credit limit breached | `customers.outstanding > customers.credit_limit` | High | In-app |
| 9 | Scheme expiring soon | `schemes.end_date BETWEEN NOW() AND NOW() + 3 days` | Low | In-app |
| 10 | Supplier payment overdue | Purchase invoice past `suppliers.payment_terms_days` with open balance | Medium | In-app |

#### `notifications` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| type | text | One of the 10 event types above |
| title | text NOT NULL | Short headline shown in panel |
| body | text | Detail line |
| entity_type | text | `sale` / `product` / `customer` / `supplier` / `purchase` / `daily_cash` |
| entity_id | uuid | FK to the relevant table row |
| link_path | text | Deep-link path in app e.g. `/app/bills/HB-128` |
| is_read | boolean DEFAULT false | Marked true when user taps the card |
| is_urgent | boolean DEFAULT false | Drives red badge in header |
| created_at | timestamptz | |

#### Backend implementation
- **pg_cron job** (or Supabase Edge Function cron) runs every 15 minutes, scans all triggers above, and inserts new rows into `notifications` (deduplication: skip if identical `type + entity_id` already exists and `is_read = false`).
- **Supabase Realtime** subscription on the `notifications` channel → FE badge count updates instantly without polling.
- Thresholds (`overdue_days`, `due_soon_days`, `min_qty`, credit limit) are read from `tenant_settings` and `products` at cron run time.
- Bulk-dismiss: `UPDATE notifications SET is_read = true WHERE tenant_id = $1 AND is_read = false`.

#### Optional SMS / WhatsApp delivery
- Add per-type toggle columns to `tenant_settings` (e.g. `notify_overdue_sms boolean DEFAULT false`).
- On insert of an urgent notification, trigger an Edge Function `send-sms-alert` that calls **Sparrow SMS** (Nepal) or Twilio.
- Message template: `"[ShopName] Bill HB-128 for Ghantaghar Stores is overdue by 3 days. Balance: NPR 8,491. Reply STOP to opt out."` (prefix from tenant settings, not product brand)

#### FE changes (Phase 2-A)
- Replace static `buildNotifications()` in `NotificationPanel.tsx` with a Supabase `select` query on the `notifications` table.
- Subscribe to Supabase Realtime channel for live badge updates.
- Add Settings toggles for SMS/WhatsApp per notification type.

---

### Phase 2-B — Bill / invoice image capture

#### Goal
Allow the dealer to photograph a physical supplier delivery challan or invoice and have it:
1. Stored for reference (audit trail, dispute resolution)
2. Auto-extracted into structured data to pre-fill purchase / sale entry forms

#### `bill_images` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| entity_type | text CHECK IN ('sale','purchase','expense','damage') | What record it belongs to |
| entity_id | uuid | FK to the relevant table |
| storage_path | text NOT NULL | Supabase Storage path (`bills/{tenant_id}/{entity_id}/{uuid}.jpg`) |
| original_filename | text | |
| mime_type | text | image/jpeg, image/png, application/pdf |
| uploaded_at | timestamptz | |
| extracted_data | jsonb | Raw OCR / AI extraction result (pre-fill suggestion) |
| extraction_status | text CHECK IN ('pending','done','failed') DEFAULT 'pending' | |

#### Storage
- Bucket: `bill-images` (private, RLS-protected)
- Path convention: `{tenant_id}/{entity_type}/{entity_id}/{uuid}.{ext}`
- Max file size: 10 MB

#### Extraction pipeline
```
Upload image → Supabase Storage
    → trigger Edge Function `extract-bill-image`
        → call OpenAI Vision / Google Document AI
        → parse: supplier name, invoice no., date, line items (name, qty, rate), total, PAN/VAT
        → store result in bill_images.extracted_data (jsonb)
        → mark extraction_status = 'done'
    → FE polls / realtime subscription → shows pre-filled form for user to confirm
```

#### FE changes (Phase 2-B)
- Add camera / file picker button to `PurchasePage`, `SaleEntryPage`, `ExpensePage`
- Show extraction preview with editable fields (user can correct OCR errors before saving)
- After confirmation, save the real record AND link `entity_id` in `bill_images`
- Display attached images on `BillDetailPage` in a photo strip at the bottom

---

### Phase 2-C — Capital & fixed assets (inclusion, edit, soft delete, history)

#### Goal
Persist **owner capital, loans, deposits, inventory capitalisation, and fixed assets** in Postgres with:

1. **Current row** — one row per line; **non-amount** fields editable with full audit.
2. **Include in report totals** — `included_in_reports` (default true). Company overview / capital KPIs sum only **included**, non–soft-deleted rows (see **Cross-cutting policy** above).
3. **Excluding from totals** — user sets `included_in_reports = false` with a **required reason** (`excluded_reason`); row remains listed with a clear badge.
4. **Amount / `current_value` changes** — prefer **adjustment row** (e.g. `supersedes_entry_id` or linked note) or **RPC** `upsert_capital_entry` that enforces validation; all changes recorded in `capital_entry_audit`.
5. **Soft delete only** — set `deleted_at`; no app-driven hard `DELETE` for normal users. Optionally route soft delete through `soft_delete_capital_entry` RPC.
6. **Append-only history** — existing trigger on `capital_entries` → `capital_entry_audit`; **“View history”** in UI: `select … from capital_entry_audit where capital_entry_id = $1 order by changed_at desc`.

#### Implementation (planned migration, e.g. `0006_capital_inclusion.sql`)

New columns on `capital_entries` (names indicative):

| Column | Type | Notes |
|---|---|---|
| `included_in_reports` | boolean NOT NULL DEFAULT true | When false, row excluded from KPI sums |
| `excluded_reason` | text | Required when `included_in_reports = false` (enforce via CHECK or RPC) |
| `excluded_at` | timestamptz | Optional; when excluded |
| `excluded_by` | uuid | Optional; `auth.uid()` |
| `supersedes_entry_id` | uuid FK | Optional; links **adjustment** / correction row to prior row |

Existing columns (from `0002`): `id`, `tenant_id`, `name`, `category`, `entry_date`, `amount`, `current_value`, `notes`, `deleted_at`, `created_at`, `updated_at`.

#### `capital_entry_audit` (append-only) — unchanged shape
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | Denormalised for RLS-friendly selects |
| capital_entry_id | uuid | Target row at time of change |
| action | text NOT NULL | CHECK: `insert`, `update`, `delete` |
| changed_at | timestamptz NOT NULL DEFAULT now() | |
| changed_by | uuid | `auth.uid()` when invoked from the app |
| before_row | jsonb | Full row as JSON before change (`NULL` on insert) |
| after_row | jsonb | Full row as JSON after change (`NULL` on hard delete) |

> **Implementation:** Keep the existing `SECURITY DEFINER` trigger in `0002`. Add RPCs such as `set_capital_included(p_id, p_included, p_reason)` and optional `soft_delete_capital_entry` for consistent policy.

#### RLS
- `capital_entries`: same tenant-scoped pattern (`tenant_id = current_tenant_id()`).
- `capital_entry_audit`: **`SELECT` only** for tenant members.

#### FE changes (Phase 2-C)
- List: badges **Included** / **Excluded**; show `entry_date`, `created_at`, amounts, category; filter archived / soft-deleted.
- **Toggle include:** switch + modal **“Reason for excluding from totals?”** when turning off.
- **Edit:** form for non-amount fields; separate flow for amount (**adjustment** or audited RPC).
- **History:** read-only modal from `capital_entry_audit`.
- Wire [`summarizeCapital`](../../app/src/lib/capitalSummary.ts) / [`CompanyOverviewPage`](../../app/src/pages/company/CompanyOverviewPage.tsx) / live fetches to respect `included_in_reports` and `deleted_at`.

#### Schema status
- Base: **`app/supabase/migrations/0002_tenant_settings_capital_audit.sql`**.
- Inclusion columns + RPCs: **future migration** (e.g. `0006_…`).

---

### Phase 2-D — Sales bill edit + amendment history

#### Goal
Allow dealers to **correct an existing sales bill** in live mode (wrong qty, rate, discount, customer, due date) while keeping an **immutable amendment trail** for disputes and audits — **append-only audit** (`before_row` / `after_row`) like `capital_entry_audit`, but **not** the capital “include in totals / exclude with reason” model (see **Policy vs capital** below).

> **Phase 1 status:** Create via `create_sales_bill` (`0003`); **edit** via `update_sales_bill` (`0007`) wired from `commitSaleLive` on `/app/sales/edit/:billNo`. **Still open for 2-D:** append-only `sales_bill_audit` + Amendment history UI on bill detail.

**Policy vs capital:** Posted bills are **not** controlled by an “include in totals” tick like capital lines. Corrections use **amendment** (same `bill_no`, audited change) or future **void** (`voided_at` / reason), with stock and payment rules enforced in RPC — see **Cross-cutting policy**.

#### Why not Phase 1
Editing a posted bill is not a single-row update. It must reconcile:

| Concern | On edit |
|---|---|
| Stock | Reverse quantities from old `sales_items`, apply new lines (`v_stock` must stay consistent) |
| Bill totals | Recompute subtotal, discount, VAT, extra charges, `total`, and **open balance** |
| Payments | `paid` may already be &gt; 0; open = `total − paid` must not go negative without a business rule |
| Returns | Returns reference `bill_id`; line/product changes must not orphan return rows |
| Bill number | `bill_no` is stable (identity); edit amends the same bill, does not create a new number |

#### `sales_bill_audit` (append-only, new migration in Phase 2)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | Denormalised for RLS-friendly selects |
| sales_bill_id | uuid FK | Target `sales_bills.id` |
| action | text NOT NULL | CHECK: `insert`, `update`, `delete` |
| changed_at | timestamptz NOT NULL DEFAULT now() | |
| changed_by | uuid | `auth.uid()` from the app session |
| before_row | jsonb | Header + nested lines snapshot before change (`NULL` on insert) |
| after_row | jsonb | Snapshot after change (`NULL` on hard delete) |

Optional: `change_reason text` (user-entered note on amend) if product wants it on the audit row.

> **Implementation:** Prefer a single **`update_sales_bill`** RPC (security definer or invoker + RLS) that runs header/lines/stock/audit in **one transaction**, similar to `create_sales_bill`. A trigger-only approach on `sales_bills` / `sales_items` is harder because line diffs are multi-table.

#### RPC sketch: `update_sales_bill`

**Inputs (illustrative):** `p_bill_id uuid`, header fields (dates, discount, VAT, terms, notes), `p_lines jsonb` (product_id, qty, rate, …), optional `p_reason text`.

**Steps:**
1. Load current bill + items; verify `tenant_id` and bill exists.
2. Validate business rules (e.g. cannot reduce `total` below `paid` without explicit credit handling; or allow only if no returns — product decision).
3. Apply stock reversal for old lines, then stock out for new lines.
4. Replace or upsert `sales_items`; update `sales_bills` totals and `paid` / open balance.
5. Insert `sales_bill_audit` with `action = 'update'`, full `before_row` / `after_row` JSON (header + lines array).

**Grants:** `GRANT EXECUTE … TO authenticated` (same as Phase 1 RPCs).

#### RLS
- `sales_bill_audit`: **SELECT** for tenant members only; no client INSERT/UPDATE/DELETE (append via RPC/trigger only).

#### FE changes (Phase 2-D)
- `domainLive`: `updateSalesBillLive` + `fetchSalesBillAuditLive`.
- `domainHooks`: `commitSale` edit branch calls update RPC when `isSupabaseConfigured` and bill already exists.
- `SaleEntryPage`: remove live edit guard; load bill from server by `billNo` / id when editing.
- `BillDetailPage`: **Amendment history** list/modal from `sales_bill_audit`; optionally hide **Edit** until RPC is deployed.
- E2E: extend `e2e-phase1-matrix.mjs` with edit + audit assertions.

---

**See also:** [Docs hub](../README.md) · [Backend checklist](./BACKEND-TODO.md) · [Data export spec](../DATA_EXPORT_SPEC.md) · [Automated E2E](./phase1-use-cases-and-tests.md) · [Manual E2E](./phase1-manual-e2e-checklist.md)
