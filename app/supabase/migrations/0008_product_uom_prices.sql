-- Per-product MRP and sell price by unit (e.g. PCS vs Box)
alter table products
  add column if not exists uom_prices jsonb not null default '{}'::jsonb;

comment on column products.uom_prices is
  'Map of UOM -> { mrp, sale_price }. Primary unit also mirrored in unit/mrp/sale_price columns.';
