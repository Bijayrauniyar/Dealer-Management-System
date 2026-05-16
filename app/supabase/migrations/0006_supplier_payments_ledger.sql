-- Ledger rows for supplier payments (for daily cash and audit).
-- apply_supplier_payment still applies FIFO to purchases; this table records each payment event.

create table if not exists supplier_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  payment_date date not null,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  mode text not null default 'Cash' check (mode in ('Cash','UPI','Cheque','Bank','Other')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_supplier_payments_tenant_date on supplier_payments(tenant_id, payment_date);

alter table supplier_payments enable row level security;

drop policy if exists supplier_payments_all on supplier_payments;
create policy supplier_payments_all on supplier_payments
for all
using (tenant_id = current_tenant_id() or is_super_admin())
with check (tenant_id = current_tenant_id() or is_super_admin());

grant select, insert, update, delete on supplier_payments to authenticated;
