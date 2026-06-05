-- BILL-QR-1: enable toggle + private Storage object path for payment QR
alter table tenant_settings
  add column if not exists sales_bill_qr_enabled boolean not null default false,
  add column if not exists sales_bill_qr_object_path text;

comment on column tenant_settings.sales_bill_qr_enabled is 'When true, print payment QR block on balance-due sales bills (if QR image exists)';
comment on column tenant_settings.sales_bill_qr_object_path is 'Private Storage path in tenant-assets bucket, e.g. {tenant_id}/sales-bill-payment-qr.png';

-- Private bucket: one folder per tenant_id (first path segment)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-assets',
  'tenant-assets',
  false,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Tenant-scoped read/write for payment QR and future tenant files under {tenant_id}/*
create policy tenant_assets_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy tenant_assets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy tenant_assets_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  )
  with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy tenant_assets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
