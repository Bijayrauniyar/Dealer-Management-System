-- Allow license RPCs from Supabase SQL Editor (postgres, no auth.uid()).
-- App callers still require super_admin via is_super_admin().

create or replace function can_manage_tenant_license()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_super_admin()
    or (
      auth.uid() is null
      and current_user in ('postgres', 'supabase_admin')
    );
$$;

create or replace function approve_tenant(
  p_tenant_id uuid,
  p_trial_days integer default 7
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_activation boolean;
begin
  if not can_manage_tenant_license() then
    raise exception 'Only super admin can approve tenants';
  end if;

  if p_trial_days is null or p_trial_days < 1 or p_trial_days > 3650 then
    raise exception 'p_trial_days must be between 1 and 3650';
  end if;

  select activated_at is null into v_first_activation
  from tenants
  where id = p_tenant_id;

  if not found then
    raise exception 'Tenant not found';
  end if;

  update tenants
  set
    status = 'active',
    activated_at = coalesce(activated_at, now()),
    plan = case when v_first_activation then 'trial' else plan end,
    trial_ends_at = case
      when v_first_activation then now() + (p_trial_days || ' days')::interval
      else trial_ends_at
    end,
    subscription_ends_at = case when v_first_activation then null else subscription_ends_at end
  where id = p_tenant_id;
end;
$$;

create or replace function set_tenant_subscription(
  p_tenant_id uuid,
  p_plan text,
  p_days integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval interval;
begin
  if not can_manage_tenant_license() then
    raise exception 'Only super admin can set subscription';
  end if;

  if p_plan not in ('trial', 'monthly', 'annual') then
    raise exception 'Invalid plan: use trial, monthly, or annual';
  end if;

  if not exists (select 1 from tenants where id = p_tenant_id) then
    raise exception 'Tenant not found';
  end if;

  if p_days is not null then
    if p_days < 1 or p_days > 3650 then
      raise exception 'p_days must be between 1 and 3650';
    end if;
    v_interval := (p_days || ' days')::interval;
  elsif p_plan = 'trial' then
    v_interval := interval '7 days';
  elsif p_plan = 'monthly' then
    v_interval := interval '1 month';
  else
    v_interval := interval '1 year';
  end if;

  if p_plan = 'trial' then
    update tenants
    set
      status = 'active',
      plan = 'trial',
      activated_at = coalesce(activated_at, now()),
      trial_ends_at = now() + v_interval,
      subscription_ends_at = null
    where id = p_tenant_id;
  elsif p_plan = 'monthly' then
    update tenants
    set
      status = 'active',
      plan = 'monthly',
      activated_at = coalesce(activated_at, now()),
      subscription_ends_at = now() + v_interval,
      trial_ends_at = null
    where id = p_tenant_id;
  else
    update tenants
    set
      status = 'active',
      plan = 'annual',
      activated_at = coalesce(activated_at, now()),
      subscription_ends_at = now() + v_interval,
      trial_ends_at = null
    where id = p_tenant_id;
  end if;
end;
$$;

create or replace function extend_tenant_license(
  p_tenant_id uuid,
  p_extra_days integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t tenants%rowtype;
  v_base timestamptz;
begin
  if not can_manage_tenant_license() then
    raise exception 'Only super admin can extend license';
  end if;

  if p_extra_days is null or p_extra_days < 1 or p_extra_days > 3650 then
    raise exception 'p_extra_days must be between 1 and 3650';
  end if;

  select * into v_t from tenants where id = p_tenant_id;
  if not found then
    raise exception 'Tenant not found';
  end if;

  if v_t.plan = 'trial' or (v_t.trial_ends_at is not null and (v_t.subscription_ends_at is null or v_t.trial_ends_at >= v_t.subscription_ends_at)) then
    v_base := greatest(now(), coalesce(v_t.trial_ends_at, now()));
    update tenants
    set
      status = 'active',
      plan = 'trial',
      activated_at = coalesce(activated_at, now()),
      trial_ends_at = v_base + (p_extra_days || ' days')::interval
    where id = p_tenant_id;
  else
    v_base := greatest(now(), coalesce(v_t.subscription_ends_at, now()));
    update tenants
    set
      status = 'active',
      activated_at = coalesce(activated_at, now()),
      subscription_ends_at = v_base + (p_extra_days || ' days')::interval
    where id = p_tenant_id;
  end if;
end;
$$;

create or replace function reject_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_tenant_license() then
    raise exception 'Only super admin can reject tenants';
  end if;
  update tenants set status = 'rejected' where id = p_tenant_id;
end;
$$;

grant execute on function can_manage_tenant_license() to authenticated;
