-- Pack size: 1 pack_uom = factor × base unit (products.unit), e.g. 1 Box = 10 PCS
alter table products
  add column if not exists uom_conversion jsonb;

comment on column products.uom_conversion is
  'Optional { "pack_uom": "Box", "factor": 10 } — 1 pack = factor × unit (base/stock UOM).';
