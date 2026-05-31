# Your turn — Phase 0 Tier A (manual + commands)

**Status:** **Tier A sign-off complete** (migrations 0019–0023, `deploy:check`, `e2e:export`, manual UI). Next: merge **dev → main**, deploy, optional accountant export sample (§5).

Code for Tier A is in the repo. Paste errors back to Cursor if a regression appears.

**Navigate:** [phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) · [supabase README](../app/supabase/README.txt) · [PHASE0_TIER_A_RESEARCH.md](PHASE0_TIER_A_RESEARCH.md)

---

## 1. Supabase migrations (required once)

In [Supabase SQL Editor](https://supabase.com/dashboard), run **in order** (copy full file → Run):

| Step | File |
|------|------|
| 20 | `app/supabase/migrations/0019_tenant_product_categories.sql` |
| 21 | `app/supabase/migrations/0020_stock_adjustments.sql` (drops `v_stock` then recreates — safe on re-run if view step failed mid-file) |
| 22 | `app/supabase/migrations/0021_tenant_allow_stock_adjustment.sql` |
| 23 | `app/supabase/migrations/0022_tenant_list_page_size.sql` |
| 24 | `app/supabase/migrations/0023_tenant_show_district_on_bill.sql` |

Quick verify:

```sql
select column_name from information_schema.columns
where table_name = 'tenant_settings'
  and column_name in (
    'product_categories',
    'allow_stock_adjustment',
    'list_page_size',
    'show_district_province_on_bill'
  );

select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'record_stock_adjustment';
```

Expect 4 columns + 1 RPC row.

---

## 2. Commands (from `app/`)

```bash
cd app
npm run deploy:check
npm run e2e:tier-a
# or: npm run e2e:export
npm run e2e:suppliers
npm run e2e:bill
```

If you use live Supabase credentials (`app/.e2e-credentials.local`):

```bash
npm run e2e:suppliers:live
npm run e2e:bill:live
npm run e2e:matrix
```

Paste any failing output to the agent (one message per failure).

---

## 3. Manual UI (~20 min)

Full checklist: **[phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md)** §3.0a (T0A1–T0A10). Quick list:

| # | Do | Pass |
|---|-----|------|
| 1 | Header **Settings** (gear) → opens `/app/settings` | |
| 2 | **Export** tab → download **Products** CSV → open in Excel | Header row, UTF-8 OK |
| 3 | **Business** → add category e.g. `Snacks` → Save → **Products → New** | Category in dropdown |
| 4 | New product: set **Opening qty** → Save → **Stock** | Opening · Purchased columns |
| 5 | **Stock** tab → enable **Allow stock adjustment** → Save | |
| 6 | **More** → **Stock adjustment** → +5 on a product → Stock page | On hand +5 |
| 7 | Settings: **VAT** + VAT number → save → sales bill **Print** | Title **TAX INVOICE** |
| 8 | Login screen | Shows **BikriKhata** |

Full rows: [phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) §3.2 Settings tabs.

---

## 4. Product name (WS0.3)

**Interim:** **BikriKhata** in `app/src/config/productBrand.ts` (build syncs PWA/`index.html`). Final name review after Phase 0 — [BRAND_NAME_OPTIONS.md](BRAND_NAME_OPTIONS.md).

---

## 5. Accountant sample (optional, high value)

Settings → Export → set last 30 days → download **Sales register**, **Purchases**, **VAT period summary**.

Send one set to your CA; note any missing column in chat.

---

## 6. Git / deploy (when ready)

Only if you want to ship:

```bash
git status
git add …   # you choose files
git commit -m "Phase 0 Tier A: export, stock, perf, settings tabs"
git push
```

Netlify build uses `npm run deploy:check` from `app/`.

---

## Tier A checklist

- [x] Migrations **0019–0023** applied
- [x] `deploy:check` + `e2e:export` green
- [x] Export CSV opens in Excel
- [x] Categories + opening stock + stock adjustment
- [x] Tax Invoice print (VAT tenant)
- [x] Sales / Purchase invoice labels in UI
- [x] Product name **BikriKhata** (domain bikrikhata.com)
