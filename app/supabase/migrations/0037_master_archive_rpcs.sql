-- DEL-1: archive / restore masters (no hard delete)
create or replace function set_product_active(p_product_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := current_tenant_id();
  if v_tenant is null then
    raise exception 'No tenant context';
  end if;
  update products
  set is_active = p_active
  where id = p_product_id and tenant_id = v_tenant;
  if not found then
    raise exception 'Product not found';
  end if;
end;
$$;

create or replace function set_customer_active(p_customer_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_bal numeric;
begin
  v_tenant := current_tenant_id();
  if v_tenant is null then
    raise exception 'No tenant context';
  end if;
  if not p_active then
    select coalesce(balance, 0) into v_bal
    from v_customer_balance
    where customer_id = p_customer_id and tenant_id = v_tenant;
    if coalesce(v_bal, 0) > 0.01 then
      raise exception 'Cannot archive customer with outstanding balance';
    end if;
  end if;
  update customers
  set is_active = p_active
  where id = p_customer_id and tenant_id = v_tenant;
  if not found then
    raise exception 'Customer not found';
  end if;
end;
$$;

create or replace function set_supplier_active(p_supplier_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_bal numeric;
begin
  v_tenant := current_tenant_id();
  if v_tenant is null then
    raise exception 'No tenant context';
  end if;
  if not p_active then
    select coalesce(balance, 0) into v_bal
    from v_supplier_balance
    where supplier_id = p_supplier_id and tenant_id = v_tenant;
    if coalesce(v_bal, 0) > 0.01 then
      raise exception 'Cannot archive supplier with outstanding payable';
    end if;
  end if;
  update suppliers
  set is_active = p_active
  where id = p_supplier_id and tenant_id = v_tenant;
  if not found then
    raise exception 'Supplier not found';
  end if;
end;
$$;

grant execute on function set_product_active(uuid, boolean) to authenticated;
grant execute on function set_customer_active(uuid, boolean) to authenticated;
grant execute on function set_supplier_active(uuid, boolean) to authenticated;
