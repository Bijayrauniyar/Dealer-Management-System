-- =============================================================================
-- Havmor DMS - Supabase schema v1
-- =============================================================================
-- Paste this ENTIRE file into Supabase SQL editor and click Run.
-- Safe to re-run: uses "create table if not exists" / "drop ... if exists".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Updated-at helper
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Tenants + tenant_users (the multi-tenant backbone)
-- -----------------------------------------------------------------------------
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name text,
  phone text,
  city text,
  currency text not null default 'NPR',
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tenants_updated on tenants;
create trigger trg_tenants_updated before update on tenants
for each row execute function set_updated_at();

create table if not exists tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('super_admin','owner','admin','salesman','viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_users_user on tenant_users(user_id);
create index if not exists idx_tenant_users_tenant on tenant_users(tenant_id);

-- -----------------------------------------------------------------------------
-- Helpers used by every RLS policy
-- -----------------------------------------------------------------------------
create or replace function current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tu.tenant_id
  from tenant_users tu
  where tu.user_id = auth.uid()
  order by (tu.role = 'owner') desc, tu.created_at asc
  limit 1;
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from tenant_users
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Master tables
-- -----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  name text not null,
  category text,
  unit text not null default 'PCS',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  opening_stock numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
for each row execute function set_updated_at();

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  area text,
  route text,
  credit_limit numeric(12,2) not null default 0,
  opening_balance numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_customers_updated on customers;
create trigger trg_customers_updated before update on customers
for each row execute function set_updated_at();

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  payable_opening numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_suppliers_updated on suppliers;
create trigger trg_suppliers_updated before update on suppliers
for each row execute function set_updated_at();

create table if not exists freezers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  serial_no text not null,
  model text,
  customer_id uuid references customers(id) on delete set null,
  deposit numeric(12,2) not null default 0,
  status text not null default 'deployed' check (status in ('deployed','in_stock','repair','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, serial_no)
);

drop trigger if exists trg_freezers_updated on freezers;
create trigger trg_freezers_updated before update on freezers
for each row execute function set_updated_at();

create table if not exists beat_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  route text not null,
  salesman text,
  customer_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Transaction tables
-- -----------------------------------------------------------------------------
create table if not exists sales_bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  bill_no text not null,
  bill_date date not null default current_date,
  customer_id uuid not null references customers(id),
  payment_mode text not null default 'Credit' check (payment_mode in ('Cash','Credit','UPI','Cheque','Bank')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, bill_no)
);

drop trigger if exists trg_sales_bills_updated on sales_bills;
create trigger trg_sales_bills_updated before update on sales_bills
for each row execute function set_updated_at();

create index if not exists idx_sales_bills_tenant_date on sales_bills(tenant_id, bill_date);
create index if not exists idx_sales_bills_customer on sales_bills(customer_id);

create table if not exists sales_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  bill_id uuid not null references sales_bills(id) on delete cascade,
  product_id uuid not null references products(id),
  qty numeric(12,2) not null,
  rate numeric(12,2) not null,
  total numeric(12,2) generated always as (qty * rate) stored
);

create index if not exists idx_sales_items_bill on sales_items(bill_id);
create index if not exists idx_sales_items_product on sales_items(product_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  payment_date date not null default current_date,
  customer_id uuid not null references customers(id),
  bill_id uuid references sales_bills(id) on delete set null,
  amount numeric(12,2) not null,
  mode text not null default 'Cash' check (mode in ('Cash','UPI','Cheque','Bank','Other')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_tenant_date on payments(tenant_id, payment_date);
create index if not exists idx_payments_customer on payments(customer_id);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  purchase_no text not null,
  purchase_date date not null default current_date,
  supplier_id uuid not null references suppliers(id),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, purchase_no)
);

drop trigger if exists trg_purchases_updated on purchases;
create trigger trg_purchases_updated before update on purchases
for each row execute function set_updated_at();

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  qty numeric(12,2) not null,
  rate numeric(12,2) not null,
  total numeric(12,2) generated always as (qty * rate) stored
);

create index if not exists idx_purchase_items_purchase on purchase_items(purchase_id);
create index if not exists idx_purchase_items_product on purchase_items(product_id);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null,
  amount numeric(12,2) not null,
  paid_by text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_tenant_date on expenses(tenant_id, expense_date);

create table if not exists damages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  damage_date date not null default current_date,
  product_id uuid not null references products(id),
  qty numeric(12,2) not null,
  reason text not null,
  cost numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_damages_tenant_date on damages(tenant_id, damage_date);
create index if not exists idx_damages_product on damages(product_id);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  return_date date not null default current_date,
  customer_id uuid not null references customers(id),
  product_id uuid not null references products(id),
  qty numeric(12,2) not null,
  reason text,
  credit_note_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_returns_tenant_date on returns(tenant_id, return_date);
create index if not exists idx_returns_product on returns(product_id);

-- -----------------------------------------------------------------------------
-- 4. Operational tables
-- -----------------------------------------------------------------------------
create table if not exists salesman_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  month date not null,
  salesman text not null,
  target_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, month, salesman)
);

create table if not exists scheme_tracker (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  scheme_name text not null,
  product_id uuid references products(id) on delete set null,
  buy_qty numeric(12,2) not null,
  free_qty numeric(12,2) not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  log_date date not null default current_date,
  vehicle text not null,
  driver text,
  opening_km numeric(12,2) not null default 0,
  closing_km numeric(12,2) not null default 0,
  fuel_litres numeric(12,2) not null default 0,
  fuel_cost numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists daily_cash (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  cash_date date not null default current_date,
  opening_balance numeric(12,2) not null default 0,
  closing_balance numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, cash_date)
);

-- -----------------------------------------------------------------------------
-- 5. Views - always tenant-aware via RLS on base tables
-- -----------------------------------------------------------------------------
create or replace view v_stock as
select
  p.tenant_id,
  p.id as product_id,
  p.code,
  p.name,
  p.unit,
  p.opening_stock,
  coalesce(pur.qty, 0) as purchased,
  coalesce(sal.qty, 0) as sold,
  coalesce(dam.qty, 0) as damaged,
  coalesce(ret.qty, 0) as returned,
  (p.opening_stock + coalesce(pur.qty,0) - coalesce(sal.qty,0) - coalesce(dam.qty,0) + coalesce(ret.qty,0)) as closing_stock
from products p
left join (
  select product_id, sum(qty) qty from purchase_items group by product_id
) pur on pur.product_id = p.id
left join (
  select product_id, sum(qty) qty from sales_items group by product_id
) sal on sal.product_id = p.id
left join (
  select product_id, sum(qty) qty from damages group by product_id
) dam on dam.product_id = p.id
left join (
  select product_id, sum(qty) qty from returns group by product_id
) ret on ret.product_id = p.id;

create or replace view v_customer_balance as
select
  c.tenant_id,
  c.id as customer_id,
  c.name,
  c.phone,
  c.opening_balance
    + coalesce(b.total, 0)
    - coalesce(p.paid, 0)
    - coalesce(r.credits, 0) as balance,
  coalesce(b.total, 0) as total_billed,
  coalesce(p.paid, 0) as total_paid,
  coalesce(r.credits, 0) as total_credits,
  p.last_payment_date
from customers c
left join (
  select customer_id, sum(total) total from sales_bills group by customer_id
) b on b.customer_id = c.id
left join (
  select customer_id, sum(amount) paid, max(payment_date) last_payment_date from payments group by customer_id
) p on p.customer_id = c.id
left join (
  select customer_id, sum(credit_note_amount) credits from returns group by customer_id
) r on r.customer_id = c.id;

create or replace view v_supplier_balance as
select
  s.tenant_id,
  s.id as supplier_id,
  s.name,
  s.payable_opening
    + coalesce(pu.total, 0)
    - coalesce(pu.paid, 0) as balance,
  coalesce(pu.total, 0) as total_purchased,
  coalesce(pu.paid, 0) as total_paid
from suppliers s
left join (
  select supplier_id, sum(total) total, sum(paid) paid from purchases group by supplier_id
) pu on pu.supplier_id = s.id;

create or replace view v_overdue_customers as
select
  vcb.*,
  (current_date - coalesce(vcb.last_payment_date, current_date - 999)) as days_since_payment
from v_customer_balance vcb
where vcb.balance > 0
  and (vcb.last_payment_date is null or vcb.last_payment_date < current_date - interval '30 days');

-- -----------------------------------------------------------------------------
-- 6. RPC: atomic sales bill create (bill + items + auto bill_no)
-- -----------------------------------------------------------------------------
create or replace function create_sales_bill(
  p_customer_id uuid,
  p_bill_date date,
  p_payment_mode text,
  p_discount numeric,
  p_items jsonb,                 -- [{"product_id":"...","qty":2,"rate":150}, ...]
  p_paid numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_bill_id uuid;
  v_bill_no text;
  v_subtotal numeric := 0;
  v_next_seq int;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  select coalesce(max(substring(bill_no from '[0-9]+$')::int), 0) + 1
    into v_next_seq
  from sales_bills
  where tenant_id = v_tenant;

  v_bill_no := 'INV-' || to_char(p_bill_date, 'YYYYMM') || '-' || lpad(v_next_seq::text, 4, '0');

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate')::numeric), 0)
    into v_subtotal
  from jsonb_array_elements(p_items) i;

  insert into sales_bills(
    tenant_id, bill_no, bill_date, customer_id,
    payment_mode, subtotal, discount, total, paid, notes
  )
  values (
    v_tenant, v_bill_no, p_bill_date, p_customer_id,
    p_payment_mode, v_subtotal, coalesce(p_discount,0),
    v_subtotal - coalesce(p_discount,0),
    coalesce(p_paid,0), p_notes
  )
  returning id into v_bill_id;

  insert into sales_items(tenant_id, bill_id, product_id, qty, rate)
  select v_tenant, v_bill_id, (i->>'product_id')::uuid, (i->>'qty')::numeric, (i->>'rate')::numeric
  from jsonb_array_elements(p_items) i;

  if coalesce(p_paid,0) > 0 then
    insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode)
    values (v_tenant, p_bill_date, p_customer_id, v_bill_id, p_paid,
            case when p_payment_mode in ('Cash','UPI','Cheque','Bank') then p_payment_mode else 'Cash' end);
  end if;

  return v_bill_id;
end;
$$;

grant execute on function create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: tenant signup (called right after auth signup from client)
-- -----------------------------------------------------------------------------
create or replace function signup_tenant(
  p_business_name text,
  p_owner_name text,
  p_phone text,
  p_city text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from tenant_users where user_id = v_user_id) then
    raise exception 'User already belongs to a tenant';
  end if;

  insert into tenants(business_name, owner_name, phone, city, status)
  values (p_business_name, p_owner_name, p_phone, p_city, 'pending')
  returning id into v_tenant_id;

  insert into tenant_users(tenant_id, user_id, role)
  values (v_tenant_id, v_user_id, 'owner');

  return v_tenant_id;
end;
$$;

grant execute on function signup_tenant(text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: super admin approve / reject
-- -----------------------------------------------------------------------------
create or replace function approve_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only super admin can approve tenants';
  end if;
  update tenants set status = 'active' where id = p_tenant_id;
end;
$$;

create or replace function reject_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only super admin can reject tenants';
  end if;
  update tenants set status = 'rejected' where id = p_tenant_id;
end;
$$;

grant execute on function approve_tenant(uuid) to authenticated;
grant execute on function reject_tenant(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Row Level Security - enable on every table
-- -----------------------------------------------------------------------------
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table suppliers enable row level security;
alter table freezers enable row level security;
alter table beat_plans enable row level security;
alter table sales_bills enable row level security;
alter table sales_items enable row level security;
alter table payments enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table expenses enable row level security;
alter table damages enable row level security;
alter table returns enable row level security;
alter table salesman_targets enable row level security;
alter table scheme_tracker enable row level security;
alter table vehicle_log enable row level security;
alter table daily_cash enable row level security;

-- Tenants: user can see their tenant; super admin sees all
drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants for select
using (id = current_tenant_id() or is_super_admin());

drop policy if exists tenants_update_super on tenants;
create policy tenants_update_super on tenants for update
using (is_super_admin()) with check (is_super_admin());

-- tenant_users: user sees their own rows, super admin sees all
drop policy if exists tenant_users_select on tenant_users;
create policy tenant_users_select on tenant_users for select
using (user_id = auth.uid() or is_super_admin() or tenant_id = current_tenant_id());

drop policy if exists tenant_users_insert on tenant_users;
create policy tenant_users_insert on tenant_users for insert
with check (user_id = auth.uid() or is_super_admin());

-- Generic tenant-scoped policy for all domain tables
do $$
declare t text;
begin
  foreach t in array array[
    'products','customers','suppliers','freezers','beat_plans',
    'sales_bills','sales_items','payments','purchases','purchase_items',
    'expenses','damages','returns','salesman_targets','scheme_tracker',
    'vehicle_log','daily_cash'
  ]
  loop
    execute format('drop policy if exists %I_all on %I', t, t);
    execute format($p$
      create policy %I_all on %I
      for all
      using (tenant_id = current_tenant_id() or is_super_admin())
      with check (tenant_id = current_tenant_id() or is_super_admin())
    $p$, t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 10. Grants for authenticated role (Supabase standard)
-- -----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Views: grant select
grant select on v_stock, v_customer_balance, v_supplier_balance, v_overdue_customers to authenticated;

-- -----------------------------------------------------------------------------
-- 11. One-time: promote yourself to super_admin AFTER your first signup
-- -----------------------------------------------------------------------------
-- Run this manually after you sign up the first user (use your email):
--
-- update tenant_users
--    set role = 'super_admin'
--  where user_id = (select id from auth.users where email = 'you@example.com');
--
-- =============================================================================
-- End of schema v1
-- =============================================================================
