-- Default / per-product low-stock thresholds in pack units (Box, etc.) alongside base min_qty (PCS).

alter table tenant_settings
  add column if not exists default_min_pack_qty integer not null default 2;

comment on column tenant_settings.default_min_pack_qty is
  'Default low-stock alert in pack UOM when product has uom_conversion; compared as min_pack × factor PCS.';

alter table products
  add column if not exists min_qty_pack numeric(12,2);

comment on column products.min_qty_pack is
  'Optional low-stock threshold in pack UOM (e.g. Box). Alert when on_hand <= min_qty_pack × conversion factor.';
