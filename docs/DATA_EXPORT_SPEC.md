# Data export system — design spec (Phase 2-E)

**Navigate:** [Launch roadmap Phase 0](../PHASE_ROADMAP.md) · [Docs hub](README.md) · [Backend checklist](backend/BACKEND-TODO.md) · [Data model](backend/data-model.md) · [LLM context](LLM_CONTEXT.md)

**Status:** **Partial** — Tier A export shipped (Settings → Export); **full backup + import + restore → Phase 2** ([IMP-0/1/2](DEFERRED_WORK.md)).  
**Last updated:** 2026-05-26

**Target users:** Small Nepal distributors, warehouse staff, accountants — mobile-first, Excel-friendly, trust-building.

---

## 1. Goals

| Goal | Why |
|------|-----|
| **Trust** | Owner can download “all my data” if they leave or distrust cloud |
| **Accountant** | Sales/purchase/payment registers by date range |
| **Excel** | CSV opens cleanly in Excel (UTF-8 BOM, plain numbers — no `Rs.` in cells) |
| **Migration** | Stable IDs + relational files for handoff to another system |
| **Simple** | Not enterprise ERP — no Tally sync in v1 |

**Today:** Single-bill PDF/print only. `papaparse` is installed but unused. Do **not** export via loading full `fetchDomainBundle()` / `fetchSalesLive()` into memory for large tenants.

---

## 2. Three export types (keep separate)

| Type | Purpose | Typical output |
|------|---------|----------------|
| **Reporting export** | Period analysis, accountant, VAT prep | One CSV per report (date range) |
| **Migration export** | Leave platform, vendor handoff | ZIP of relational CSVs + README |
| **Backup export** | Trust / disaster recovery | Same as migration + `manifest.json` (timestamp, app version, row counts) |

- **Reporting** may hide `purchase_price` (owner-only “full” pack includes cost).
- **Migration** includes UUIDs and foreign keys (`bill_id`, `product_id`, …).
- Use **transaction dates** (`bill_date`, `purchase_date`, …), not `created_at`, unless labeled.

---

## 3. Architecture

```
app/src/lib/export/
  types.ts              # ExportKind, options
  columns.ts            # Column defs per entity (single source of truth)
  csv.ts                # Papa unparse, UTF-8 BOM for Excel
  fetchPaginated.ts     # Supabase .range() loops — do not use full bundle
  buildRegisters.ts     # Denormalized rows for reporting
  download.ts           # Browser download trigger

app/src/pages/settings/DataExportPage.tsx   # hub UI

supabase/functions/export-tenant/           # P0 full ZIP (or RPC + Storage signed URL)
```

| Layer | Use for |
|-------|---------|
| **Client + pagination** | Masters (products, customers), stock snapshot, **date-range** registers |
| **Server (Edge Fn / RPC)** | Full tenant ZIP; tenants with many years of bills |

**Safety:** RLS + `auth.uid()` tenant only; never service-role in browser. Rate limit full export. Optional P1: `export_runs` audit (who, when, type, row counts).

---

## 4. UX placement

**Primary:** Settings → **Export data**

1. **Quick exports** — Products, Customers, Stock now (no date).
2. **Period reports** — From / To → Sales (header + lines), Purchases, Payments, Customer outstanding.
3. **Full backup** — “Download all my data (ZIP)” + last run time + size warning.

**Secondary:** List pages (Products, Stock) → “Export CSV” (same engines).

**Roles:** `owner` — full backup + cost columns; `accountant` — reporting + masters (align with existing roles).

**Copy:** *“Downloads a copy of your business data. Keep it private. For Excel, your accountant, or backup.”*

---

## 5. File formats and ZIP layout (migration / backup)

**Prefer:** Multiple CSVs in one ZIP (not one 100MB flat file).

```
{business_slug}_{yyyy-mm-dd}/
  README.txt
  manifest.json       # counts, export_version, app_version, exported_at
  products.csv
  customers.csv
  suppliers.csv
  sales_bills.csv
  sales_items.csv
  purchases.csv
  purchase_items.csv
  payments.csv
  returns.csv
  expenses.csv
  damages.csv
  stock_snapshot.csv
  tenant_settings.csv # non-secret fields only
```

**Reporting** (single file examples):

- `sales_register_{from}_{to}.csv` — bill headers
- `sales_lines_{from}_{to}.csv` — denormalized lines (bill_no, product_name, qty, unit, rate, …)
- `purchases_register_{from}_{to}.csv`
- `payments_register_{from}_{to}.csv`
- `customer_outstanding_{date}.csv` — from `v_customer_balance`

**Naming:** `snake_case` English headers; dates `YYYY-MM-DD`; amounts as numbers.

**Filename pattern:** `{slug}_{export_type}_{from}_{to}.csv` or `.zip`

---

## 6. Column highlights (reference)

**sales_bills:** `bill_id`, `bill_no`, `bill_date`, `customer_id`, `customer_name`, `payment_mode`, `subtotal`, `discount`, `vat_amount`, `extra_charges`, `total`, `paid`, `balance`, `notes`

**sales_items:** `line_id`, `bill_id`, `bill_no`, `bill_date`, `product_id`, `product_code`, `product_name`, `qty`, `unit`, `rate`, `line_total`

**products:** `product_id`, `code`, `name`, `category`, `unit`, `purchase_price`, `sale_price`, `mrp`, `discount_pct`, `vat_applicable`, `min_qty`, `opening_stock`, `on_hand` (from `v_stock`), `active`

**stock_snapshot:** `exported_at`, `product_id`, `code`, `name`, `unit`, `opening_stock`, `purchased`, `sold`, `damaged`, `returned`, `closing_stock`

**payments:** One row per allocation (`payments.bill_id`); include `bill_no` via join for humans.

---

## 7. Stock snapshots (v1)

- Export **`v_stock` at export time** only.
- Label: **“Stock as of {datetime}”** — not historical as-of-date.
- Historical stock-by-date is **deferred** (needs movement ledger export).

---

## 8. Nepal accountant expectations (v1 scope)

Build registers, not IRD filing XML:

1. Sales book (bill-wise)
2. Purchase book
3. Stock statement
4. Customer outstanding / aging
5. Payment register

**P1:** VAT period summary from `sales_bills.vat_amount` (if tenant VAT registered).

**Defer:** Tally bridge, IRD e-invoice, full tax annexes.

---

## 9. Migration story

**Into app (onboarding):** Products → opening stock / opening purchase → customers (+ opening balance) → go-live sales. Historical bills often skipped.

**Phase 2 import program ([DEFERRED_WORK.md](DEFERRED_WORK.md)):**

| ID | What |
|----|------|
| **IMP-0** | Export **everything** in one ZIP (trust + handoff) |
| **IMP-1** | Per-entity CSV import (templates + upload + row errors) |
| **IMP-2** | Optional full restore: masters + open udhar + history (Tier A–C) |

**Out of app:** Full ZIP + README; human registers even if they never re-import elsewhere.

**Known schema gap:** `returns` table has no `bill_id` — `apply_goods_return` uses bill in RPC only. Add `returns.bill_id` before **IMP-2** Tier B/C; document limitation until then.

---

## 10. Roadmap

### P0

- [ ] Settings → Export data hub
- [ ] CSV: products, customers, stock snapshot (client, paginated if needed)
- [ ] Date-range: sales headers, sales lines, purchases, payments, customer outstanding
- [ ] Full tenant backup ZIP (server-generated)
- [ ] README + manifest in ZIP
- [ ] Row cap + user message for oversized exports
- [ ] Owner vs accountant column sets (cost price)

### P1

- [ ] Single `.xlsx` accountant pack (multi-sheet)
- [ ] Expenses, damages, returns registers
- [ ] `export_runs` audit table
- [ ] `returns.bill_id` migration
- [ ] VAT period summary export

### P2 → Phase 2 (**IMP-0**, **IMP-1**, **IMP-2**)

See [DEFERRED_WORK.md](DEFERRED_WORK.md):

- [ ] **IMP-0** — Complete backup ZIP (settings, suppliers, payments, all entities, all-history option)
- [ ] **IMP-1** — Import hub + templates per entity (products, customers, suppliers, categories, settings, stock)
- [ ] **IMP-2** — Restore / migration import (resume business from backup; Tier A–C)
- [ ] Async large export + notification
- [ ] Incremental backup

### Deferred

- Tally / Busy sync
- Stock as-of historical date
- Bill PDF bulk ZIP

---

## 11. Implementation phases (effort guide)

| Phase | Scope | Rough effort |
|-------|--------|--------------|
| **A** | `lib/export` foundation + masters + Settings page | 3–5 days |
| **B** | Date-range reporting CSVs + limits | 3–5 days |
| **C** | Server ZIP backup | 5–8 days |
| **D** | `export_runs`, e2e header tests, docs | 2–3 days |

---

## 12. Anti-patterns

- One giant CSV for entire tenant
- Reusing `fetchDomainBundle()` for export
- `Rs.` inside numeric cells (breaks Excel sums)
- Service role key in browser
- Promising Tally import in v1
- Historical stock-as-of without ledger work

---

## 13. Related code today

| Area | Path |
|------|------|
| Reads | `app/src/lib/live/domainLive.ts` — `fetchDomainBundle`, `fetchSalesLive`, `v_stock` |
| Bill PDF | `app/src/lib/billExport.ts` — single bill only |
| CSV dep | `app/package.json` — `papaparse` |

---

**See also:** [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) § Phase 2-E · [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md)
