# Purchase reference numbers

**Navigate:** [Docs hub](README.md) · [Migrations](../app/supabase/README.txt)

## What users see

- **Invoice no.** — number on the supplier’s bill. Required when recording a purchase. **Cannot be changed** after save (edit only updates lines, date, supplier).
- **PO (`purchase_no`, e.g. `PO-00022`)** — generated in the database for internal use only. **Not shown in the app UI.**

## Why PO still exists in the backend

Sequential `purchase_no` per tenant: stable row identity, RPC returns, support/debug. Users work with **invoice no.** only.

## Migrations

| Migration | Purpose |
|-----------|---------|
| `0014_supplier_invoice_no.sql` | Column + save on `record_purchase` |
| `0015_purchase_invoice_immutable.sql` | Earlier edit guard (superseded by 0016 for RPC) |
| `0016_purchase_invoice_backfill.sql` | Backfill `INV-001`, `INV-002`, … + one-time set on edit when empty |
| `0017_purchase_vat.sql` | Settings default VAT %; line `rate_excl`; purchase bill VAT totals |

## UI

- **New purchase** — type supplier **invoice no.** (required); plain text field (no voice/mic).
- **Edit purchase** — if invoice was empty, enter once; then locked forever (lines, date, supplier only).
- **After 0016** — old rows without a number get `INV-001`, `INV-002`, … automatically in the database.
- **Purchase entry** — line **buy excl. VAT**; incl. per unit from **Settings → Default VAT %**.
- **Totals** — sticky bar and summary show `VAT (X%)` and `Total (incl. X% VAT)`.
- **Purchase detail** — seller letterhead per [IRD_BILL_LETTERHEAD.md](IRD_BILL_LETTERHEAD.md); supplier block: name, address, phone; meta: invoice no., date, miti, supplier **VAT** or **PAN**.
- **Line table** — Rate excl, VAT column, Amount (incl.).
- **Lists** — title = supplier invoice no. (not PO).

## Product catalog (related)

- **Buy price** — entered **excl. VAT**; stored in DB as VAT-inclusive `purchase_price` for purchase prefill.
- **Sell price excl. VAT** — optional (may be 0 until set); markup can auto-fill from buy × markup %.

## Tests

- `npm run e2e:suppliers` — source checks (invoice field, bill layout, product pricing).
- `npm run e2e:suppliers:live` — Supabase reads + `update_purchase` RPC.
