================================================================================
HOW TO APPLY MIGRATIONS (Supabase project: luvjcpawlteawovjmeuw)
================================================================================

  Documentation hub: ../../docs/README.md
  Deployment (Netlify + CI): ../../docs/deployment.md

I cannot run these on your Supabase account from here — you (or a teammate) must
run them once in the Dashboard or via CLI on your machine.

Choose ONE method below.

--------------------------------------------------------------------------------
METHOD A — SQL Editor (recommended; ~10 minutes)
--------------------------------------------------------------------------------

1. Open https://supabase.com/dashboard and select project
   "Dealer Management System (DMS)".

2. Left sidebar → SQL Editor → click "+ New query".

3. Migration 0001 (core schema)
   - On your computer, open this file in an editor:
       app/supabase/migrations/0001_init.sql
   - Select ALL (Cmd+A), Copy (Cmd+C).
   - Paste into the SQL Editor query box.
   - Click "Run" (or Cmd+Enter).
   - Wait until it finishes. Bottom should say "Success" (green).
   - If you see red errors, STOP and fix before 0002 (copy the error text).

4. Migration 0002 (settings, capital, audit, signup_tenant update)
   - New query again (+ New query).
   - Open: app/supabase/migrations/0002_tenant_settings_capital_audit.sql
   - Copy entire file → Paste → Run → Success.

5. Migration 0003 (Phase 1 RPCs: sales, payments, purchases, etc.)
   - New query again.
   - Open: app/supabase/migrations/0003_phase1_operations.sql
   - Copy entire file → Paste → Run → Success.

6. Migration 0005 (fix payment / return / purchase RPCs — required if 0003 was applied before May 2026)
   - Open: app/supabase/migrations/0005_fix_phase1_rpc_jsonb.sql
   - Copy entire file → Paste → Run → Success.

7. Migration 0006 (supplier_payments ledger — supplier pay + daily cash supplier line)
   - Open: app/supabase/migrations/0006_supplier_payments_ledger.sql
   - Copy entire file → Paste → Run → Success.

8. Migration 0007 (update_sales_bill — edit existing bills from the app + API matrix)
   - Open: app/supabase/migrations/0007_update_sales_bill.sql
   - Copy entire file → Paste → Run → Success.

9. Migration 0008 (products.uom_prices — per-unit MRP/sell on product master)
   - Open: app/supabase/migrations/0008_product_uom_prices.sql
   - Copy entire file → Paste → Run → Success.

10. Migration 0009 (products.uom_conversion — e.g. 1 Box = 10 PCS)
   - Open: app/supabase/migrations/0009_product_uom_conversion.sql
   - Copy entire file → Paste → Run → Success.

11. Migration 0010 (sales_items.unit + v_stock pack→base qty + RPCs store unit)
   - Open: app/supabase/migrations/0010_sales_items_unit_stock.sql
   - Copy entire file → Paste → Run → Success.

12. Migration 0011 (default_min_pack_qty + products.min_qty_pack for Box/PCS alerts)
   - Open: app/supabase/migrations/0011_min_stock_pack_threshold.sql
   - Copy entire file → Paste → Run → Success.

13. Migration 0012 (scheme_tracker buy_uom / free_uom — optional; “1 Box → 1 PCS free”)
   - Open: app/supabase/migrations/0012_scheme_uom.sql
   - Copy entire file → Paste → Run → Success.
   - Same-UOM schemes (buy 10 get 1) work without this migration.

14. Migration 0013 (update_purchase — edit supplier invoices from the app)
   - Open: app/supabase/migrations/0013_update_purchase.sql
   - Copy entire file → Paste → Run → Success.

15. Migration 0014 (supplier_invoice_no — save supplier bill number on purchase)
   - Open: app/supabase/migrations/0014_supplier_invoice_no.sql
   - Copy entire file → Paste → Run → Success.

16. Migration 0015 (invoice no. immutable on edit — update_purchase skips supplier_invoice_no)
   - Open: app/supabase/migrations/0015_purchase_invoice_immutable.sql
   - Copy entire file → Paste → Run → Success.

17. Migration 0016 (backfill INV-001… for old purchases + one-time set on edit)
   - Open: app/supabase/migrations/0016_purchase_invoice_backfill.sql
   - Copy entire file → Paste → Run → Success.
   - Assigns INV-001, INV-002, … to rows missing supplier_invoice_no (per tenant, by date).
   - See docs/PURCHASE_REFERENCE_NUMBERS.md.

18. Migration 0017 (purchase VAT — default_vat_pct, rate_excl, bill-style totals)
   - Open: app/supabase/migrations/0017_purchase_vat.sql

19. Migration 0018 (decimal default markup % — e.g. 4.5 in Settings)
   - Open: app/supabase/migrations/0018_default_markup_decimal.sql
   - Copy entire file → Paste → Run → Success.
   - Adds Settings → Default VAT %; purchase lines store excl + VAT split.
   - UI details: docs/PURCHASE_REFERENCE_NUMBERS.md

20. Migration 0019 (tenant product categories — Settings list for product form)
   - Open: app/supabase/migrations/0019_tenant_product_categories.sql
   - Copy entire file → Paste → Run → Success.

21. Migration 0020 (stock_adjustments table + v_stock adjusted qty + RPC)
   - Open: app/supabase/migrations/0020_stock_adjustments.sql
   - Copy entire file → Paste → Run → Success.

22. Migration 0021 (Settings toggle allow_stock_adjustment)
   - Open: app/supabase/migrations/0021_tenant_allow_stock_adjustment.sql
   - Copy entire file → Paste → Run → Success.

23. Migration 0022 (Settings list_page_size — rows per page on browse lists)
   - Open: app/supabase/migrations/0022_tenant_list_page_size.sql
   - Copy entire file → Paste → Run → Success.

24. Migration 0023 (Settings show_district_province_on_bill — optional district line on printed bills)
   - Open: app/supabase/migrations/0023_tenant_show_district_on_bill.sql
   - Copy entire file → Paste → Run → Success.
   - Default off: bills show only address lines 1–2 from Settings.

   Optional 0004: auto-active tenants on signup (dev only)
   - app/supabase/migrations/0004_dev_signup_active_tenant.sql

12. Verify (run this small query in SQL Editor):

   select table_name
   from information_schema.tables
   where table_schema = 'public'
     and table_name in ('tenant_users', 'tenants', 'tenant_settings', 'sales_bills')
   order by 1;

   You should see 4 rows. If tenant_users is missing, 0001 did not apply.

   Also verify the RPC exists:

   select proname from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and proname = 'signup_tenant';

   Expect 1 row.

13. Table Editor (left sidebar) → schema "public" → you should see many tables (including supplier_payments after 0006).

--------------------------------------------------------------------------------
METHOD B — Supabase CLI (optional; tracks migrations in Dashboard)
--------------------------------------------------------------------------------

Prerequisites: Terminal, Node/npm, database password from
  Dashboard → Project Settings → Database → Database password

  cd /path/to/bikrikhata/app

  # One-time: install CLI and log in
  npx supabase login

  # One-time: create config if missing
  npx supabase init

  # Link to remote project (use ref from Dashboard URL)
  npx supabase link --project-ref luvjcpawlteawovjmeuw
  # Enter database password when prompted.

  # Apply all files in supabase/migrations/ (do NOT run "migration new")
  npx supabase db push

  # Verify same SQL as the verification step in Method A (table + RPC checks).

--------------------------------------------------------------------------------
AFTER MIGRATIONS — app testing
--------------------------------------------------------------------------------

1. app/.env.local must have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

2. cd app && npm run dev → open http://localhost:5173

3. Authentication → Email: "Confirm email" OFF (you did this).

4. /register → create workspace OR /login if user already exists.

5. If "pending approval" page: for dev only, in SQL Editor:
     update tenants set status = 'active'
     where id = (select tenant_id from tenant_users limit 1);

6. Full test checklist: docs/backend/testing-live-supabase.md

--------------------------------------------------------------------------------
TROUBLESHOOTING
--------------------------------------------------------------------------------

- PGRST202 signup_tenant not found → migrations not applied; repeat Method A.
- PGRST205 tenant_users not found → same; run 0001 first.
- User exists but no workspace → sign in, call register again OR run signup via
  app /register while logged in (needs session).
- SQL error on Run → read line number; common: ran 0002 before 0001, or partial
  failed run; paste error when asking for help.

Order: 0001 → 0002 → 0003 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011 (0004 optional dev-only).
