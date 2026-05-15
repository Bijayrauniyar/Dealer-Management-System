-- Optional (dev only): new workspaces are active immediately (skip pending-approval screen).
-- Run in SQL Editor after 0001–0003 if you want self-service signup without manual approval.

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
  values (p_business_name, p_owner_name, p_phone, p_city, 'active')
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
  )
  on conflict (tenant_id) do nothing;

  return v_tenant_id;
end;
$$;
