# Plan: test the app against a real Supabase project

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Env & MCP](./mcp-and-env.md) · [Migrations](../../app/supabase/README.txt) · [Automated E2E](./phase1-use-cases-and-tests.md) · [Manual E2E](./phase1-manual-e2e-checklist.md)

Use this when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `app/.env.local` (see [`mcp-and-env.md`](./mcp-and-env.md)).

---

## 1. Preconditions

| Step | Action |
|------|--------|
| 1.1 | In Supabase **SQL Editor**, run migrations **in order**: `0001` → `0002` → `0003` → `0005` → `0006` → `0007` → `0008` → `0009` → `0010` (see [`app/supabase/README.txt`](../../app/supabase/README.txt)). |
| 1.2 | **Authentication → URL configuration**: set **Site URL** to your app (e.g. `http://localhost:5173`). |
| 1.3 | **Authentication → Providers → Email**: for local dev, turn **Confirm email** **off** until you add a confirmation flow. Otherwise `signUp` often returns **no session** and `/register` cannot call `signup_tenant` immediately. |
| 1.4 | From `app/`, run `npm run dev` and open the printed local URL. Ensure `app/.env.local` has valid `VITE_SUPABASE_*` (otherwise the app shows **MissingSupabaseEnv**). |

---

## 2. Accounts: where “username” and “password” live

| What | Where it lives | Notes |
|------|----------------|--------|
| **Login identifier** | Supabase **Auth** | Users sign in with **email** + **password** (email is the “username” for this app). |
| **Password** | Supabase **`auth.users`** (managed by Auth) | Stored **hashed**. You **cannot** read the plain password in the Dashboard or SQL. To reset: **Authentication → Users → user → Send password recovery** or set a new password from the Dashboard. |
| **Who can log in** | **Authentication → Users** in the Supabase Dashboard | List of emails; you can add a user here with **Auto Confirm User** for testing. |
| **Tenant link** | **`public.tenant_users`** | Maps `user_id` → `tenant_id` after `signup_tenant` (or your manual setup). |
| **API keys (not user passwords)** | `app/.env.local` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. Never commit this file. |

If you “created a user” in the Dashboard: use that **email** and the **password you set** on `/login`. If you only registered via the app: use that email/password once the account is confirmed (or confirmation is disabled).

---

## 3. Where to see data in Supabase

| Goal | Where in Dashboard |
|------|---------------------|
| Browse rows | **Table Editor** → pick schema **`public`** → table (`sales_bills`, `sales_items`, `payments`, `products`, `customers`, `purchases`, `expenses`, `damages`, `tenant_settings`, …). |
| Auth identities | **Authentication → Users** (not the same as Table Editor `auth` exposure; use this UI for emails, IDs, confirm status). |
| Run ad‑hoc SQL | **SQL Editor** (e.g. `select * from sales_bills order by bill_date desc limit 20;`). |
| API / errors | **Logs** (Edge/API) if you add server logic later; client errors often show in the **browser DevTools → Network** tab. |

Filter by tenant when inspecting: your RLS usually scopes by tenant; use a service role query in SQL only if you understand the security implications, or inspect while logged in as that tenant’s user via the app.

---

## 4. Suggested end-to-end checklist (Phase 1)

Do these **in order** the first time; after that you can run subsets.

1. **Register or log in**  
   - New dealer: `/register` → should land on `/app/home` with a tenant (if email confirm is off and RPC succeeds).  
   - Existing: `/login`.

2. **Settings** (`/app/settings`)  
   - Change invoice prefix / footer → **Save** → refresh page → confirm persistence (row in **`tenant_settings`**).

3. **Products** (`/app/products`, new/edit)  
   - Create or edit a product → confirm **`products`** row (and `v_stock` if you use it).

4. **New sale** (`/app/sales/new`)  
   - Create bill with lines → **`sales_bills`**, **`sales_items`**, stock movement if applicable.

5. **Payment** (`/app/payments/new`)  
   - Allocate to an open bill → **`payments`**, updated **`sales_bills.paid`**.

6. **Return** (`/app/returns/new`)  
   - Apply return against a bill → **`returns`** / return lines (per your migration names), stock/bill balances.

7. **Purchase** (`/app/purchases/new`)  
   - **`purchases`**, **`purchase_items`**, supplier balance.

8. **Supplier payment** (`/app/supplier-payments/new`)  
   - **`purchases`** paid fields / supplier side per RPC.

9. **Expense** (`/app/expenses/new`)  
   - **`expenses`** (or table your `record_expense` RPC writes to).

10. **Damage** (`/app/damages/new`)  
    - **`damages`** (or equivalent).

11. **Re-read UI**  
    - Home / customers / stock / bills: data should match Table Editor for that tenant.

---

## 5. If something fails

| Symptom | Check |
|---------|--------|
| `signup_tenant` / RLS errors | Migration order; user has **`tenant_users`** row; tenant **active**. |
| `permission denied` / empty selects | **RLS** policies; JWT present (logged in). |
| RPC missing | **`0003_phase1_operations.sql`** applied; **Database → Functions** lists `create_sales_bill`, `apply_customer_payment`, etc.; **GRANT EXECUTE** for `authenticated`. |
| Wrong tenant / no data | You’re using the correct **email**; `tenant_users.tenant_id` matches rows you expect. |

---

## 6. Optional hygiene

- Re-enable **Confirm email** before production and add a proper post-confirm flow.
- Never commit `app/.env.local`; rotate keys if they leak.

---

**Next:** [Automated tests & use cases](./phase1-use-cases-and-tests.md) · [Manual E2E checklist](./phase1-manual-e2e-checklist.md) · [Backend checklist](./BACKEND-TODO.md) · [Docs hub](../README.md)
