-- Sales invoice edit: allow total correction when collected amount exceeds revised total.

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
    v_paid := v_total;
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
    paid = v_paid,
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

grant execute on function update_sales_bill(uuid, uuid, date, text, numeric, jsonb, text, numeric, numeric) to authenticated;
