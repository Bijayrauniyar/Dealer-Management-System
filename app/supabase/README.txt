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

   Optional 0004: auto-active tenants on signup (dev only)
   - app/supabase/migrations/0004_dev_signup_active_tenant.sql

7. Verify (run this small query in SQL Editor):

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

7. Table Editor (left sidebar) → schema "public" → you should see many tables.

--------------------------------------------------------------------------------
METHOD B — Supabase CLI (optional; tracks migrations in Dashboard)
--------------------------------------------------------------------------------

Prerequisites: Terminal, Node/npm, database password from
  Dashboard → Project Settings → Database → Database password

  cd /path/to/havmor/app

  # One-time: install CLI and log in
  npx supabase login

  # One-time: create config if missing
  npx supabase init

  # Link to remote project (use ref from Dashboard URL)
  npx supabase link --project-ref luvjcpawlteawovjmeuw
  # Enter database password when prompted.

  # Apply all files in supabase/migrations/ (do NOT run "migration new")
  npx supabase db push

  # Verify same SQL as step 6 in Method A

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

Order: 0001 → 0002 → 0003 → 0005 (0004 optional dev-only).
