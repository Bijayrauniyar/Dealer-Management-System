/**
 * Domain hooks — Supabase only (see `isSupabaseConfigured` + `MissingSupabaseEnv`).
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { debugLog } from "@/lib/debugLog";
import { DEFAULT_BUSINESS_SETTINGS } from "@/domain/defaults";
import type {
  BusinessSettings,
  CapitalEntry,
  Customer,
  ExpenseListItem,
  OutstandingBill,
  Payment,
  PnlTotals,
  Product,
  ProductScheme,
  PurchaseListItem,
  Sale,
  Supplier,
} from "@/domain/types";
import {
  CAPITAL_QUERY_KEY,
  DOMAIN_QUERY_KEY,
  MASTER_CATALOG_QUERY_KEY,
  commitPaymentLive,
  fetchMasterCatalogLive,
  setCustomerActiveLive,
  setProductActiveLive,
  setSupplierActiveLive,
  fetchCapitalEntriesLive,
  insertCapitalEntryLive,
  commitPurchaseLive,
  commitPurchaseUpdateLive,
  commitReturnLive,
  commitSaleLive,
  commitSupplierPaymentLive,
  deriveOutstandingBills,
  fetchDomainBundle,
  fetchSaleByBillNoLive,
  peekNextBillNoLive,
  recordDamageLive,
  recordStockAdjustmentLive,
  insertSchemeLive,
  recordExpenseLive,
  upsertCustomerLive,
  fetchDashboardPeriodTotalsLive,
  fetchDailyCashBreakdownLive,
  upsertDailyCashLive,
  upsertSupplierLive,
  appendProductCategoryLive,
  appendProductUnitLive,
  removeProductCategoryLive,
} from "@/lib/live/domainLive";
import type {
  CommitPaymentOpts,
  CommitPurchaseOpts,
  CommitPurchaseUpdateOpts,
  CommitReturnOpts,
  CommitSupplierPaymentOpts,
} from "./commitTypes";

function useCapitalQuery() {
  return useQuery({
    queryKey: CAPITAL_QUERY_KEY,
    queryFn: fetchCapitalEntriesLive,
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  });
}

function useDomainBundleQuery() {
  return useQuery({
    queryKey: DOMAIN_QUERY_KEY,
    queryFn: async () => {
      try {
        const bundle = await fetchDomainBundle();
        debugLog("H5", "domainHooks.ts:fetchDomainBundle", "bundle loaded", {
          products: bundle.products.length,
          customers: bundle.customers.length,
          sales: bundle.sales.length,
        });
        return bundle;
      } catch (e) {
        debugLog("H5", "domainHooks.ts:fetchDomainBundle", "bundle failed", {
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    },
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  });
}

/** First load / refetch edge: use for bill detail so we don’t flash “not found” or crash on stale route state. */
export function useDomainBundleLoadState(): "loading" | "error" | "ready" {
  const q = useDomainBundleQuery();
  if (!isSupabaseConfigured) return "ready";
  if (q.isError) return "error";
  if (q.isPending && !q.data) return "loading";
  return "ready";
}

export function useDomainBundleErrorMessage(): string | null {
  const q = useDomainBundleQuery();
  if (!q.isError || !q.error) return null;
  return q.error instanceof Error ? q.error.message : String(q.error);
}

export function useBusinessSettings(): BusinessSettings {
  const q = useDomainBundleQuery();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data?.business ?? DEFAULT_BUSINESS_SETTINGS) : DEFAULT_BUSINESS_SETTINGS),
    [q.data?.business],
  );
}

export function usePnlTotals(): PnlTotals {
  const q = useDomainBundleQuery();
  return useMemo(
    () =>
      q.data?.pnl ?? {
        lifetimePurchases: 0,
        lifetimeExpenses: 0,
        lifetimeReturnsCredit: 0,
      },
    [q.data?.pnl],
  );
}

export function useLatestCashClosing(): number {
  const q = useDomainBundleQuery();
  return q.data?.latestCashClosing ?? 0;
}

export function useExpensesList(): ExpenseListItem[] {
  const q = useDomainBundleQuery();
  return q.data?.expenses ?? [];
}

export function usePurchasesList(): PurchaseListItem[] {
  const q = useDomainBundleQuery();
  return q.data?.purchases ?? [];
}

export function useProducts(): Product[] {
  const q = useDomainBundleQuery();
  return q.data?.products ?? [];
}

export function useCustomers(): Customer[] {
  const q = useDomainBundleQuery();
  return q.data?.customers ?? [];
}

export function useSuppliers(): Supplier[] {
  const q = useDomainBundleQuery();
  return q.data?.suppliers ?? [];
}

function useMasterCatalogQuery() {
  return useQuery({
    queryKey: MASTER_CATALOG_QUERY_KEY,
    queryFn: fetchMasterCatalogLive,
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  });
}

/** Avoid “not found” flash on master detail before catalog fetch completes. */
export function useMasterCatalogLoadState(): "loading" | "error" | "ready" {
  const q = useMasterCatalogQuery();
  if (!isSupabaseConfigured) return "ready";
  if (q.isError) return "error";
  if (q.isPending && !q.data) return "loading";
  return "ready";
}

/** DEL-1: includes archived masters for list/detail archive UI. */
export function useProductsCatalog(): Product[] {
  const q = useMasterCatalogQuery();
  return q.data?.products ?? [];
}

export function useCustomersCatalog(): Customer[] {
  const q = useMasterCatalogQuery();
  return q.data?.customers ?? [];
}

export function useSuppliersCatalog(): Supplier[] {
  const q = useMasterCatalogQuery();
  return q.data?.suppliers ?? [];
}

export function useCapitalEntries(): CapitalEntry[] {
  const q = useCapitalQuery();
  return q.data ?? [];
}

export function useSales(): Sale[] {
  const q = useDomainBundleQuery();
  return q.data?.sales ?? [];
}

export function usePayments(): Payment[] {
  const q = useDomainBundleQuery();
  return q.data?.payments ?? [];
}

export function useSchemes(): ProductScheme[] {
  const q = useDomainBundleQuery();
  return q.data?.schemes ?? [];
}

export function useOutstandingBills(): OutstandingBill[] {
  const sales = useSales();
  return useMemo(() => deriveOutstandingBills(sales), [sales]);
}

export function useSaleByBillQuery(billNo: string) {
  return useQuery({
    queryKey: ["sale-bill", billNo],
    queryFn: () => fetchSaleByBillNoLive(billNo),
    enabled: isSupabaseConfigured && Boolean(billNo),
    staleTime: 0,
  });
}

export function useSaleByBill(billNo: string): Sale | undefined {
  const q = useSaleByBillQuery(billNo);
  const data = q.data;
  // PERF-0 bundle stores headers with lines: [] — do not surface until line fetch finishes.
  if (data && data.lines.length === 0 && (q.isLoading || q.isFetching)) {
    return undefined;
  }
  return data;
}

export function getNextBillNo(): string {
  return "";
}

export function useNextBillNo(isEdit: boolean, existingBillNo?: string) {
  const [no, setNo] = useState(() => {
    if (isEdit && existingBillNo) return existingBillNo;
    return "";
  });
  useEffect(() => {
    if (isEdit && existingBillNo) {
      setNo(existingBillNo);
      return;
    }
    if (!isSupabaseConfigured) {
      setNo("");
      return;
    }
    let cancelled = false;
    void peekNextBillNoLive().then((n) => {
      if (!cancelled) setNo(n);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, existingBillNo]);
  return no;
}

export async function commitSale(sale: Sale): Promise<string> {
  const r = await commitSaleLive(sale);
  return r.billNo;
}

export async function commitPayment(opts: CommitPaymentOpts): Promise<void> {
  await commitPaymentLive(opts);
}

export async function commitReturn(opts: CommitReturnOpts): Promise<void> {
  await commitReturnLive(opts);
}

export async function commitPurchase(
  opts: CommitPurchaseOpts,
): Promise<{ purchaseNo: string; purchaseId: string }> {
  return commitPurchaseLive(opts);
}

export async function commitPurchaseUpdate(opts: CommitPurchaseUpdateOpts): Promise<{ purchaseNo: string }> {
  return commitPurchaseUpdateLive(opts);
}

export async function commitSupplierPayment(opts: CommitSupplierPaymentOpts): Promise<void> {
  await commitSupplierPaymentLive(opts);
}

export async function commitSupplier(input: {
  id?: string;
  name: string;
  phone?: string;
  address?: string;
  payable_opening?: number;
}): Promise<string> {
  return upsertSupplierLive(input);
}

/** @deprecated Use commitSupplier */
export async function commitNewSupplier(input: {
  name: string;
  phone?: string;
  address?: string;
  payable_opening?: number;
}): Promise<string> {
  return commitSupplier(input);
}

export async function commitAppendProductCategory(name: string): Promise<string[]> {
  return appendProductCategoryLive(name);
}

export async function commitAppendProductUnit(name: string): Promise<string[]> {
  return appendProductUnitLive(name);
}

export async function commitRemoveProductCategory(name: string): Promise<string[]> {
  return removeProductCategoryLive(name);
}

export async function commitDailyCashClose(input: {
  cashDate: string;
  openingBalance: number;
  closingBalance: number;
  notes?: string | null;
}): Promise<void> {
  await upsertDailyCashLive(input);
}

export async function commitStockAdjustment(input: {
  productId: string;
  qtyDelta: number;
  reason: string;
  notes?: string;
  adjustmentDate?: string;
}): Promise<void> {
  await recordStockAdjustmentLive(input);
}

export async function commitDamageEntry(input: {
  productId: string;
  qty: number;
  reason: string;
  notes?: string;
}): Promise<void> {
  await recordDamageLive({
    productId: input.productId,
    qty: input.qty,
    reason: input.reason,
    notes: input.notes,
  });
}

export async function commitSchemeEntry(input: {
  schemeName: string;
  productId: string;
  buyQty: number;
  freeQty: number;
  buyUom?: string | null;
  freeUom?: string | null;
  startDate: string;
  endDate: string;
}): Promise<void> {
  await insertSchemeLive(input);
}

export async function commitCustomer(input: {
  id?: string;
  name: string;
  phone: string;
  area: string;
  address: string;
  creditLimit: number;
  openingBalance?: number;
  panNumber?: string;
  vatNumber?: string;
}): Promise<string> {
  return upsertCustomerLive({
    id: input.id,
    name: input.name,
    phone: input.phone,
    area: input.area,
    address: input.address,
    credit_limit: input.creditLimit,
    opening_balance: input.openingBalance,
    pan_number: input.panNumber,
    vat_number: input.vatNumber,
  });
}

export async function commitSetProductActive(productId: string, active: boolean): Promise<void> {
  await setProductActiveLive(productId, active);
}

export async function commitSetCustomerActive(customerId: string, active: boolean): Promise<void> {
  await setCustomerActiveLive(customerId, active);
}

export async function commitSetSupplierActive(supplierId: string, active: boolean): Promise<void> {
  await setSupplierActiveLive(supplierId, active);
}

export async function commitExpenseEntry(input: {
  category: string;
  amount: number;
  date?: string;
  notes?: string;
}): Promise<void> {
  await recordExpenseLive({
    category: input.category,
    amount: input.amount,
    expenseDate: input.date,
    notes: input.notes,
  });
}

export async function commitCapitalEntry(input: {
  name: string;
  category: CapitalEntry["category"];
  date: string;
  amount: number;
  currentValue: number;
  notes?: string;
}): Promise<string> {
  return insertCapitalEntryLive({
    name: input.name,
    category: input.category,
    entry_date: input.date,
    amount: input.amount,
    current_value: input.currentValue,
    notes: input.notes,
  });
}

/** Dashboard period KPIs (purchases, expenses, returns, damage qty). */
export function useDashboardPeriodTotals(from: string, to: string) {
  return useQuery({
    queryKey: ["dashboard-period", from, to],
    queryFn: () => fetchDashboardPeriodTotalsLive(from, to),
    enabled: isSupabaseConfigured && Boolean(from) && Boolean(to),
    staleTime: 15_000,
  });
}

/** Sum of Cash-mode lines for one day (opening from last close before `cashDate`). */
export function useDailyCashBreakdown(cashDate: string) {
  return useQuery({
    queryKey: ["daily-cash-breakdown", cashDate],
    queryFn: () => fetchDailyCashBreakdownLive(cashDate),
    enabled: isSupabaseConfigured && Boolean(cashDate),
    staleTime: 10_000,
  });
}
