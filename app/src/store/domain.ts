/** Domain data: demo `appStore` or live Supabase (see `domainHooks.ts`). */
export {
  useBusinessSettings,
  useProducts,
  useCustomers,
  useSuppliers,
  useCapitalEntries,
  useSales,
  usePayments,
  useOutstandingBills,
  useSaleByBill,
  useAppState,
  getNextBillNo,
  useNextBillNo,
  commitSale,
  commitPayment,
  commitReturn,
  commitPurchase,
  commitSupplierPayment,
  resetToSeed,
  commitDamageEntry,
  commitExpenseEntry,
  commitCustomer,
  commitCapitalEntry,
} from "./domainHooks";
export type { AppState, CommitPaymentOpts, CommitPurchaseOpts, CommitReturnOpts, CommitSupplierPaymentOpts } from "./appStore";
export { upsertProductLive } from "@/lib/live/domainLive";
