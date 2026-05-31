-- INV-1: reject create/update sales bill when line qty exceeds available stock (base PCS).

create or replace function line_qty_to_base_pcs(
  p_product_id uuid,
  p_qty numeric,
  p_unit text
)
returns numeric
language sql
stable
set search_path = public
as $$
  select p_qty * case
    when p.uom_conversion is not null
      and (p.uom_conversion->>'pack_uom') is not null
      and trim(coalesce(p_unit, '')) = trim(p.uom_conversion->>'pack_uom')
      and coalesce((p.uom_conversion->>'factor')::numeric, 0) >= 2
    then (p.uom_conversion->>'factor')::numeric
    else 1
  end
  from products p
  where p.id = p_product_id;
$$;

create or replace function assert_sale_stock_available(
  p_tenant_id uuid,
  p_items jsonb,
  p_exclude_bill_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  v_available numeric;
  v_demand numeric;
begin
  if p_tenant_id is null then
    raise exception 'No tenant for current user';
  end if;

  for r in
    select
      (i->>'product_id')::uuid as product_id,
      sum(line_qty_to_base_pcs(
        (i->>'product_id')::uuid,
        (i->>'qty')::numeric,
        i->>'unit'
      )) as demand
    from jsonb_array_elements(p_items) i
    where coalesce((i->>'qty')::numeric, 0) > 0
    group by (i->>'product_id')::uuid
  loop
    select
      p.opening_stock
      + coalesce(pur.qty, 0)
      + coalesce(adj.qty, 0)
      - coalesce(sal.qty, 0)
      - coalesce(dam.qty, 0)
      + coalesce(ret.qty, 0)
    into v_available
    from products p
    left join (
      select product_id, sum(qty) as qty from purchase_items group by product_id
    ) pur on pur.product_id = p.id
    left join (
      select product_id, sum(qty_delta) as qty from stock_adjustments group by product_id
    ) adj on adj.product_id = p.id
    left join (
      select
        si.product_id,
        sum(line_qty_to_base_pcs(si.product_id, si.qty, si.unit)) as qty
      from sales_items si
      where si.tenant_id = p_tenant_id
        and (p_exclude_bill_id is null or si.bill_id <> p_exclude_bill_id)
      group by si.product_id
    ) sal on sal.product_id = p.id
    left join (
      select product_id, sum(qty) as qty from damages group by product_id
    ) dam on dam.product_id = p.id
    left join (
      select product_id, sum(qty) as qty from returns group by product_id
    ) ret on ret.product_id = p.id
    where p.id = r.product_id and p.tenant_id = p_tenant_id;

    v_demand := coalesce(r.demand, 0);
    v_available := coalesce(v_available, 0);

    if v_demand > v_available then
      raise exception 'Insufficient stock for %',
        (select name from products where id = r.product_id and tenant_id = p_tenant_id);
    end if;
  end loop;
end;
$$;

grant execute on function line_qty_to_base_pcs(uuid, numeric, text) to authenticated;
grant execute on function assert_sale_stock_available(uuid, jsonb, uuid) to authenticated;

-- create_sales_bill (from 0010) + stock guard before insert
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

  perform assert_sale_stock_available(v_tenant, p_items, null);

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

  perform assert_sale_stock_available(v_tenant, p_items, p_bill_id);

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

grant execute on function create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text, numeric, numeric) to authenticated;
grant execute on function update_sales_bill(uuid, uuid, date, text, numeric, jsonb, text, numeric, numeric) to authenticated;
