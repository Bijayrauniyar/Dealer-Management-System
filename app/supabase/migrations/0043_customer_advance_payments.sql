-- Customer advance receipts, reversal, auto-apply advance on new sales bill.

alter table payments
  add column if not exists reversed_at timestamptz,
  add column if not exists reversal_reason text;

comment on column payments.reversed_at is 'Set when payment is reversed; excluded from customer balance.';
comment on column payments.reversal_reason is 'Required reason when reversing a payment.';

-- Postgres cannot INSERT a new column before last_payment_date via CREATE OR REPLACE VIEW.
drop view if exists v_overdue_customers;
drop view if exists v_customer_balance;

create view v_customer_balance as
select
  c.tenant_id,
  c.id as customer_id,
  c.name,
  c.phone,
  c.opening_balance
    + coalesce(b.total, 0)
    - coalesce(p.paid, 0)
    - coalesce(r.credits, 0) as balance,
  coalesce(b.total, 0) as total_billed,
  coalesce(p.paid, 0) as total_paid,
  coalesce(r.credits, 0) as total_credits,
  p.last_payment_date,
  coalesce(adv.advance, 0) as advance_balance
from customers c
left join (
  select customer_id, sum(total) total from sales_bills group by customer_id
) b on b.customer_id = c.id
left join (
  select
    customer_id,
    sum(amount) paid,
    max(payment_date) last_payment_date
  from payments
  where reversed_at is null
  group by customer_id
) p on p.customer_id = c.id
left join (
  select
    customer_id,
    sum(amount) advance
  from payments
  where reversed_at is null and bill_id is null
  group by customer_id
) adv on adv.customer_id = c.id
left join (
  select customer_id, sum(credit_note_amount) credits from returns group by customer_id
) r on r.customer_id = c.id;

create view v_overdue_customers as
select
  vcb.*,
  (current_date - coalesce(vcb.last_payment_date, current_date - 999)) as days_since_payment
from v_customer_balance vcb
where vcb.balance > 0
  and (vcb.last_payment_date is null or vcb.last_payment_date < current_date - interval '30 days');

grant select on v_customer_balance, v_overdue_customers to authenticated;

-- Unallocated advance (orphan payments, not reversed).
create or replace function customer_advance_balance(p_customer_id uuid)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(p.amount), 0)
  from payments p
  where p.tenant_id = current_tenant_id()
    and p.customer_id = p_customer_id
    and p.bill_id is null
    and p.reversed_at is null;
$$;

grant execute on function customer_advance_balance(uuid) to authenticated;

-- Link orphan payments to a bill (FIFO); splits a row if needed.
create or replace function allocate_advance_to_bill(
  p_customer_id uuid,
  p_bill_id uuid,
  p_amount numeric
)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  rem numeric := greatest(coalesce(p_amount, 0), 0);
  pay record;
  v_use numeric;
  v_remain numeric;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;
  if rem <= 0 then
    return 0;
  end if;

  for pay in
    select p.id, p.amount, p.payment_date, p.mode, p.notes
    from payments p
    where p.tenant_id = v_tenant
      and p.customer_id = p_customer_id
      and p.bill_id is null
      and p.reversed_at is null
    order by p.payment_date asc, p.created_at asc, p.id asc
  loop
    exit when rem <= 0;
    if pay.amount <= rem then
      update payments set bill_id = p_bill_id where id = pay.id;
      rem := rem - pay.amount;
    else
      v_use := rem;
      v_remain := pay.amount - v_use;
      update payments
      set amount = v_use, bill_id = p_bill_id
      where id = pay.id;
      insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode, notes)
      values (
        v_tenant, pay.payment_date, p_customer_id, null, v_remain, pay.mode,
        coalesce(pay.notes, 'Advance balance')
      );
      rem := 0;
    end if;
  end loop;

  return greatest(coalesce(p_amount, 0) - rem, 0);
end;
$$;

grant execute on function allocate_advance_to_bill(uuid, uuid, numeric) to authenticated;

create or replace function record_customer_advance(
  p_payment_date date,
  p_customer_id uuid,
  p_amount numeric,
  p_mode text,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_mode text;
  v_id uuid;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Advance amount must be positive';
  end if;

  v_mode := case
    when p_mode in ('Cash','UPI','Cheque','Bank','Other') then p_mode
    when p_mode in ('eSewa','Khalti','FonePay','Mobile banking') then 'UPI'
    else 'Cash'
  end;

  insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode, notes)
  values (
    v_tenant,
    p_payment_date,
    p_customer_id,
    null,
    p_amount,
    v_mode,
    coalesce(nullif(trim(p_notes), ''), 'Advance on account')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function record_customer_advance(date, uuid, numeric, text, text) to authenticated;

create or replace function reverse_customer_payment(
  p_payment_id uuid,
  p_reason text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  pay record;
begin
  if v_tenant is null then
    raise exception 'No tenant for current user';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'Reversal reason is required';
  end if;

  select p.id, p.amount, p.bill_id, p.reversed_at
  into pay
  from payments p
  where p.id = p_payment_id and p.tenant_id = v_tenant;

  if pay.id is null then
    raise exception 'Payment not found';
  end if;
  if pay.reversed_at is not null then
    raise exception 'Payment is already reversed';
  end if;

  if pay.bill_id is not null then
    update sales_bills sb
    set paid = greatest(0, sb.paid - pay.amount)
    where sb.id = pay.bill_id and sb.tenant_id = v_tenant;
  end if;

  update payments p
  set reversed_at = now(), reversal_reason = trim(p_reason)
  where p.id = p_payment_id and p.tenant_id = v_tenant;
end;
$$;

grant execute on function reverse_customer_payment(uuid, text) to authenticated;

-- create_sales_bill: auto-apply customer advance after cash paid on the bill.
-- Return type gains advance_applied — CREATE OR REPLACE cannot change OUT columns (42P13).
drop function if exists create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text, numeric, numeric);

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
returns table(bill_id uuid, bill_no text, advance_applied numeric)
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
  v_cash_paid numeric;
  v_advance_avail numeric;
  v_advance_apply numeric;
  v_bill_paid numeric;
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

  v_cash_paid := least(greatest(coalesce(p_paid, 0), 0), v_total);
  v_advance_avail := customer_advance_balance(p_customer_id);
  v_advance_apply := least(v_advance_avail, greatest(v_total - v_cash_paid, 0));
  v_bill_paid := v_cash_paid + v_advance_apply;

  insert into sales_bills(
    tenant_id, bill_no, bill_date, customer_id,
    payment_mode, subtotal, discount, total, paid, notes,
    vat_amount, extra_charges
  )
  values (
    v_tenant, v_bill_no, p_bill_date, p_customer_id,
    v_mode, v_subtotal, coalesce(p_discount, 0), v_total,
    v_bill_paid, p_notes,
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

  if v_cash_paid > 0 then
    insert into payments(tenant_id, payment_date, customer_id, bill_id, amount, mode, notes)
    values (
      v_tenant, p_bill_date, p_customer_id, v_bill_id,
      v_cash_paid,
      case when v_mode in ('Cash','UPI','Cheque','Bank') then v_mode else 'Cash' end,
      null
    );
  end if;

  if v_advance_apply > 0 then
    perform allocate_advance_to_bill(p_customer_id, v_bill_id, v_advance_apply);
  end if;

  return query select v_bill_id as bill_id, v_bill_no as bill_no, v_advance_apply as advance_applied;
end;
$$;

grant execute on function create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text, numeric, numeric) to authenticated;
