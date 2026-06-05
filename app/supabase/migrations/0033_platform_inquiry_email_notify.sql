-- Contact form → email alert via Edge Function notify-platform-inquiry (pg_net).
-- After deploy + Resend secrets: set project URL once (setup script or SQL below).
-- Docs: docs/CONTACT_FORM_EMAIL_SETUP.md

create extension if not exists pg_net with schema extensions;

create table if not exists platform_system_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

comment on table platform_system_config is
  'Platform hooks. Key supabase_project_url = https://YOUR_REF.supabase.co for inquiry email trigger.';

create or replace function enqueue_platform_inquiry_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_url text;
  fn_url text;
  payload jsonb;
begin
  select value into base_url
  from platform_system_config
  where key = 'supabase_project_url'
  limit 1;

  if base_url is null or trim(base_url) = '' then
    return NEW;
  end if;

  fn_url := rtrim(trim(base_url), '/') || '/functions/v1/notify-platform-inquiry';
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'platform_inquiries',
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );

  return NEW;
exception
  when others then
    raise warning 'enqueue_platform_inquiry_email: %', sqlerrm;
    return NEW;
end;
$$;

drop trigger if exists platform_inquiry_email_enqueue on platform_inquiries;
create trigger platform_inquiry_email_enqueue
  after insert on platform_inquiries
  for each row
  execute function enqueue_platform_inquiry_email();
