-- =============================================================================
-- Purge ONE tenant’s operational + master data (Supabase SQL Editor)
-- =============================================================================
-- Same scope as: npm run tenant:reset-data / scripts/lib/tenant-purge.mjs
--
-- Keeps:  auth.users, public.tenants, public.tenant_users, public.tenant_settings
-- Deletes: bills, payments, products, customers, suppliers, … for ONE tenant_id only.
--
-- Steps:
--   1. In SQL Editor, find your UUID:
--        select id, business_name, status from public.tenants;
--   2. Paste it into v_tenant below (replace the placeholder).
--   3. Run the whole script (one transaction).
--
-- Safe for production: other tenants are untouched (every DELETE filters tenant_id).
-- =============================================================================

DO $$
DECLARE
  v_tenant uuid := '00000000-0000-0000-0000-000000000000'::uuid;  -- <-- REPLACE with your tenants.id
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tenant) THEN
    RAISE EXCEPTION 'Unknown tenant id %. Run: select id, business_name from public.tenants;', v_tenant;
  END IF;

  DELETE FROM public.supplier_payments WHERE tenant_id = v_tenant;
  DELETE FROM public.returns           WHERE tenant_id = v_tenant;
  DELETE FROM public.damages           WHERE tenant_id = v_tenant;
  DELETE FROM public.payments          WHERE tenant_id = v_tenant;
  DELETE FROM public.sales_bills       WHERE tenant_id = v_tenant;  -- cascades sales_items
  DELETE FROM public.expenses          WHERE tenant_id = v_tenant;
  DELETE FROM public.scheme_tracker    WHERE tenant_id = v_tenant;
  DELETE FROM public.capital_entry_audit WHERE tenant_id = v_tenant;
  DELETE FROM public.capital_entries   WHERE tenant_id = v_tenant;
  DELETE FROM public.salesman_targets  WHERE tenant_id = v_tenant;
  DELETE FROM public.vehicle_log      WHERE tenant_id = v_tenant;
  DELETE FROM public.daily_cash       WHERE tenant_id = v_tenant;
  DELETE FROM public.freezers         WHERE tenant_id = v_tenant;
  DELETE FROM public.beat_plans        WHERE tenant_id = v_tenant;
  DELETE FROM public.purchases         WHERE tenant_id = v_tenant;  -- cascades purchase_items
  DELETE FROM public.products          WHERE tenant_id = v_tenant;
  DELETE FROM public.customers         WHERE tenant_id = v_tenant;
  DELETE FROM public.suppliers         WHERE tenant_id = v_tenant;
END $$;

-- Optional: confirm empty domain rows for that tenant
-- select 'sales_bills', (select count(*) from public.sales_bills where tenant_id = 'YOUR-UUID')
-- union all select 'products', (select count(*) from public.products where tenant_id = 'YOUR-UUID');
