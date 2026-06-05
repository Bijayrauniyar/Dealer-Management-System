
-- PRICE-DISP-1 + BILL-QR-1: sales/purchase print column mode + payment QR on sales invoice
alter table tenant_settings
  add column if not exists sales_bill_price_mode text not null default 'mrp',
  add column if not exists purchase_bill_price_mode text not null default 'rate_excl',
  add column if not exists sales_bill_qr_image_url text,
  add column if not exists sales_bill_qr_bank_text text;

comment on column tenant_settings.sales_bill_price_mode is 'mrp | selling_price — unit price column on sales invoice print';
comment on column tenant_settings.purchase_bill_price_mode is 'rate_excl | rate_incl — unit rate column on purchase invoice print';
comment on column tenant_settings.sales_bill_qr_image_url is 'Static QR image URL or data URL for balance-due sales invoices';
comment on column tenant_settings.sales_bill_qr_bank_text is 'Bank name and account line shown with payment QR';
