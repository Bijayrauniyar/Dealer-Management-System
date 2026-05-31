-- Phase 0 Tier C: reserved columns (not used in UI — platform support is app constants).
-- Shop→retail-customer contact remains tenant_settings phone/mobile/email (Business tab, bills).

alter table tenant_settings
  add column if not exists support_phone text,
  add column if not exists support_email text,
  add column if not exists support_whatsapp text;

comment on column tenant_settings.support_phone is
  'Reserved. BikriKhata→tenant support is PLATFORM_SUPPORT in app; not edited in Settings.';
comment on column tenant_settings.support_email is 'Reserved; see support_phone comment.';
comment on column tenant_settings.support_whatsapp is 'Reserved; see support_phone comment.';
