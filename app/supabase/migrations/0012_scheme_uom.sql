-- Optional UOM on schemes: e.g. buy 1 Box, get 1 PCS free (different units).

alter table scheme_tracker
  add column if not exists buy_uom text,
  add column if not exists free_uom text;

comment on column scheme_tracker.buy_uom is
  'When set, scheme applies only when the paid sale line uses this unit (e.g. Box).';
comment on column scheme_tracker.free_uom is
  'When set, the free scheme line uses this unit (e.g. PCS); otherwise same as paid line.';
