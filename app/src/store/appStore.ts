/**
 * Havmor Demo Store
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency reactive store using React 18's useSyncExternalStore.
 * API is intentionally Zustand-compatible — swap line 1 of each selector hook
 * with `import { create } from 'zustand'` when the real Supabase backend lands.
 *
 * Persistence: every mutation is saved to localStorage key "havmor-demo-v1".
 * Data survives page refresh / browser close for ~4-5 days of demo use.
 *
 * Reset: call appStore.reset() (wired to Settings → "Reset demo data" button).
 */

import { useSyncExternalStore } from "react";
import {
  SALES         as SEED_SALES,
  PRODUCTS      as SEED_PRODUCTS,
  CUSTOMERS     as SEED_CUSTOMERS,
  OUTSTANDING_BILLS as SEED_OB,
  PAYMENTS      as SEED_PAYMENTS,
  SUPPLIERS     as SEED_SUPPLIERS,
  CAPITAL_ENTRIES as SEED_CAPITAL,
  BUSINESS,
  type Sale,
  type CapitalEntry,
  type Product,
  type Customer,
  type Supplier,
  type OutstandingBill,
  type Payment,
  type BillStatus,
} from "@/data/dummy";

// ─── State shape ──────────────────────────────────────────────────────────────
export interface AppState {
  sales:            Sale[];
  salesByBill:      Record<string, Sale>;
  products:         Product[];
  customers:        Customer[];
  outstandingBills: OutstandingBill[];
  payments:         Payment[];
  suppliers:        Supplier[];
  capitalEntries:   CapitalEntry[];
}

// ─── Action argument types ────────────────────────────────────────────────────
export interface CommitPaymentOpts {
  customerId:  string;
  amount:      number;
  mode:        string;
  reference:   string;
  date:        string;
  allocations: { saleId: string; amount: number; billNo: string }[];
}

export interface CommitReturnOpts {
  customerId:   string;
  saleId:       string;
  billNo:       string;
  creditAmount: number;
  lines:        { productId: string; returnQty: number }[];
}

export interface CommitPurchaseOpts {
  supplierId:    string;
  lines:         { productId: string; receivedQty: number; cost: number }[];
  totalReceived: number;
}

// ─── Seed (deep clone so mutations never touch original arrays) ───────────────
const makeSeed = (): AppState => {
  const sales     = JSON.parse(JSON.stringify(SEED_SALES)) as Sale[];
  const salesByBill = Object.fromEntries(sales.map((s) => [s.billNo, s]));
  return {
    sales,
    salesByBill,
    products:         JSON.parse(JSON.stringify(SEED_PRODUCTS)),
    customers:        JSON.parse(JSON.stringify(SEED_CUSTOMERS)),
    outstandingBills: JSON.parse(JSON.stringify(SEED_OB)),
    payments:         JSON.parse(JSON.stringify(SEED_PAYMENTS)),
    suppliers:        JSON.parse(JSON.stringify(SEED_SUPPLIERS)),
    capitalEntries:   JSON.parse(JSON.stringify(SEED_CAPITAL)),
  };
};

const STORAGE_KEY = "havmor-demo-v1";

const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Rebuild salesByBill index on hydration (it's derived, not serialised)
      parsed.salesByBill = Object.fromEntries(parsed.sales.map((s) => [s.billNo, s]));
      if (!parsed.capitalEntries?.length) {
        parsed.capitalEntries = JSON.parse(JSON.stringify(SEED_CAPITAL));
      }
      return parsed;
    }
  } catch {
    /* ignore parse errors */
  }
  return makeSeed();
};

// ─── Mini-store engine (useSyncExternalStore compatible) ─────────────────────
type Listener = () => void;

let state: AppState = loadState();
const listeners     = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

const save = (next: AppState) => {
  state = next;
  try {
    // Don't serialise salesByBill (derived) — saves space
    const { salesByBill: _, ...persisted } = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch { /* quota exceeded — ignore */ }
  notify();
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export const getNextBillNo = (): string => {
  const nums = state.sales
    .map((s) => parseInt(s.billNo.replace(/\D+/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${BUSINESS.invoicePrefix}-${next}`;
};

export const commitSale = (sale: Sale): void => {
  const oldSale = state.sales.find((s) => s.billNo === sale.billNo);

  // Restore old stock then apply new stock
  const products = state.products.map((p) => {
    let onHand = p.onHand;
    if (oldSale) {
      const ol = oldSale.lines.find((l) => l.productId === p.id);
      if (ol) onHand += ol.qty;                          // restore
    }
    const nl = sale.lines.find((l) => l.productId === p.id);
    if (nl) onHand = Math.max(0, onHand - nl.qty);       // decrement
    return onHand !== p.onHand ? { ...p, onHand } : p;
  });

  // Restore old customer outstanding then apply new
  const customers = state.customers.map((c) => {
    let outstanding = c.outstanding;
    if (oldSale && c.id === oldSale.customerId) {
      const oldOb = state.outstandingBills.find((b) => b.billNo === sale.billNo);
      if (oldOb) outstanding = Math.max(0, outstanding - oldOb.balance);
    }
    if (c.id === sale.customerId && sale.balance > 0) outstanding += sale.balance;
    return outstanding !== c.outstanding ? { ...c, outstanding } : c;
  });

  const today = new Date().toISOString().slice(0, 10);
  const newOb: OutstandingBill = {
    id:          `ob-${sale.billNo}`,
    saleId:      sale.id,
    customerId:  sale.customerId,
    billNo:      sale.billNo,
    billDate:    sale.date,
    dueDate:     sale.dueDate || today,
    billTotal:   sale.grandTotal,
    paidAmount:  sale.paidNow,
    balance:     sale.balance,
    status: (sale.balance === 0 ? "paid" : sale.paidNow > 0 ? "partial" : "current") as BillStatus,
  };

  const sales            = [...state.sales.filter((s) => s.billNo !== sale.billNo), sale];
  const outstandingBills = [...state.outstandingBills.filter((b) => b.billNo !== sale.billNo), newOb];
  const salesByBill      = { ...state.salesByBill, [sale.billNo]: sale };

  save({ ...state, sales, salesByBill, products, customers, outstandingBills });
};

export const commitPayment = (opts: CommitPaymentOpts): void => {
  let remaining = opts.amount;
  /** Actual NPR applied per sale (may be less than UI preview `alloc.amount` if user pays less than total allocated) */
  const appliedBySaleId = new Map<string, number>();

  const outstandingBills = state.outstandingBills.map((ob) => {
    const alloc = opts.allocations.find((a) => a.saleId === ob.saleId);
    if (!alloc || remaining <= 0 || ob.balance <= 0) return ob;
    const applied = Math.min(alloc.amount, ob.balance, remaining);
    remaining    -= applied;
    appliedBySaleId.set(ob.saleId, (appliedBySaleId.get(ob.saleId) ?? 0) + applied);
    const newBal  = Math.max(0, ob.balance - applied);
    return {
      ...ob,
      balance:     newBal,
      paidAmount:  ob.paidAmount + applied,
      status:      (newBal === 0 ? "paid" : "partial") as BillStatus,
    };
  });

  // Mirror balances on Sale objects (paidNow += actually applied, not preview alloc.amount)
  const salesByBill = { ...state.salesByBill };
  opts.allocations.forEach((alloc) => {
    const applied = appliedBySaleId.get(alloc.saleId) ?? 0;
    if (applied <= 0) return;
    const ob   = outstandingBills.find((b) => b.saleId === alloc.saleId);
    const sale = salesByBill[alloc.billNo];
    if (ob && sale) {
      salesByBill[alloc.billNo] = { ...sale, balance: ob.balance, paidNow: sale.paidNow + applied };
    }
  });
  const sales = state.sales.map((s) => salesByBill[s.billNo] ?? s);

  const totalApplied = opts.amount - remaining;
  const customers = state.customers.map((c) =>
    c.id === opts.customerId
      ? { ...c, outstanding: Math.max(0, c.outstanding - totalApplied) }
      : c,
  );

  const newPayment: Payment = {
    id:           `pmt-${Date.now()}`,
    date:         opts.date,
    customerId:   opts.customerId,
    customerName: state.customers.find((c) => c.id === opts.customerId)?.name ?? "",
    amount:       opts.amount,
    mode:         opts.mode,
    reference:    opts.reference,
    billNo:       opts.allocations.map((a) => a.billNo).join(", "),
  };

  save({ ...state, outstandingBills, salesByBill, sales, customers, payments: [...state.payments, newPayment] });
};

export const commitReturn = (opts: CommitReturnOpts): void => {
  // Restore stock for returned items
  const products = state.products.map((p) => {
    const line = opts.lines.find((l) => l.productId === p.id);
    if (!line || line.returnQty <= 0) return p;
    return { ...p, onHand: p.onHand + line.returnQty };
  });

  const prevOb = state.outstandingBills.find((b) => b.saleId === opts.saleId && b.billNo === opts.billNo);
  const creditApplied = prevOb ? Math.min(opts.creditAmount, prevOb.balance) : 0;

  // Reduce bill outstanding by credit (capped at open balance on that bill)
  const outstandingBills = state.outstandingBills.map((ob) => {
    if (ob.saleId !== opts.saleId || ob.balance <= 0) return ob;
    const applied = Math.min(opts.creditAmount, ob.balance);
    const newBal  = Math.max(0, ob.balance - applied);
    return {
      ...ob,
      balance:    newBal,
      paidAmount: ob.paidAmount + applied,
      status:     (newBal === 0 ? "paid" : "partial") as BillStatus,
    };
  });

  const ob = outstandingBills.find((b) => b.billNo === opts.billNo);
  const salesByBill = { ...state.salesByBill };
  const sale = salesByBill[opts.billNo];
  if (sale && ob) {
    salesByBill[opts.billNo] = { ...sale, balance: ob.balance, paidNow: sale.paidNow + creditApplied };
  }
  const sales = state.sales.map((s) => salesByBill[s.billNo] ?? s);

  // Reduce customer outstanding by amount actually applied to the bill
  const customers = state.customers.map((c) =>
    c.id === opts.customerId
      ? { ...c, outstanding: Math.max(0, c.outstanding - creditApplied) }
      : c,
  );

  save({ ...state, products, outstandingBills, salesByBill, sales, customers });
};

export const commitPurchase = (opts: CommitPurchaseOpts): void => {
  const products = state.products.map((p) => {
    const line = opts.lines.find((l) => l.productId === p.id);
    if (!line || line.receivedQty <= 0) return p;
    return { ...p, onHand: p.onHand + line.receivedQty, costPrice: line.cost };
  });

  const suppliers = state.suppliers.map((s) =>
    s.id === opts.supplierId && opts.totalReceived > 0
      ? { ...s, outstanding: s.outstanding + opts.totalReceived }
      : s,
  );

  save({ ...state, products, suppliers });
};

export interface CommitSupplierPaymentOpts {
  supplierId: string;
  amount: number;
}

export const commitSupplierPayment = (opts: CommitSupplierPaymentOpts): void => {
  const suppliers = state.suppliers.map((s) =>
    s.id === opts.supplierId && opts.amount > 0
      ? { ...s, outstanding: Math.max(0, s.outstanding - opts.amount) }
      : s,
  );
  save({ ...state, suppliers });
};

export function commitCustomer(input: {
  id?: string;
  name: string;
  phone: string;
  area: string;
  address: string;
  creditLimit: number;
  openingBalance?: number;
  panNumber?: string;
}): string {
  const state = getSnapshot();
  if (input.id) {
    const customers = state.customers.map((c) =>
      c.id === input.id
        ? {
            ...c,
            name: input.name,
            phone: input.phone,
            area: input.area,
            address: input.address,
            creditLimit: input.creditLimit,
            panNumber: input.panNumber ?? c.panNumber,
          }
        : c,
    );
    save({ ...state, customers });
    return input.id;
  }
  const id = `c-${Date.now()}`;
  const customer: Customer = {
    id,
    name: input.name,
    phone: input.phone,
    area: input.area,
    address: input.address,
    panNumber: input.panNumber ?? "",
    creditLimit: input.creditLimit,
    outstanding: input.openingBalance ?? 0,
    oldestBillDays: 0,
  };
  save({ ...state, customers: [...state.customers, customer] });
  return id;
}

export function commitCapitalEntry(input: {
  name: string;
  category: CapitalEntry["category"];
  date: string;
  amount: number;
  currentValue: number;
  notes?: string;
}): string {
  const state = getSnapshot();
  const id = `ca-${Date.now()}`;
  const entry: CapitalEntry = {
    id,
    name: input.name,
    category: input.category,
    date: input.date,
    amount: input.amount,
    currentValue: input.currentValue,
    notes: input.notes ?? "",
  };
  save({ ...state, capitalEntries: [...state.capitalEntries, entry] });
  return id;
}

export const resetToSeed = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  save(makeSeed());
};

// ─── useSyncExternalStore subscriptions ──────────────────────────────────────
const subscribe     = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot   = () => state;

// ─── Typed selector hooks (use these in components) ──────────────────────────
export const useProducts         = () => useSyncExternalStore(subscribe, () => getSnapshot().products);
export const useCustomers        = () => useSyncExternalStore(subscribe, () => getSnapshot().customers);
export const useSales            = () => useSyncExternalStore(subscribe, () => getSnapshot().sales);
export const useOutstandingBills = () => useSyncExternalStore(subscribe, () => getSnapshot().outstandingBills);
export const usePayments         = () => useSyncExternalStore(subscribe, () => getSnapshot().payments);
export const useSuppliers        = () => useSyncExternalStore(subscribe, () => getSnapshot().suppliers);
export const useCapitalEntries   = () => useSyncExternalStore(subscribe, () => getSnapshot().capitalEntries);
export const useSaleByBill       = (billNo: string) =>
  useSyncExternalStore(subscribe, () => getSnapshot().salesByBill[billNo ?? ""]);

/** Raw low-level hook for custom selectors */
export const useAppState = <T>(selector: (s: AppState) => T): T =>
  useSyncExternalStore(subscribe, () => selector(getSnapshot()));
