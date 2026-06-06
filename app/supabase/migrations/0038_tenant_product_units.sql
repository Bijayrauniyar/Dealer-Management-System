-- UNITS-1: tenant-defined product unit labels (product form dropdowns)

alter table tenant_settings
  add column if not exists product_units jsonb not null default '["PCS","Pkt","Box","Ctn","Doz","Ltr","Kg"]'::jsonb;

comment on column tenant_settings.product_units is
  'Ordered list of unit labels for product form base/pack UOM dropdowns.';

update tenant_settings
set product_units = '["PCS","Pkt","Box","Ctn","Doz","Ltr","Kg"]'::jsonb
where product_units is null
   or jsonb_typeof(product_units) <> 'array';
