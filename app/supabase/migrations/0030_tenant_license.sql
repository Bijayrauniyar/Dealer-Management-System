-- Tenant trial / paid license (LIC-1). Trial starts on approve_tenant, not on signup.
-- Default trial length: 7 days (keep in sync with LAUNCH_TRIAL_DAYS in app/src/config/launchPricing.ts).

alter table tenants
  add column if not exists plan text
    check (plan is null or plan in ('trial', 'monthly', 'annual'));

alter table tenants
  add column if not exists trial_ends_at timestamptz;

alter table tenants
  add column if not exists subscription_ends_at timestamptz;

alter table tenants
  add column if not exists activated_at timestamptz;

comment on column tenants.plan is 'trial | monthly | annual; set when activated or extended';
comment on column tenants.trial_ends_at is 'Free trial end (starts on first activation)';
comment on column tenants.subscription_ends_at is 'Paid period end (monthly or annual)';
comment on column tenants.activated_at is 'First time workspace was activated';

-- True when status is active and within trial or paid period.
create or replace function tenant_license_valid(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from tenants t
    where t.id = p_tenant_id
      and t.status = 'active'
      and (
        (t.subscription_ends_at is not null and t.subscription_ends_at > now())
        or (t.trial_ends_at is not null and t.trial_ends_at > now())
      )
  );
$$;

-- Approve pending workspace: active + 7-day trial from activation moment.
create or replace function approve_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_activation boolean;
begin
  if not is_super_admin() then
    raise exception 'Only super admin can approve tenants';
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
      when v_first_activation then now() + interval '7 days'
      else trial_ends_at
    end
  where id = p_tenant_id;
end;
$$;

-- Super admin: set or extend paid plan (or restart trial).
create or replace function set_tenant_subscription(
  p_tenant_id uuid,
  p_plan text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only super admin can set subscription';
  end if;

  if p_plan not in ('trial', 'monthly', 'annual') then
    raise exception 'Invalid plan: use trial, monthly, or annual';
  end if;

  if not exists (select 1 from tenants where id = p_tenant_id) then
    raise exception 'Tenant not found';
  end if;

  if p_plan = 'trial' then
    update tenants
    set
      status = 'active',
      plan = 'trial',
      activated_at = coalesce(activated_at, now()),
      trial_ends_at = now() + interval '7 days',
      subscription_ends_at = null
    where id = p_tenant_id;
  elsif p_plan = 'monthly' then
    update tenants
    set
      status = 'active',
      plan = 'monthly',
      activated_at = coalesce(activated_at, now()),
      subscription_ends_at = now() + interval '1 month',
      trial_ends_at = null
    where id = p_tenant_id;
  else
    update tenants
    set
      status = 'active',
      plan = 'annual',
      activated_at = coalesce(activated_at, now()),
      subscription_ends_at = now() + interval '1 year',
      trial_ends_at = null
    where id = p_tenant_id;
  end if;
end;
$$;

grant execute on function tenant_license_valid(uuid) to authenticated;
grant execute on function set_tenant_subscription(uuid, text) to authenticated;
