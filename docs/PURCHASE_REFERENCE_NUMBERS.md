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

## UI

- **New purchase** — enter invoice no. (keyboard or **mic**); required.
- **Edit purchase** — if invoice missing, enter once (voice or type); then locked forever.
- **After 0016** — old rows without a number get `INV-001`, `INV-002`, … automatically in the database.
- **Lists / detail** — title = invoice no.
