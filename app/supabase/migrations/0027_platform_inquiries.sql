-- P0: public marketing contact / sales inquiries (landing form).
-- View rows: Supabase Dashboard → Table Editor → platform_inquiries.
-- Email notifications: later (not in this migration).

create table if not exists platform_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  business_type text not null,
  message text,
  source text not null default 'landing',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed'))
);

create index if not exists platform_inquiries_created_at_idx
  on platform_inquiries (created_at desc);

comment on table platform_inquiries is
  'Inbound leads from bikrikhata.com contact form. Platform team only — not tenant-scoped.';

alter table platform_inquiries enable row level security;

-- Public insert for landing form (see also 0028 if you applied 0027 before 0028 existed).
create policy if not exists platform_inquiries_public_insert
  on platform_inquiries
  for insert
  to anon, authenticated
  with check (true);

create or replace function submit_platform_inquiry(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_business text;
  v_type text;
  v_message text;
  v_source text;
begin
  v_name := nullif(trim(p_payload->>'full_name'), '');
  v_email := nullif(trim(lower(p_payload->>'email')), '');
  v_phone := nullif(trim(p_payload->>'phone'), '');
  v_business := nullif(trim(p_payload->>'business_name'), '');
  v_type := nullif(trim(p_payload->>'business_type'), '');
  v_message := nullif(trim(p_payload->>'message'), '');
  v_source := coalesce(nullif(trim(p_payload->>'source'), ''), 'landing');

  if v_name is null then
    raise exception 'full_name is required';
  end if;
  if v_email is null or v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'valid email is required';
  end if;
  if v_phone is null then
    raise exception 'phone is required';
  end if;
  if v_business is null then
    raise exception 'business_name is required';
  end if;
  if v_type is null then
    raise exception 'business_type is required';
  end if;

  insert into platform_inquiries (
    full_name,
    email,
    phone,
    business_name,
    business_type,
    message,
    source
  )
  values (
    v_name,
    v_email,
    v_phone,
    v_business,
    v_type,
    v_message,
    v_source
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function submit_platform_inquiry(jsonb) from public;
grant execute on function submit_platform_inquiry(jsonb) to anon, authenticated;
