-- Supplier's own invoice / bill number on purchase (separate from auto PO-xxxxx).

alter table purchases
  add column if not exists supplier_invoice_no text;

comment on column purchases.supplier_invoice_no is
  'Invoice or bill number printed on the supplier document (e.g. INV-8842). PO purchase_no is our internal id.';

drop function if exists record_purchase(date, uuid, jsonb, text);

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
  v_subtotal numeric := 0;
  v_inv text;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  v_inv := nullif(trim(p_supplier_invoice_no), '');

  select coalesce(max(substring(p.purchase_no from 'PO-([0-9]+)$')::int), 0) + 1
  into v_seq
  from purchases p
  where p.tenant_id = v_tenant;

  v_no := 'PO-' || lpad(v_seq::text, 5, '0');

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_lines) as i;

  insert into purchases(
    tenant_id, purchase_no, purchase_date, supplier_id,
    subtotal, total, paid, payment_status, notes, supplier_invoice_no
  )
  values (
    v_tenant, v_no, p_purchase_date, p_supplier_id,
    v_subtotal, v_subtotal, 0, 'unpaid', p_notes, v_inv
  )
  returning id into v_id;

  insert into purchase_items(tenant_id, purchase_id, product_id, qty, rate)
  select
    v_tenant,
    v_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate')::numeric
  from jsonb_array_elements(p_lines) as i;

  return query select v_id as purchase_id, v_no as purchase_no;
end;
$$;

grant execute on function record_purchase(date, uuid, jsonb, text, text) to authenticated;

drop function if exists update_purchase(uuid, uuid, date, jsonb, text);

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
  v_subtotal numeric := 0;
  v_paid numeric;
  v_purchase_no text;
  v_inv text;
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

  v_inv := nullif(trim(p_supplier_invoice_no), '');

  select p.paid, p.purchase_no into v_paid, v_purchase_no
  from purchases p
  where p.id = p_purchase_id and p.tenant_id = v_tenant;

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_lines) as i;

  if v_subtotal < v_paid then
    raise exception
      'New total (%s) cannot be less than amount already paid (%s)',
      v_subtotal, v_paid;
  end if;

  update purchases p
  set
    supplier_id = p_supplier_id,
    purchase_date = p_purchase_date,
    subtotal = v_subtotal,
    total = v_subtotal,
    notes = p_notes,
    supplier_invoice_no = v_inv,
    payment_status = case
      when v_paid >= v_subtotal then 'paid'
      when v_paid > 0 then 'partial'
      else 'unpaid'
    end
  where p.id = p_purchase_id and p.tenant_id = v_tenant;

  delete from purchase_items pi
  where pi.purchase_id = p_purchase_id and pi.tenant_id = v_tenant;

  insert into purchase_items(tenant_id, purchase_id, product_id, qty, rate)
  select
    v_tenant,
    p_purchase_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate')::numeric
  from jsonb_array_elements(p_lines) as i;

  return query select p_purchase_id as purchase_id, v_purchase_no as purchase_no;
end;
$$;

grant execute on function update_purchase(uuid, uuid, date, jsonb, text, text) to authenticated;
