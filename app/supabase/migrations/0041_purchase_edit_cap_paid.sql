-- Allow correcting purchase line prices after invoice was marked paid (e.g. due-date auto-paid).
-- When new total < stored paid, cap paid to new total instead of blocking the edit.

drop function if exists update_purchase(uuid, uuid, date, jsonb, text, text, date);

create or replace function update_purchase(
  p_purchase_id uuid,
  p_supplier_id uuid,
  p_purchase_date date,
  p_lines jsonb,
  p_notes text default null,
  p_supplier_invoice_no text default null,
  p_due_date date default null
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

  -- Price correction: paid may exceed new total if old total was wrong or due-date auto-paid.
  if v_total < v_paid then
    v_paid := v_total;
  end if;

  if v_paid = 0 and p_due_date is not null and p_due_date <= current_date then
    v_paid := v_total;
  end if;

  update purchases p
  set
    supplier_id = p_supplier_id,
    purchase_date = p_purchase_date,
    subtotal_excl = v_subtotal_excl,
    vat_amount = v_vat_amount,
    subtotal = v_subtotal_excl,
    total = v_total,
    paid = v_paid,
    due_date = p_due_date,
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

grant execute on function update_purchase(uuid, uuid, date, jsonb, text, text, date) to authenticated;
