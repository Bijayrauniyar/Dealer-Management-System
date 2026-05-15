-- Fix Phase 1 RPC bugs found in E2E (jsonb loop field + ambiguous purchase_no).
-- Run in SQL Editor after 0003.

create or replace function apply_customer_payment(
  p_payment_date date,
  p_customer_id uuid,
  p_amount numeric,
  p_mode text,
  p_notes text,
  p_allocations jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_mode text;
  rec record;
  v_bill_id uuid;
  v_amt numeric;
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;

  v_mode := case
    when p_mode in ('Cash','UPI','Cheque','Bank','Other') then p_mode
    when p_mode in ('eSewa','Khalti','FonePay','Mobile banking') then 'UPI'
    else 'Cash'
  end;

  for rec in select value from jsonb_array_elements(p_allocations)
  loop
    v_bill_id := (rec.value->>'bill_id')::uuid;
    v_amt := (rec.value->>'amount')::numeric;
    if v_amt is null or v_amt <= 0 then continue; end if;

    update sales_bills sb
    set paid = paid + v_amt
    where sb.id = v_bill_id and sb.tenant_id = v_tenant and sb.customer_id = p_customer_id;

    insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode, notes)
    values (v_tenant, p_payment_date, p_customer_id, v_bill_id, v_amt, v_mode, p_notes);
  end loop;
end;
$$;

create or replace function apply_goods_return(
  p_return_date date,
  p_customer_id uuid,
  p_bill_id uuid,
  p_credit_amount numeric,
  p_lines jsonb,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_open numeric;
  v_apply numeric;
  rec record;
  v_pid uuid;
  v_qty numeric;
  v_line_credit numeric;
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;

  select greatest(0, total - paid) into v_open
  from sales_bills where id = p_bill_id and tenant_id = v_tenant and customer_id = p_customer_id;

  if v_open is null then raise exception 'Bill not found'; end if;

  v_apply := least(coalesce(p_credit_amount, 0), v_open);

  update sales_bills
  set paid = paid + v_apply
  where id = p_bill_id and tenant_id = v_tenant;

  for rec in select value from jsonb_array_elements(p_lines)
  loop
    v_pid := (rec.value->>'product_id')::uuid;
    v_qty := (rec.value->>'return_qty')::numeric;
    if v_qty is null or v_qty <= 0 then continue; end if;

    v_line_credit := coalesce((rec.value->>'credit_note_amount')::numeric, 0);

    insert into returns(
      tenant_id, return_date, customer_id, product_id, qty, reason, credit_note_amount, notes
    )
    values (
      v_tenant, p_return_date, p_customer_id, v_pid, v_qty,
      coalesce(rec.value->>'reason', 'return'),
      v_line_credit,
      p_notes
    );
  end loop;
end;
$$;

create or replace function record_purchase(
  p_purchase_date date,
  p_supplier_id uuid,
  p_lines jsonb,
  p_notes text default null
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
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;

  select coalesce(max(substring(p.purchase_no from 'PO-([0-9]+)$')::int), 0) + 1
  into v_seq
  from purchases p
  where p.tenant_id = v_tenant;

  v_no := 'PO-' || lpad(v_seq::text, 5, '0');

  select coalesce(sum((i.value->>'qty')::numeric * (i.value->>'rate')::numeric), 0)
  into v_subtotal
  from jsonb_array_elements(p_lines) as i(value);

  insert into purchases(
    tenant_id, purchase_no, purchase_date, supplier_id, subtotal, total, paid, payment_status, notes
  )
  values (v_tenant, v_no, p_purchase_date, p_supplier_id, v_subtotal, v_subtotal, 0, 'unpaid', p_notes)
  returning id into v_id;

  insert into purchase_items(tenant_id, purchase_id, product_id, qty, rate)
  select v_tenant, v_id, (i.value->>'product_id')::uuid, (i.value->>'qty')::numeric, (i.value->>'rate')::numeric
  from jsonb_array_elements(p_lines) as i(value);

  return query select v_id, v_no;
end;
$$;
