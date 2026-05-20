-- Persist sell UOM on each line; stock view converts pack qty → base units (PCS).

alter table sales_items
  add column if not exists unit text;

comment on column sales_items.unit is
  'Unit printed on bill (e.g. Box, PCS). Stock uses base product.unit with uom_conversion.';

-- Stock: sold qty in base units when line was invoiced in pack UOM
create or replace view v_stock as
select
  p.tenant_id,
  p.id as product_id,
  p.code,
  p.name,
  p.unit,
  p.opening_stock,
  coalesce(pur.qty, 0) as purchased,
  coalesce(sal.qty, 0) as sold,
  coalesce(dam.qty, 0) as damaged,
  coalesce(ret.qty, 0) as returned,
  (
    p.opening_stock
    + coalesce(pur.qty, 0)
    - coalesce(sal.qty, 0)
    - coalesce(dam.qty, 0)
    + coalesce(ret.qty, 0)
  ) as closing_stock
from products p
left join (
  select product_id, sum(qty) as qty
  from purchase_items
  group by product_id
) pur on pur.product_id = p.id
left join (
  select
    si.product_id,
    sum(
      si.qty * case
        when p2.uom_conversion is not null
          and (p2.uom_conversion->>'pack_uom') is not null
          and trim(coalesce(si.unit, '')) = trim(p2.uom_conversion->>'pack_uom')
          and coalesce((p2.uom_conversion->>'factor')::numeric, 0) >= 2
        then (p2.uom_conversion->>'factor')::numeric
        else 1
      end
    ) as qty
  from sales_items si
  join products p2 on p2.id = si.product_id
  group by si.product_id
) sal on sal.product_id = p.id
left join (
  select product_id, sum(qty) as qty
  from damages
  group by product_id
) dam on dam.product_id = p.id
left join (
  select product_id, sum(qty) as qty
  from returns
  group by product_id
) ret on ret.product_id = p.id;

-- create_sales_bill: store unit on each line
create or replace function create_sales_bill(
  p_customer_id uuid,
  p_bill_date date,
  p_payment_mode text,
  p_discount numeric,
  p_items jsonb,
  p_paid numeric default 0,
  p_notes text default null,
  p_vat_amount numeric default 0,
  p_extra_charges numeric default 0
)
returns table(bill_id uuid, bill_no text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_prefix text;
  v_bill_id uuid;
  v_bill_no text;
  v_subtotal numeric := 0;
  v_next_seq int;
  v_total numeric;
  v_mode text;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  select coalesce(nullif(trim(invoice_prefix), ''), 'INV')
    into v_prefix
  from tenant_settings
  where tenant_id = v_tenant;

  select coalesce(max(substring(b.bill_no from '([0-9]+)$')::int), 0) + 1
  into v_next_seq
  from sales_bills b
  where b.tenant_id = v_tenant
    and b.bill_no like v_prefix || '-%';

  v_bill_no := v_prefix || '-' || v_next_seq::text;

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) i;

  v_total := v_subtotal - coalesce(p_discount, 0) + coalesce(p_vat_amount, 0) + coalesce(p_extra_charges, 0);

  v_mode := case
    when coalesce(p_payment_mode, '') in ('Cash','Credit','UPI','Cheque','Bank') then p_payment_mode
    when p_payment_mode in ('eSewa','Khalti','FonePay','Mobile banking') then 'UPI'
    else 'Credit'
  end;

  insert into sales_bills(
    tenant_id, bill_no, bill_date, customer_id,
    payment_mode, subtotal, discount, total, paid, notes,
    vat_amount, extra_charges
  )
  values (
    v_tenant, v_bill_no, p_bill_date, p_customer_id,
    v_mode, v_subtotal, coalesce(p_discount, 0), v_total,
    least(coalesce(p_paid, 0), v_total), p_notes,
    coalesce(p_vat_amount, 0), coalesce(p_extra_charges, 0)
  )
  returning id into v_bill_id;

  insert into sales_items(tenant_id, bill_id, product_id, qty, rate, unit)
  select
    v_tenant,
    v_bill_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate')::numeric,
    nullif(trim(i->>'unit'), '')
  from jsonb_array_elements(p_items) i;

  if coalesce(p_paid, 0) > 0 then
    insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode, notes)
    values (
      v_tenant, p_bill_date, p_customer_id, v_bill_id,
      least(coalesce(p_paid, 0), v_total),
      case when v_mode in ('Cash','UPI','Cheque','Bank') then v_mode else 'Cash' end,
      null
    );
  end if;

  return query select v_bill_id as bill_id, v_bill_no as bill_no;
end;
$$;

-- update_sales_bill: store unit on each line
create or replace function update_sales_bill(
  p_bill_id uuid,
  p_customer_id uuid,
  p_bill_date date,
  p_payment_mode text,
  p_discount numeric,
  p_items jsonb,
  p_notes text default null,
  p_vat_amount numeric default 0,
  p_extra_charges numeric default 0
)
returns table(bill_id uuid, bill_no text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_subtotal numeric := 0;
  v_total numeric;
  v_mode text;
  v_paid numeric;
  v_bill_no text;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;

  if not exists (
    select 1 from sales_bills where id = p_bill_id and tenant_id = v_tenant
  ) then
    raise exception 'Bill not found';
  end if;

  select sb.paid, sb.bill_no into v_paid, v_bill_no
  from sales_bills sb
  where sb.id = p_bill_id and sb.tenant_id = v_tenant;

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) i;

  v_total :=
    v_subtotal
    - coalesce(p_discount, 0)
    + coalesce(p_vat_amount, 0)
    + coalesce(p_extra_charges, 0);

  if v_total < v_paid then
    raise exception
      'New total (%s) cannot be less than amount already paid (%s)',
      v_total, v_paid;
  end if;

  v_mode := case
    when coalesce(p_payment_mode, '') in ('Cash','Credit','UPI','Cheque','Bank') then p_payment_mode
    when p_payment_mode in ('eSewa','Khalti','FonePay','Mobile banking') then 'UPI'
    else 'Credit'
  end;

  update sales_bills
  set
    customer_id = p_customer_id,
    bill_date = p_bill_date,
    payment_mode = v_mode,
    subtotal = v_subtotal,
    discount = coalesce(p_discount, 0),
    vat_amount = coalesce(p_vat_amount, 0),
    extra_charges = coalesce(p_extra_charges, 0),
    total = v_total,
    notes = p_notes
  where id = p_bill_id and tenant_id = v_tenant;

  update payments pay
  set customer_id = p_customer_id
  where pay.bill_id = p_bill_id and pay.tenant_id = v_tenant;

  delete from sales_items si where si.bill_id = p_bill_id and si.tenant_id = v_tenant;

  insert into sales_items(tenant_id, bill_id, product_id, qty, rate, unit)
  select
    v_tenant,
    p_bill_id,
    (i->>'product_id')::uuid,
    (i->>'qty')::numeric,
    (i->>'rate')::numeric,
    nullif(trim(i->>'unit'), '')
  from jsonb_array_elements(p_items) i;

  return query select p_bill_id, v_bill_no;
end;
$$;
