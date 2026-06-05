# Marketing screenshots plan

> **Phase 0 landing** — hero: headline + logo aside + **desktop** dashboard; pain cards in `#why`; then `KeyFeaturesSection`.

## Hero

> Hero (`desktop-dashboard.png`, 1440×900) — **Business Dashboard** with **nav drawer open** (Masters + New entry visible). Capture seeds realistic sales/collection and `Shree Bajrang Traders` branding (`npm run capture:marketing`).

## Legacy: bill hero (replaced)

> Former hero was `mobile-bill.png` (bill detail + Share / Print / PDF). Bill PNG is still used in **Key features** row 1.

## Four combined features (landing row)

| # | Combined feature | App screen | PNG | One-line caption (under phone) |
|---|------------------|------------|-----|--------------------------------|
| 1 | **Sales billing** | `/app/sales/new` — new sales invoice | `mobile-sales-new.png` | Create a sales invoice: pick customer, add products, VAT, discount, then save. |
| 2 | **Godown stock** | `/app/home?tab=stock` | `mobile-inventory.png` | See on-hand qty by SKU — updates after every sale, purchase, return, and damage. |
| 3 | **Purchase & supplier** | `/app/purchases/:id` print view | `mobile-purchase.png` | Record a supplier bill with VAT; stock in and supplier balance due stay in sync. |
| 4 | **Customers & credit** | `/app/home?tab=customers` | `mobile-customers.png` | Each dealer’s balance and overdue days — collect payment against open bills. |

## What we folded in (not separate phones)

| Capability | Where it appears |
|------------|------------------|
| PAN/VAT tax invoice (print/PDF) | **Hero** bill + Features step 1 |
| Schemes, pack/PCS | Features step 1 bullets; pain card #3 |
| Sales returns & damage | Features step 2 bullets; godown stock caption |
| Reports / CA export | Features step 4; pricing checklist |

## Regenerate assets

```bash
cd app && npm run dev   # if not running
npm run capture:marketing
```

## Data quality before capture

- Run `npm run seed:demo` or clean E2E product/customer names in capture script branding.
- Prefer a sales bill with VAT + discount for hero; purchase with VAT > 0 for slot 3.
