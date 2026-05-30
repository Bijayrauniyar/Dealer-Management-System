-- Phase 0 Tier A: tenant-defined product categories (replaces hardcoded ice-cream list).

alter table tenant_settings
  add column if not exists product_categories jsonb not null default '["General"]'::jsonb;

comment on column tenant_settings.product_categories is
  'Ordered list of category labels for product form dropdown.';

-- Ensure existing rows have a valid array
update tenant_settings
set product_categories = '["General"]'::jsonb
where product_categories is null
   or jsonb_typeof(product_categories) <> 'array';
