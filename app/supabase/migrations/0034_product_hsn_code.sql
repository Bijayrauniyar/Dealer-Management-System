-- Optional HSN code on product master (HSN-1). Not shown on bills in v1.

alter table public.products
  add column if not exists hsn_code text;

comment on column public.products.hsn_code is 'Optional harmonized system nomenclature code for VAT returns; not printed on bills in v1.';
