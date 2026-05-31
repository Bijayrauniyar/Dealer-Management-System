-- =============================================================================
-- BikriKhata - Migration 0003: Phase 1 — richer sales + operational RPCs
-- Run after 0002. Safe to re-run: DROP/CREATE OR REPLACE where applicable.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Products: FE fields not in v1 schema
-- -----------------------------------------------------------------------------
alter table products add column if not exists mrp numeric(12,2) not null default 0;
alter table products add column if not exists discount_pct numeric(5,2) not null default 0;
alter table products add column if not exists vat_applicable boolean not null default false;
alter table products add column if not exists min_qty numeric(12,2) not null default 20;

-- -----------------------------------------------------------------------------
-- 2. Sales bills: VAT + bill terms (transport etc.)
-- -----------------------------------------------------------------------------
alter table sales_bills add column if not exists vat_amount numeric(12,2) not null default 0;
alter table sales_bills add column if not exists extra_charges numeric(12,2) not null default 0;

-- -----------------------------------------------------------------------------
-- 3. Replace create_sales_bill — tenant invoice prefix, VAT, extra charges
-- -----------------------------------------------------------------------------
drop function if exists create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text);

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

  insert into sales_items(tenant_id, bill_id, product_id, qty, rate)
  select v_tenant, v_bill_id, (i->>'product_id')::uuid, (i->>'qty')::numeric, (i->>'rate')::numeric
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

grant execute on function create_sales_bill(uuid, date, text, numeric, jsonb, numeric, text, numeric, numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Customer payment across one or more bills
-- -----------------------------------------------------------------------------
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

grant execute on function apply_customer_payment(date, uuid, numeric, text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Goods return — credit against a bill + stock back
-- -----------------------------------------------------------------------------
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

grant execute on function apply_goods_return(date, uuid, uuid, numeric, jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Purchase (stock in + supplier payable)
-- -----------------------------------------------------------------------------
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

grant execute on function record_purchase(date, uuid, jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Supplier payment — FIFO against unpaid purchases
-- -----------------------------------------------------------------------------
create or replace function apply_supplier_payment(
  p_payment_date date,
  p_supplier_id uuid,
  p_amount numeric,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  rem numeric := coalesce(p_amount, 0);
  pur record;
  v_apply numeric;
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;
  if rem <= 0 then return; end if;

  for pur in
    select id, total, paid
    from purchases
    where tenant_id = v_tenant and supplier_id = p_supplier_id and paid < total
    order by purchase_date asc, id asc
  loop
    exit when rem <= 0;
    v_apply := least(rem, pur.total - pur.paid);
    update purchases p
    set paid = p.paid + v_apply,
        payment_status = case
          when pur.paid + v_apply >= pur.total then 'paid'
          when pur.paid + v_apply > 0 then 'partial'
          else 'unpaid'
        end
    where p.id = pur.id;
    rem := rem - v_apply;
  end loop;
end;
$$;

grant execute on function apply_supplier_payment(date, uuid, numeric, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Expense + damage (simple inserts)
-- -----------------------------------------------------------------------------
create or replace function record_expense(
  p_expense_date date,
  p_category text,
  p_amount numeric,
  p_paid_by text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_id uuid;
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;
  insert into expenses(tenant_id, expense_date, category, amount, paid_by, notes)
  values (v_tenant, p_expense_date, p_category, p_amount, p_paid_by, p_notes)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function record_expense(date, text, numeric, text, text) to authenticated;

create or replace function record_damage(
  p_damage_date date,
  p_product_id uuid,
  p_qty numeric,
  p_reason text,
  p_cost numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_id uuid;
begin
  if v_tenant is null then raise exception 'No tenant for current user'; end if;
  insert into damages(tenant_id, damage_date, product_id, qty, reason, cost, notes)
  values (v_tenant, p_damage_date, p_product_id, p_qty, p_reason, coalesce(p_cost, 0), p_notes)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function record_damage(date, uuid, numeric, text, numeric, text) to authenticated;

-- =============================================================================
-- End 0003
-- =============================================================================
