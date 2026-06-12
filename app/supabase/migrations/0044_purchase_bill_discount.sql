-- Purchase bill-level discount before VAT (flat or % resolved in app — same pattern as sales).

alter table purchases
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists discount_label text;

comment on column purchases.discount is
  'Bill-level discount in NPR (excl. VAT base), applied before VAT.';
comment on column purchases.discount_label is
  'Optional print label e.g. Scheme (B4G1).';

drop function if exists record_purchase(date, uuid, jsonb, text, text, date);

create or replace function record_purchase(
  p_purchase_date date,
  p_supplier_id uuid,
  p_lines jsonb,
  p_notes text default null,
  p_supplier_invoice_no text default null,
  p_due_date date default null,
  p_discount numeric default 0,
  p_discount_label text default null
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
  v_discount numeric := 0;
  v_taxable_excl numeric := 0;
  v_vat_amount numeric := 0;
  v_total numeric := 0;
  v_paid numeric := 0;
  v_status text := 'unpaid';
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

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate_excl')::numeric), 0)
  into v_subtotal_excl
  from jsonb_array_elements(p_lines) as i;

  v_discount := greatest(0, least(coalesce(p_discount, 0), v_subtotal_excl));
  v_taxable_excl := v_subtotal_excl - v_discount;
  v_vat_amount := round(v_taxable_excl * v_vat_pct / 100);
  v_total := v_taxable_excl + v_vat_amount;

  if p_due_date is not null and p_due_date <= current_date then
    v_paid := v_total;
    v_status := 'paid';
  end if;

  insert into purchases(
    tenant_id, purchase_no, purchase_date, supplier_id,
    subtotal_excl, discount, discount_label, vat_amount, subtotal, total, paid, payment_status, notes, supplier_invoice_no,
    due_date
  )
  values (
    v_tenant, v_no, p_purchase_date, p_supplier_id,
    v_subtotal_excl, v_discount, nullif(trim(p_discount_label), ''), v_vat_amount, v_subtotal_excl, v_total, v_paid, v_status, p_notes, v_inv,
    p_due_date
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

grant execute on function record_purchase(date, uuid, jsonb, text, text, date, numeric, text) to authenticated;

drop function if exists update_purchase(uuid, uuid, date, jsonb, text, text, date);

create or replace function update_purchase(
  p_purchase_id uuid,
  p_supplier_id uuid,
  p_purchase_date date,
  p_lines jsonb,
  p_notes text default null,
  p_supplier_invoice_no text default null,
  p_due_date date default null,
  p_discount numeric default 0,
  p_discount_label text default null
)
returns table(purchase_id uuid, purchase_no text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := current_tenant_id();
  v_subtotal_excl numeric := 0;
  v_discount numeric := 0;
  v_taxable_excl numeric := 0;
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

  select coalesce(sum((i->>'qty')::numeric * (i->>'rate_excl')::numeric), 0)
  into v_subtotal_excl
  from jsonb_array_elements(p_lines) as i;

  v_discount := greatest(0, least(coalesce(p_discount, 0), v_subtotal_excl));
  v_taxable_excl := v_subtotal_excl - v_discount;
  v_vat_amount := round(v_taxable_excl * v_vat_pct / 100);
  v_total := v_taxable_excl + v_vat_amount;

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
    discount = v_discount,
    discount_label = nullif(trim(p_discount_label), ''),
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

grant execute on function update_purchase(uuid, uuid, date, jsonb, text, text, date, numeric, text) to authenticated;
