-- Contact form: demo / pricing / support purpose + RPC payload support.

alter table platform_inquiries
  add column if not exists inquiry_purpose text;

comment on column platform_inquiries.inquiry_purpose is
  'Landing form: Book a demo, Pricing question, Support, General inquiry, etc.';

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
  v_purpose text;
begin
  v_name := nullif(trim(p_payload->>'full_name'), '');
  v_email := nullif(trim(lower(p_payload->>'email')), '');
  v_phone := nullif(trim(p_payload->>'phone'), '');
  v_business := nullif(trim(p_payload->>'business_name'), '');
  v_type := nullif(trim(p_payload->>'business_type'), '');
  v_message := nullif(trim(p_payload->>'message'), '');
  v_source := coalesce(nullif(trim(p_payload->>'source'), ''), 'landing');
  v_purpose := nullif(trim(p_payload->>'inquiry_purpose'), '');

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
    source,
    inquiry_purpose
  )
  values (
    v_name,
    v_email,
    v_phone,
    v_business,
    v_type,
    v_message,
    v_source,
    v_purpose
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function submit_platform_inquiry(jsonb) from public;
grant execute on function submit_platform_inquiry(jsonb) to anon, authenticated;
