-- Rows per page on browse lists (customers, products, stock, suppliers, etc.).

alter table tenant_settings
  add column if not exists list_page_size int not null default 10;

comment on column tenant_settings.list_page_size is
  'Default rows per page on in-app browse lists; user can change in Settings.';

alter table tenant_settings drop constraint if exists tenant_settings_list_page_size_check;
alter table tenant_settings add constraint tenant_settings_list_page_size_check
  check (list_page_size in (10, 20, 50, 100));
