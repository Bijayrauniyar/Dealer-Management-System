-- =============================================================================
-- Havmor DMS - Migration 0002
-- tenant_settings (1:1 tenants) + capital_entries + append-only audit
-- Safe to re-run: IF NOT EXISTS / DROP IF EXISTS where appropriate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. tenant_settings (see docs/backend/data-model.md)
-- -----------------------------------------------------------------------------
create table if not exists tenant_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  name text not null,
  legal_name text,
  region text,
  phone text,
  mobile text,
  email text,
  address_line1 text,
  address_line2 text,
  district text,
  province text,
  country text not null default 'Nepal',
  pan_number text,
  vat_registered boolean not null default false,
  vat_number text,
  invoice_prefix text not null default 'INV',
  bill_footer text,
  overdue_days integer not null default 7,
  due_soon_days integer not null default 3,
  default_markup_pct integer not null default 15,
  default_min_qty integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tenant_settings_updated on tenant_settings;
create trigger trg_tenant_settings_updated before update on tenant_settings
for each row execute function set_updated_at();

-- Backfill one row per existing tenant (idempotent)
insert into tenant_settings (
  tenant_id, name, legal_name, region, phone, mobile, email,
  address_line1, address_line2, district, province, country,
  pan_number, vat_registered, vat_number, invoice_prefix, bill_footer,
  overdue_days, due_soon_days, default_markup_pct, default_min_qty
)
select
  t.id,
  t.business_name,
  t.business_name,
  t.city,
  t.phone,
  t.phone,
  null,
  coalesce(nullif(trim(t.city), ''), ''),
  '',
  '',
  '',
  'Nepal',
  '',
  false,
  null,
  'INV',
  '',
  7,
  3,
  15,
  20
from tenants t
where not exists (select 1 from tenant_settings s where s.tenant_id = t.id);

-- -----------------------------------------------------------------------------
-- 2. Capital & fixed assets (Phase 2-C)
-- -----------------------------------------------------------------------------
create table if not exists capital_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  category text not null
    check (category in ('fixed_asset','inventory','deposit','owner_capital','loan')),
  entry_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  current_value numeric(14,2) not null default 0,
  notes text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_capital_entries_updated on capital_entries;
create trigger trg_capital_entries_updated before update on capital_entries
for each row execute function set_updated_at();

create index if not exists idx_capital_entries_tenant_date
  on capital_entries(tenant_id, entry_date desc);
create index if not exists idx_capital_entries_tenant_active
  on capital_entries(tenant_id) where deleted_at is null;

create table if not exists capital_entry_audit (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  capital_entry_id uuid not null,
  action text not null check (action in ('insert','update','delete')),
  changed_at timestamptz not null default now(),
  changed_by uuid,
  before_row jsonb,
  after_row jsonb
);

create index if not exists idx_capital_entry_audit_entry_time
  on capital_entry_audit(tenant_id, capital_entry_id, changed_at desc);

-- Append-only audit via SECURITY DEFINER trigger (bypasses RLS on audit insert)
create or replace function trg_fn_capital_entries_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into capital_entry_audit (
      tenant_id, capital_entry_id, action, changed_by, before_row, after_row
    ) values (
      new.tenant_id, new.id, 'insert', auth.uid(), null, to_jsonb(new)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    insert into capital_entry_audit (
      tenant_id, capital_entry_id, action, changed_by, before_row, after_row
    ) values (
      new.tenant_id, new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into capital_entry_audit (
      tenant_id, capital_entry_id, action, changed_by, before_row, after_row
    ) values (
      old.tenant_id, old.id, 'delete', auth.uid(), to_jsonb(old), null
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_capital_entries_audit on capital_entries;
create trigger trg_capital_entries_audit
after insert or update or delete on capital_entries
for each row execute function trg_fn_capital_entries_audit();

-- -----------------------------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------------------------
alter table tenant_settings enable row level security;
alter table capital_entries enable row level security;
alter table capital_entry_audit enable row level security;

drop policy if exists tenant_settings_all on tenant_settings;
create policy tenant_settings_all on tenant_settings
for all
using (tenant_id = current_tenant_id() or is_super_admin())
with check (tenant_id = current_tenant_id() or is_super_admin());

drop policy if exists capital_entries_all on capital_entries;
create policy capital_entries_all on capital_entries
for all
using (tenant_id = current_tenant_id() or is_super_admin())
with check (tenant_id = current_tenant_id() or is_super_admin());

drop policy if exists capital_entry_audit_select on capital_entry_audit;
create policy capital_entry_audit_select on capital_entry_audit
for select
using (tenant_id = current_tenant_id() or is_super_admin());

-- -----------------------------------------------------------------------------
-- 4. Grants (new tables after 0001 blanket grant)
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on tenant_settings to authenticated;
grant select, insert, update, delete on capital_entries to authenticated;
grant select on capital_entry_audit to authenticated;

-- -----------------------------------------------------------------------------
-- 5. signup_tenant: seed tenant_settings for every new tenant
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

  insert into tenant_settings (
    tenant_id, name, legal_name, region, phone, mobile,
    address_line1, invoice_prefix, overdue_days, due_soon_days,
    default_markup_pct, default_min_qty
  )
  values (
    v_tenant_id,
    p_business_name,
    p_business_name,
    p_city,
    p_phone,
    p_phone,
    coalesce(nullif(trim(p_city), ''), ''),
    'INV',
    7,
    3,
    15,
    20
  );

  return v_tenant_id;
end;
$$;

-- =============================================================================
-- End 0002
-- =============================================================================
