/**
 * Unified domain hooks: Supabase when configured, else demo appStore.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { debugLog } from "@/lib/debugLog";
import {
  BUSINESS,
  type BusinessSettings,
  type CapitalEntry,
  type Customer,
  OutstandingBill,
  Payment,
  Product,
  Sale,
  Supplier,
} from "@/data/dummy";
import * as Demo from "./appStore";
import {
  CAPITAL_QUERY_KEY,
  DOMAIN_QUERY_KEY,
  commitPaymentLive,
  fetchCapitalEntriesLive,
  insertCapitalEntryLive,
  commitPurchaseLive,
  commitReturnLive,
  commitSaleLive,
  commitSupplierPaymentLive,
  deriveOutstandingBills,
  fetchDomainBundle,
  peekNextBillNoLive,
  recordDamageLive,
  recordExpenseLive,
  upsertCustomerLive,
} from "@/lib/live/domainLive";
import type { CommitPaymentOpts, CommitPurchaseOpts, CommitReturnOpts, CommitSupplierPaymentOpts } from "./appStore";

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
        // #region agent log
        debugLog("H5", "domainHooks.ts:fetchDomainBundle", "bundle loaded", {
          products: bundle.products.length,
          customers: bundle.customers.length,
          sales: bundle.sales.length,
        });
        // #endregion
        return bundle;
      } catch (e) {
        // #region agent log
        debugLog("H5", "domainHooks.ts:fetchDomainBundle", "bundle failed", {
          error: e instanceof Error ? e.message : String(e),
        });
        // #endregion
        throw e;
      }
    },
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  });
}

/** Live: from `tenant_settings`. Demo: static `BUSINESS` in dummy.ts. */
export function useBusinessSettings(): BusinessSettings {
  const q = useDomainBundleQuery();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data?.business ?? BUSINESS) : BUSINESS),
    [q.data?.business],
  );
}

export function useProducts(): Product[] {
  const q = useDomainBundleQuery();
  const demo = Demo.useProducts();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data?.products ?? []) : demo),
    [q.data?.products, demo],
  );
}

export function useCustomers(): Customer[] {
  const q = useDomainBundleQuery();
  const demo = Demo.useCustomers();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data?.customers ?? []) : demo),
    [q.data?.customers, demo],
  );
}

export function useSuppliers(): Supplier[] {
  const q = useDomainBundleQuery();
  const demo = Demo.useSuppliers();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data?.suppliers ?? []) : demo),
    [q.data?.suppliers, demo],
  );
}

export function useCapitalEntries(): CapitalEntry[] {
  const q = useCapitalQuery();
  const demo = Demo.useCapitalEntries();
  return useMemo(
    () => (isSupabaseConfigured ? (q.data ?? []) : demo),
    [q.data, demo],
  );
}

export function useSales(): Sale[] {
  const q = useDomainBundleQuery();
  const demo = Demo.useSales();
  return useMemo(() => (isSupabaseConfigured ? (q.data?.sales ?? []) : demo), [q.data?.sales, demo]);
}

export function usePayments(): Payment[] {
  const q = useDomainBundleQuery();
  const demo = Demo.usePayments();
  return useMemo(() => (isSupabaseConfigured ? (q.data?.payments ?? []) : demo), [q.data?.payments, demo]);
}

export function useOutstandingBills(): OutstandingBill[] {
  const q = useDomainBundleQuery();
  const demoObs = Demo.useOutstandingBills();
  const sales = useSales();
  return useMemo(() => {
    if (isSupabaseConfigured) return deriveOutstandingBills(sales);
    return demoObs;
  }, [sales, demoObs]);
}

export function useSaleByBill(billNo: string): Sale | undefined {
  const sales = useSales();
  return useMemo(() => sales.find((s) => s.billNo === billNo), [sales, billNo]);
}

/** Demo: sync. Live: call before opening new sale form (or use useNextBillNo hook). */
export function getNextBillNo(): string {
  if (!isSupabaseConfigured) return Demo.getNextBillNo();
  return "";
}

/** For new bills in live mode — fetches next number from DB. */
export function useNextBillNo(isEdit: boolean, existingBillNo?: string) {
  const [no, setNo] = useState(() => {
    if (isEdit && existingBillNo) return existingBillNo;
    if (!isSupabaseConfigured) return Demo.getNextBillNo();
    return "";
  });
  useEffect(() => {
    if (isEdit && existingBillNo) {
      setNo(existingBillNo);
      return;
    }
    if (!isSupabaseConfigured) {
      setNo(Demo.getNextBillNo());
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
  if (!isSupabaseConfigured) {
    Demo.commitSale(sale);
    return sale.billNo;
  }
  const r = await commitSaleLive(sale);
  return r.billNo;
}

export async function commitPayment(opts: CommitPaymentOpts): Promise<void> {
  if (!isSupabaseConfigured) {
    Demo.commitPayment(opts);
    return;
  }
  await commitPaymentLive(opts);
}

export async function commitReturn(opts: CommitReturnOpts): Promise<void> {
  if (!isSupabaseConfigured) {
    Demo.commitReturn(opts);
    return;
  }
  await commitReturnLive(opts);
}

export async function commitPurchase(opts: CommitPurchaseOpts): Promise<void> {
  if (!isSupabaseConfigured) {
    Demo.commitPurchase(opts);
    return;
  }
  await commitPurchaseLive(opts);
}

export async function commitSupplierPayment(opts: CommitSupplierPaymentOpts): Promise<void> {
  if (!isSupabaseConfigured) {
    Demo.commitSupplierPayment(opts);
    return;
  }
  await commitSupplierPaymentLive(opts);
}

export { resetToSeed } from "./appStore";

export async function commitDamageEntry(input: {
  productId: string;
  qty: number;
  reason: string;
  notes?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  await recordDamageLive({
    productId: input.productId,
    qty: input.qty,
    reason: input.reason,
    notes: input.notes,
  });
}

export async function commitCustomer(input: {
  id?: string;
  name: string;
  phone: string;
  area: string;
  address: string;
  creditLimit: number;
  openingBalance?: number;
}): Promise<string> {
  if (!isSupabaseConfigured) {
    return Demo.commitCustomer({ ...input, panNumber: "" });
  }
  return upsertCustomerLive({
    id: input.id,
    name: input.name,
    phone: input.phone,
    area: input.area,
    address: input.address,
    credit_limit: input.creditLimit,
    opening_balance: input.openingBalance,
  });
}

export async function commitExpenseEntry(input: {
  category: string;
  amount: number;
  notes?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  await recordExpenseLive({ category: input.category, amount: input.amount, notes: input.notes });
}

export async function commitCapitalEntry(input: {
  name: string;
  category: CapitalEntry["category"];
  date: string;
  amount: number;
  currentValue: number;
  notes?: string;
}): Promise<string> {
  if (!isSupabaseConfigured) {
    return Demo.commitCapitalEntry(input);
  }
  return insertCapitalEntryLive({
    name: input.name,
    category: input.category,
    entry_date: input.date,
    amount: input.amount,
    current_value: input.currentValue,
    notes: input.notes,
  });
}

export { useAppState } from "./appStore";
