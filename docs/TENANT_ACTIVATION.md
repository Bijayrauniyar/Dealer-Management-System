# Tenant activation & licenses

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) · [Migrations runbook](../app/supabase/README.txt) · [Live testing](backend/testing-live-supabase.md)

Open **Supabase → SQL Editor → New query**. Copy **one block at a time**, replace placeholders, click **Run**.

**Placeholders**

| Placeholder | Replace with |
|-------------|----------------|
| `TENANT_ID` | Row `id` from `tenants` (UUID) |
| `YOUR_EMAIL` | Your BikriKhata login email (for super_admin) |

**Migrations (run once on the project):** `0030` → `0031` → **`0032_license_ops_sql_editor.sql`** (so `approve_tenant` works in Dashboard SQL Editor).  
**Auth:** Confirm email **OFF** in Supabase.

### Never break dealer data (developers & AI)

**Goal:** Each shop sees **only its own** customers, products, stock, and bills. Existing sale/purchase/payment flows must keep working.

| Do | Do not |
|----|--------|
| Change `tenants` status/plan/dates with SQL below | Delete or merge customer/product rows in license SQL |
| UI/pricing/support copy in `app/src/config/` | Remove `.eq("tenant_id", …)` from `domainLive.ts` reads |
| Deploy app that uses domain bundle **`["domain", "v2"]`** | Run `seed:demo` / `e2e:*` / `tenant:reset-data` on a **live pilot** tenant |

`approve_tenant` / `set_tenant_subscription` **only update the `tenants` row** — they never touch stock or masters. If counts look wrong, see [Missing customers / stock after activation?](#missing-customers--stock-after-activation) — do not “fix” by changing data queries without tenant scope.

**Code guardrail:** `.cursor/rules/tenant-data-integrity.mdc` (always on for agents).

### SQL Editor vs super_admin

In **Supabase SQL Editor**, queries run as **`postgres`** — there is **no** `auth.uid()`, so `approve_tenant` fails with *Only super admin* even after step 0. **Run migration `0032`** (or use the manual `UPDATE` in section 2b).

Step 0 (`super_admin`) is for calling these RPCs **from the app** while logged in as you, not for Dashboard SQL.

---

## Flow (pilot)

1. Dealer signs up at **`/register`** → `status = pending` (no trial dates).
2. **`/pending-approval`** until you activate.
3. You run **`approve_tenant`** → `active` + trial for **N days** (default **7**). Trial starts **on activate**, not on signup.
4. After dates pass → **`/license-expired`** until you extend.

### Trial vs paid — which columns change

| Goal | `plan` | `trial_ends_at` | `subscription_ends_at` |
|------|--------|-----------------|------------------------|
| **Free trial** (7, 14, 365 days, etc.) | `trial` | **set** (end date) | **NULL** |
| **Paid monthly** | `monthly` | NULL | **set** |
| **Paid annual** | `annual` | NULL | **set** |

- `select approve_tenant('UUID', 365)` → **1-year free trial** (`plan = trial`, `trial_ends_at` only). Not annual.
- `select set_tenant_subscription('UUID', 'annual', 365)` → **paid 365 days** (`plan = annual`, `subscription_ends_at` only).

---

## Copy-paste SQL

### 0 — Optional: super_admin (app RPC only)

Only needed if you call license RPCs **from the BikriKhata app** as this user. **Not required for SQL Editor** after `0032`.

```sql
update tenant_users
   set role = 'super_admin'
 where user_id = (select id from auth.users where email = 'YOUR_EMAIL');
```

---

### 1 — List pending signups (find `TENANT_ID`)

```sql
select
  t.id as tenant_id,
  t.business_name,
  t.status,
  t.plan,
  t.trial_ends_at,
  t.subscription_ends_at,
  u.email
from tenants t
join tenant_users tu on tu.tenant_id = t.id
join auth.users u on u.id = tu.user_id
where t.status = 'pending'
order by t.created_at desc;
```

Copy `tenant_id` from the row you want to activate.

---

### 2 — Activate free trial (starts now)

Uses **`approve_tenant`** → always `plan = trial`, date in **`trial_ends_at`**, `subscription_ends_at` stays **NULL**.

**7-day trial (default):**

```sql
select approve_tenant('TENANT_ID');
```

**14-day trial:**

```sql
select approve_tenant('TENANT_ID', 14);
```

**365-day trial** (still `plan = trial`, not annual):

```sql
select approve_tenant('TENANT_ID', 365);
```

> First activation only sets trial on first `approve_tenant`. Dealer: refresh app or **I've been activated — continue**.

---

### 2b — Activate without RPC (if `approve_tenant` still fails)

Works in SQL Editor even without `0032`:

```sql
update tenants
set
  status = 'active',
  plan = 'trial',
  activated_at = coalesce(activated_at, now()),
  trial_ends_at = now() + interval '7 days',
  subscription_ends_at = null
where id = 'TENANT_ID';
```

---

### 3 — Check a shop after activate

```sql
select
  id,
  business_name,
  status,
  plan,
  activated_at,
  trial_ends_at,
  subscription_ends_at
from tenants
where id = 'TENANT_ID';
```

**After free trial:** `plan = trial`, `trial_ends_at` set, `subscription_ends_at` empty.

**After paid annual:** `plan = annual`, `subscription_ends_at` set, `trial_ends_at` empty.

---

### 4 — Paid subscription or change plan (`set_tenant_subscription`)

Uses **`set_tenant_subscription`** — paid plans fill **`subscription_ends_at`** and clear `trial_ends_at`.

**Paid annual — 365 days** (`plan = annual`, not trial):

```sql
select set_tenant_subscription('TENANT_ID', 'annual', 365);
```

**Paid annual — calendar 1 year:**

```sql
select set_tenant_subscription('TENANT_ID', 'annual');
```

**Paid monthly — 30 days:**

```sql
select set_tenant_subscription('TENANT_ID', 'monthly', 30);
```

**Paid monthly — calendar 1 month:**

```sql
select set_tenant_subscription('TENANT_ID', 'monthly');
```

**Free trial again — 365 days** (`plan = trial`, `trial_ends_at` only):

```sql
select set_tenant_subscription('TENANT_ID', 'trial', 365);
```

**Free trial — 7 days (default):**

```sql
select set_tenant_subscription('TENANT_ID', 'trial');
```

**Free trial — 21 days:**

```sql
select set_tenant_subscription('TENANT_ID', 'trial', 21);
```

---

### 4b — Fix row: was trial + 365 days, want paid annual

If you already ran `trial` + 365 and want **`annual`** + `subscription_ends_at`:

```sql
select set_tenant_subscription('TENANT_ID', 'annual', 365);
```

Or keep the same end date already in `trial_ends_at`:

```sql
update tenants
set
  plan = 'annual',
  subscription_ends_at = trial_ends_at,
  trial_ends_at = null
where id = 'TENANT_ID';
```

---

### 5 — Add extra days (extend current end date)

Adds days after the current `trial_ends_at` or `subscription_ends_at` (whichever applies):

```sql
select extend_tenant_license('TENANT_ID', 7);
```

**Add 30 more days:**

```sql
select extend_tenant_license('TENANT_ID', 30);
```

---

### 6 — List all shops + license status

```sql
select
  id as tenant_id,
  business_name,
  status,
  plan,
  trial_ends_at,
  subscription_ends_at,
  activated_at
from tenants
order by created_at desc;
```

---

### 7 — Reject or suspend (optional)

Reject signup:

```sql
select reject_tenant('TENANT_ID');
```

Suspend (manual — no RPC):

```sql
update tenants set status = 'suspended' where id = 'TENANT_ID';
```

Re-activate after suspend (7-day trial if never activated before; else use step 4):

```sql
select approve_tenant('TENANT_ID');
```

---

## Manual Table Editor (if you prefer UI)

**Activate 7-day trial**

| Column | Value |
|--------|--------|
| `status` | `active` |
| `plan` | `trial` |
| `activated_at` | now |
| `trial_ends_at` | now + 7 days |
| `subscription_ends_at` | *(empty)* |

**Paid annual 365 days (manual)**

| Column | Value |
|--------|--------|
| `status` | `active` |
| `plan` | `annual` |
| `activated_at` | now |
| `trial_ends_at` | *(empty)* |
| `subscription_ends_at` | now + 365 days |

**Free trial 365 days (manual)** — not annual

| Column | Value |
|--------|--------|
| `status` | `active` |
| `plan` | `trial` |
| `activated_at` | now |
| `trial_ends_at` | now + 365 days |
| `subscription_ends_at` | *(empty)* |

---

## Plan vs days (quick reference)

| You want | SQL | `plan` after | Date column |
|----------|-----|--------------|-------------|
| Activate 7-day **free trial** | `select approve_tenant('TENANT_ID');` | `trial` | `trial_ends_at` |
| Activate N-day **free trial** | `select approve_tenant('TENANT_ID', N);` | `trial` | `trial_ends_at` |
| **Free trial** N days (change plan) | `select set_tenant_subscription('TENANT_ID', 'trial', N);` | `trial` | `trial_ends_at` |
| **Paid annual** N days | `select set_tenant_subscription('TENANT_ID', 'annual', N);` | `annual` | `subscription_ends_at` |
| **Paid monthly** N days | `select set_tenant_subscription('TENANT_ID', 'monthly', N);` | `monthly` | `subscription_ends_at` |
| Add more days on current end | `select extend_tenant_license('TENANT_ID', N);` | (unchanged) | extends active column |

The app allows access if `status = active` and either end date is in the future.

---

## Missing customers / stock after activation?

**`approve_tenant` and `set_tenant_subscription` only update the `tenants` row** (status, plan, dates). They do **not** delete products, customers, bills, or stock.

If the app shows empty lists, check in **SQL Editor** (replace `TENANT_ID`):

```sql
-- Which workspace this login uses
select tu.tenant_id, tu.role, t.business_name, t.status, t.plan
from tenant_users tu
join tenants t on t.id = tu.tenant_id
where tu.user_id = (select id from auth.users where email = 'YOUR_EMAIL');

-- Data still in DB for that tenant?
select
  (select count(*) from customers where tenant_id = 'TENANT_ID' and is_active) as customers,
  (select count(*) from products where tenant_id = 'TENANT_ID' and is_active) as products;
```

| Counts | Likely cause |
|--------|----------------|
| **0 / 0** | Data was never on this tenant, or **`tenant:reset-data` / `seed:purge`** was run (deletes customers & products for that tenant only). |
| **> 0** but app empty | **Deploy latest app build.** Common causes: missing migration **0026**, wrong Netlify `VITE_SUPABASE_URL`, or login `tenant_id` ≠ SQL `TENANT_ID`. |
| SQL counts match tenant but app shows **more** rows (e.g. 136 SKUs vs 32) | **`super_admin`** — RLS returns all tenants; app must filter by workspace (fixed in domain bundle v2). Deploy, hard-refresh, sign in again. |
| Two `tenant_users` rows for one email | App uses **owner** tenant first (same as RLS). |

Re-registering with a **new email** creates a **new** empty tenant; old data stays on the old tenant UUID.

---

## App shows demo / test names, not what I entered?

The app has **no offline dummy mode** — every row is from **your Supabase project**. Names like **Demo …**, **Matrix …**, **E2E …**, **Ramdev General Store**, **Shree Bajrang Traders**, **Himalayan FMCG** usually come from **`npm run seed:demo`**, **e2e** scripts, or **marketing screenshot** scripts run against that tenant — not from subscription SQL.

Your **login email** decides which `tenant_id` the app loads. It must be the same tenant where you (or the dealer) added real products and customers.

```sql
-- 1) Tenant for this login
select tu.tenant_id, t.business_name, tu.role
from tenant_users tu
join tenants t on t.id = tu.tenant_id
where tu.user_id = (select id from auth.users where email = 'YOUR_EMAIL');

-- 2) Sample names on THAT tenant (replace TENANT_ID from step 1)
select name from customers where tenant_id = 'TENANT_ID' and is_active order by name limit 20;
select name, code from products where tenant_id = 'TENANT_ID' and is_active order by name limit 20;
```

| What you see | What it usually means |
|--------------|---------------------|
| Names match step 2 | That tenant’s data — if mostly test names, the workspace was seeded for QA/marketing. |
| Step 2 is mostly test names, your real names on **another** `tenant_id` | Signed in with a **different email** or counted rows for the wrong UUID in SQL. Sign in as the owner who created the shop, or move data (support). |
| Real names in SQL but not in app | Deploy latest app; hard-refresh; confirm Netlify `VITE_SUPABASE_URL` is the same project as SQL Editor. |

**Clean slate for one tenant (destructive):** `npm run tenant:reset-data -- --yes --tenant-id=TENANT_ID` (service role in `app/.env.local`) — deletes customers, products, bills, etc.; keeps login and Settings. Then re-enter real masters in the app.

---

## App routes

| Route | When |
|-------|------|
| `/pending-approval` | `status` ≠ `active` — Call, WhatsApp, email, contact form |
| `/license-expired` | `active` but trial/subscription ended — **Message us** → `/contact?intent=renew`; **Website** → `/` (full marketing site; app stays blocked) |
| `/contact` | Contact form while signed in (renew / trial); not blocked by home redirect |
| `/app/home` | `active` and license valid — trial banner always; paid plan banner when ≤30 days left; bell **Notifications** + renewal popup when ≤30 days |
| `/app/settings` | **Subscription** card (plan, valid until, days remaining) on all tabs when license active |

Register on/off: `PUBLIC_SIGNUP_ENABLED` in `app/src/config/publicSignup.ts`.
