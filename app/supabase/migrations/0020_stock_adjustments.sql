-- Phase 0 Tier A: manual stock adjustments (godown count corrections).

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  adjustment_date date not null default current_date,
  product_id uuid not null references products(id),
  qty_delta numeric(12, 2) not null,
  reason text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_adj_tenant_date on stock_adjustments(tenant_id, adjustment_date);
create index if not exists idx_stock_adj_product on stock_adjustments(product_id);

alter table stock_adjustments enable row level security;

drop policy if exists stock_adjustments_all on stock_adjustments;
create policy stock_adjustments_all on stock_adjustments
  for all
  using (tenant_id = current_tenant_id() or is_super_admin())
  with check (tenant_id = current_tenant_id() or is_super_admin());

create or replace function record_stock_adjustment(
  p_adjustment_date date,
  p_product_id uuid,
  p_qty_delta numeric,
  p_reason text,
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
  if p_qty_delta = 0 then raise exception 'Adjustment qty cannot be zero'; end if;
  insert into stock_adjustments(tenant_id, adjustment_date, product_id, qty_delta, reason, notes)
  values (v_tenant, p_adjustment_date, p_product_id, p_qty_delta, p_reason, p_notes)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function record_stock_adjustment(date, uuid, numeric, text, text) to authenticated;

-- v_stock: include adjusted qty in closing (drop required: cannot insert column before "sold" via replace)
drop view if exists public.v_stock;
create view public.v_stock as
select
  p.tenant_id,
  p.id as product_id,
  p.code,
  p.name,
  p.unit,
  p.opening_stock,
  coalesce(pur.qty, 0) as purchased,
  coalesce(adj.qty, 0) as adjusted,
  coalesce(sal.qty, 0) as sold,
  coalesce(dam.qty, 0) as damaged,
  coalesce(ret.qty, 0) as returned,
  (
    p.opening_stock
    + coalesce(pur.qty, 0)
    + coalesce(adj.qty, 0)
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
  select product_id, sum(qty_delta) as qty
  from stock_adjustments
  group by product_id
) adj on adj.product_id = p.id
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
