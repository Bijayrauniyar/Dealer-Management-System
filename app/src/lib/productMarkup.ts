import type { Product } from "@/domain/types";
import { purchasePriceExclFromProduct } from "@/lib/tax";

/**
 * Markup % on cost — buy excl. VAT → sell excl. VAT (same as product form).
 * DB `purchase_price` is VAT-inclusive; `sale_price` is excl. VAT on bills.
 */
export function productMarkupOnCostPct(
  product: Pick<Product, "costPrice" | "sellingPrice">,
  vatPct: number,
): number {
  const buyExcl = purchasePriceExclFromProduct(product.costPrice, vatPct);
  if (buyExcl <= 0) return 0;
  return Math.round(((product.sellingPrice - buyExcl) / buyExcl) * 100);
}
