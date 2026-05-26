-- 1) Backfill missing supplier invoice numbers: INV-001, INV-002, … per tenant (by date).
-- 2) Allow update_purchase to set invoice no. once when still empty (not change existing).

with missing as (
  select
    p.id,
    row_number() over (
      partition by p.tenant_id
      order by p.purchase_date asc, p.created_at asc, p.id asc
    ) as rn
  from purchases p
  where coalesce(trim(p.supplier_invoice_no), '') = ''
)
update purchases p
set supplier_invoice_no = 'INV-' || lpad(m.rn::text, 3, '0')
from missing m
where p.id = m.id;

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
  v_subtotal numeric := 0;
  v_paid numeric;
  v_purchase_no text;
  v_existing_inv text;
  v_new_inv text;
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

  select p.paid, p.purchase_no, coalesce(trim(p.supplier_invoice_no), '')
  into v_paid, v_purchase_no, v_existing_inv
  from purchases p
  where p.id = p_purchase_id and p.tenant_id = v_tenant;

  v_new_inv := nullif(trim(p_supplier_invoice_no), '');

  if v_existing_inv <> '' and v_new_inv is not null and v_new_inv <> v_existing_inv then
    raise exception 'Supplier invoice number cannot be changed';
  end if;

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
    supplier_invoice_no = case
      when v_existing_inv <> '' then v_existing_inv
      when v_new_inv is not null then v_new_inv
      else null
    end,
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
