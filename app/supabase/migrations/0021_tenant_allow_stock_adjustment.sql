-- Phase 0 Tier A: opt-in manual stock adjustment (Settings toggle).

alter table tenant_settings
  add column if not exists allow_stock_adjustment boolean not null default false;

comment on column tenant_settings.allow_stock_adjustment is
  'When true, owners can post +/- stock adjustments without a purchase.';
