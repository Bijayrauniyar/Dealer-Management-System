-- Product catalog prices: 4 decimal places (buy/sell/MRP precision for distributors).
alter table products
  alter column purchase_price type numeric(12, 4),
  alter column sale_price type numeric(12, 4),
  alter column mrp type numeric(12, 4);

comment on column products.purchase_price is 'Buy price incl. VAT stored; up to 4 decimal places';
comment on column products.sale_price is 'Sell price excl. VAT; up to 4 decimal places';
comment on column products.mrp is 'MRP on label; up to 4 decimal places';
