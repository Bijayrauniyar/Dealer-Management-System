# Demo seed, tenant reset, and credentials

**Navigate:** [Phase 1 tests & use cases](./phase1-use-cases-and-tests.md) · [Testing live Supabase](./testing-live-supabase.md) · [Project README](../../README.md)

## When to use

| Need | Approach |
|------|----------|
| Repeatable **demo narrative** (named products, a few bills) | `npm run seed:demo` or `npm run seed:demo:reset` |
| **Wipe** all transactional + master data for one tenant (keep tenant login + `tenant_settings`) | `npm run seed:purge` or **`npm run tenant:reset-data`** (same purge; clearer name) |
| **Regression test** for seed/purge | `npm run e2e:seed:selftest` |
| Throwaway **API/UI** data | Run `e2e:matrix` / `e2e:ui` (leaves rows in Supabase) |

## Prerequisites

- `app/.env.local` — `VITE_SUPABASE_URL`, anon/publishable key, and for purge/reset **`SUPABASE_SERVICE_ROLE_KEY`** (never commit, never expose to the browser).
- `app/.e2e-credentials.local` or `E2E_EMAIL` / `E2E_PASSWORD` — a user who belongs to the tenant you want to seed.
- Tenant **`tenants.status = 'active'`** so `/app/*` and RPCs work.

## Commands (run from `app/`)

| Command | What it does |
|---------|----------------|
| `npm run seed:demo` | Inserts curated demo masters + bills (RPCs) for the **logged-in** E2E tenant. |
| `npm run seed:demo:reset` | **Purge** that tenant’s domain data (service role), then **seed**. |
| `npm run seed:purge` | **Destructive:** deletes products, bills, payments, purchases, etc. for the tenant. Does **not** delete `tenants`, `tenant_users`, or `tenant_settings`. |
| **`npm run tenant:reset-data`** | Same purge; prints scope. **Target one tenant:** `npm run tenant:reset-data -- --tenant-id=<uuid>` (or `TENANT_ID=` / E2E login). **Never** deletes other tenants—SQL is always `WHERE tenant_id = …`. |
| `npm run e2e:seed:selftest` | Purge → seed → assert → purge (needs service role + E2E user). |

CLI equivalents:

```bash
node scripts/tenant-seed.mjs seed [--reset] [--tenant-id=<uuid>]
node scripts/tenant-seed.mjs purge --yes [--tenant-id=<uuid>]
node scripts/reset-tenant-data.mjs --yes [--tenant-id=<uuid>]
node scripts/tenant-seed.mjs --help
```

**Target a specific tenant** (recommended — same single-tenant scope; never wipes other orgs):

```bash
npm run tenant:reset-data -- --yes --tenant-id=<uuid>
# or
TENANT_ID=<uuid> npm run tenant:reset-data
```

### Supabase SQL Editor (no Node; fine after deployment)

Same purge as `tenant-purge.mjs` for **one** `tenant_id`:

1. **SQL** → New query in the Supabase dashboard.
2. Open **`app/supabase/sql/purge_tenant_operational_data.sql`** in the repo, copy it.
3. Replace `v_tenant` with your real UUID from `select id, business_name from public.tenants;`.
4. Run. Other tenants are **not** affected; `tenants`, `tenant_users`, `tenant_settings` stay.

## `TENANT_ID` and purge without logging in

For `purge --yes` only, you may set **`TENANT_ID`** (or `--tenant-id=`) so the script does not need to sign in. **Seed always requires JWT** (use `.e2e-credentials.local`).

## What gets purged

Order is defined in `app/scripts/lib/tenant-purge.mjs` (FK-safe). Preserved: **`tenants`**, **`tenant_users`**, **`tenant_settings`**.

## Implementation files

| File | Role |
|------|------|
| `app/scripts/lib/demo-seed.mjs` | `runDemoSeed()` — data + RPC calls |
| `app/scripts/lib/tenant-purge.mjs` | `purgeTenantTransactionalData()` |
| `app/scripts/tenant-seed.mjs` | CLI |
| `app/scripts/reset-tenant-data.mjs` | Same purge as `seed:purge`; prints what is kept vs deleted |
| `app/supabase/sql/purge_tenant_operational_data.sql` | **Dashboard SQL Editor** — same deletes for one `tenant_id` |
| `app/scripts/e2e-tenant-seed-selftest.mjs` | Automated self-test |

## After `seed:demo`

- Invoice prefix is set to **`DEMO`** and footer text is updated (see `demo-seed.mjs`).
- To restore previous branding, edit **Settings** in the app or SQL on `tenant_settings`.

## Migrations

Apply through **`0007`** (and earlier) in Supabase before relying on bill edit and matrix tests. See `app/supabase/migrations/` and `phase1-use-cases-and-tests.md`.
