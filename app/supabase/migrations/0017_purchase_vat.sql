-- Purchase VAT: settings rate, line rate_excl + inclusive rate, header subtotal_excl + vat_amount.

alter table tenant_settings
  add column if not exists default_vat_pct numeric(5,2) not null default 13;

comment on column tenant_settings.default_vat_pct is
  'Default VAT % for purchase bills and sales when VAT registered.';

alter table purchases
  add column if not exists subtotal_excl numeric(12,2),
  add column if not exists vat_amount numeric(12,2) not null default 0;

alter table purchase_items
  add column if not exists rate_excl numeric(12,2);

-- Backfill: historical rate is VAT-inclusive per unit
update purchase_items pi
set rate_excl = round(
  pi.rate / (1 + coalesce(ts.default_vat_pct, 13) / 100),
  2
)
from purchases p
join tenant_settings ts on ts.tenant_id = p.tenant_id
where pi.purchase_id = p.id
  and pi.rate_excl is null
  and pi.rate > 0;

update purchase_items pi
set rate_excl = pi.rate
where pi.rate_excl is null;

update purchases p
set
  subtotal_excl = coalesce(agg.subtotal_excl, 0),
  vat_amount = coalesce(agg.vat_amount, 0),
  subtotal = coalesce(agg.subtotal_excl, 0) + coalesce(agg.vat_amount, 0),
  total = coalesce(agg.subtotal_excl, 0) + coalesce(agg.vat_amount, 0)
from (
  select
    pi.purchase_id,
    round(sum(pi.qty * pi.rate_excl), 2) as subtotal_excl,
    round(sum(pi.qty * (pi.rate - pi.rate_excl)), 2) as vat_amount
  from purchase_items pi
  group by pi.purchase_id
) agg
where p.id = agg.purchase_id
  and (p.subtotal_excl is null or p.vat_amount = 0);

alter table purchase_items
  alter column rate_excl set not null;

-- record_purchase: lines use rate_excl; rate column stores inclusive per unit
drop function if exists record_purchase(date, uuid, jsonb, text);
drop function if exists record_purchase(date, uuid, jsonb, text, text);

create or replace function record_purchase(
  p_purchase_date date,
  p_supplier_id uuid,
  p_lines jsonb,
  p_notes text default null,
  p_supplier_invoice_no text default null
)
returns table(purchase_id uuid, purchase_no text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_id uuid;
  v_no text;
  v_seq int;
  v_inv text;
  v_vat_pct numeric;
  v_subtotal_excl numeric := 0;
  v_vat_amount numeric := 0;
  v_total numeric := 0;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  select coalesce(ts.default_vat_pct, 13) into v_vat_pct
  from tenant_settings ts
  where ts.tenant_id = v_tenant;

  v_inv := nullif(trim(p_supplier_invoice_no), '');

  select coalesce(max(substring(p.purchase_no from 'PO-([0-9]+)$')::int), 0) + 1
  into v_seq
  from purchases p
  where p.tenant_id = v_tenant;

  v_no := 'PO-' || lpad(v_seq::text, 5, '0');

  select
    coalesce(sum((i->>'qty')::numeric * (i->>'rate_excl')::numeric), 0),
    coalesce(sum(
      round((i->>'qty')::numeric * (i->>'rate_excl')::numeric * v_vat_pct / 100)
    ), 0)
  into v_subtotal_excl, v_vat_amount
  from jsonb_array_elements(p_lines) as i;

  v_total := v_subtotal_excl + v_vat_amount;

  insert into purchases(
    tenant_id, purchase_no, purchase_date, supplier_id,
    subtotal_excl, vat_amount, subtotal, total, paid, payment_status, notes, supplier_invoice_no
  )
  values (
    v_tenant, v_no, p_purchase_date, p_supplier_id,
    v_subtotal_excl, v_vat_amount, v_subtotal_excl, v_total, 0, 'unpaid', p_notes, v_inv
  )
  returning id into v_id;

  insert into purchase_items(tenant_id, purchase_id, product_id, qty, rate_excl, rate)
  select
    v_tenant,
    v_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate_excl')::numeric,
    round((i->>'rate_excl')::numeric * (1 + v_vat_pct / 100), 2)
  from jsonb_array_elements(p_lines) as i;

  return query select v_id as purchase_id, v_no as purchase_no;
end;
$$;

grant execute on function record_purchase(date, uuid, jsonb, text, text) to authenticated;

drop function if exists update_purchase(uuid, uuid, date, jsonb, text);
drop function if exists update_purchase(uuid, uuid, date, jsonb, text, text);

create or replace function update_purchase(
  p_purchase_id uuid,
  p_supplier_id uuid,
  p_purchase_date date,
  p_lines jsonb,
  p_notes text default null,
  p_supplier_invoice_no text default null
)
returns table(purchase_id uuid, purchase_no text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_subtotal_excl numeric := 0;
  v_vat_amount numeric := 0;
  v_total numeric := 0;
  v_paid numeric;
  v_purchase_no text;
  v_existing_inv text;
  v_new_inv text;
  v_vat_pct numeric;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  if not exists (
    select 1 from purchases p
    where p.id = p_purchase_id and p.tenant_id = v_tenant
  ) then
    raise exception 'Purchase not found';
  end if;

  select coalesce(ts.default_vat_pct, 13) into v_vat_pct
  from tenant_settings ts
  where ts.tenant_id = v_tenant;

  select p.paid, p.purchase_no, coalesce(trim(p.supplier_invoice_no), '')
  into v_paid, v_purchase_no, v_existing_inv
  from purchases p
  where p.id = p_purchase_id and p.tenant_id = v_tenant;

  v_new_inv := nullif(trim(p_supplier_invoice_no), '');

  if v_existing_inv <> '' and v_new_inv is not null and v_new_inv <> v_existing_inv then
    raise exception 'Supplier invoice number cannot be changed';
  end if;

  select
    coalesce(sum((i->>'qty')::numeric * (i->>'rate_excl')::numeric), 0),
    coalesce(sum(
      round((i->>'qty')::numeric * (i->>'rate_excl')::numeric * v_vat_pct / 100)
    ), 0)
  into v_subtotal_excl, v_vat_amount
  from jsonb_array_elements(p_lines) as i;

  v_total := v_subtotal_excl + v_vat_amount;

  if v_total < v_paid then
    raise exception
      'New total (%s) cannot be less than amount already paid (%s)',
      v_total, v_paid;
  end if;

  update purchases p
  set
    supplier_id = p_supplier_id,
    purchase_date = p_purchase_date,
    subtotal_excl = v_subtotal_excl,
    vat_amount = v_vat_amount,
    subtotal = v_subtotal_excl,
    total = v_total,
    notes = p_notes,
    supplier_invoice_no = case
      when v_existing_inv <> '' then v_existing_inv
      when v_new_inv is not null then v_new_inv
      else null
    end,
    payment_status = case
      when v_paid >= v_total then 'paid'
      when v_paid > 0 then 'partial'
      else 'unpaid'
    end
  where p.id = p_purchase_id and p.tenant_id = v_tenant;

  delete from purchase_items pi
  where pi.purchase_id = p_purchase_id and pi.tenant_id = v_tenant;

  insert into purchase_items(tenant_id, purchase_id, product_id, qty, rate_excl, rate)
  select
    v_tenant,
    p_purchase_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate_excl')::numeric,
    round((i->>'rate_excl')::numeric * (1 + v_vat_pct / 100), 2)
  from jsonb_array_elements(p_lines) as i;

  return query select p_purchase_id as purchase_id, v_purchase_no as purchase_no;
end;
$$;

grant execute on function update_purchase(uuid, uuid, date, jsonb, text, text) to authenticated;
