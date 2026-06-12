-- MRP sticker designs: saved label designs for A4 sticker sheet printing (history + reprint).

create table if not exists mrp_sticker_designs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  lines jsonb not null default '[]'::jsonb,
  width_mm numeric(6,1) not null default 45,
  height_mm numeric(6,1) not null default 25,
  title_size numeric(5,1) not null default 14,
  line_size numeric(5,1) not null default 8,
  title_bold boolean not null default true,
  border boolean not null default true,
  qty integer not null default 65,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_printed_at timestamptz
);

comment on table mrp_sticker_designs is
  'Saved MRP sticker label designs; printed as repeated grid on A4 (one design per page).';

-- Idempotent for installs that ran the first version of this file.
alter table mrp_sticker_designs
  add column if not exists align text not null default 'center'
  check (align in ('left', 'center', 'right'));

create index if not exists idx_mrp_sticker_tenant_updated
  on mrp_sticker_designs(tenant_id, updated_at desc);

alter table mrp_sticker_designs enable row level security;

drop policy if exists mrp_sticker_designs_all on mrp_sticker_designs;
create policy mrp_sticker_designs_all on mrp_sticker_designs
  for all
  using (tenant_id = current_tenant_id() or is_super_admin())
  with check (tenant_id = current_tenant_id() or is_super_admin());
