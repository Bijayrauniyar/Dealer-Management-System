-- Optional second address line on printed bills: district · province · country
alter table tenant_settings
  add column if not exists show_district_province_on_bill boolean not null default false;
