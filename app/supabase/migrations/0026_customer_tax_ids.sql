-- Phase 0 Tier C (VAT-0c): optional buyer PAN / VAT on customer master + bills

alter table customers
  add column if not exists pan_number text,
  add column if not exists vat_number text;

comment on column customers.pan_number is 'Optional buyer PAN for B2B sales invoices.';
comment on column customers.vat_number is 'Optional buyer VAT number when shop is VAT registered.';
