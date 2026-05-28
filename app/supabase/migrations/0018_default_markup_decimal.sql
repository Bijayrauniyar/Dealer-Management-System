-- Allow decimal default markup % (e.g. 4.5) in tenant_settings.
alter table public.tenant_settings
  alter column default_markup_pct type numeric(5, 2) using default_markup_pct::numeric(5, 2);
