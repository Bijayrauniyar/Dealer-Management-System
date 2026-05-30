import type { Customer, Product } from "@/domain/types";
import { isLowStock } from "@/lib/stockAlert";

export function normalizeCategory(cat: string | undefined | null): string {
  return (cat ?? "").trim();
}

export function matchesProductSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    normalizeCategory(p.category).toLowerCase().includes(q) ||
    p.uom.toLowerCase().includes(q)
  );
}

export function matchesCustomerSearch(c: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    c.name.toLowerCase().includes(q) ||
    c.area.toLowerCase().includes(q) ||
    (c.phone ?? "").toLowerCase().includes(q)
  );
}

export type ProductSort =
  | "stock_asc"
  | "stock_desc"
  | "name_asc"
  | "name_desc"
  | "sell_asc"
  | "sell_desc";

export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const out = [...list];
  switch (sort) {
    case "name_asc":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return out.sort((a, b) => b.name.localeCompare(a.name));
    case "sell_asc":
      return out.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case "sell_desc":
      return out.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case "stock_desc":
      return out.sort((a, b) => b.onHand - a.onHand);
    case "stock_asc":
    default:
      return out.sort((a, b) => a.onHand - b.onHand);
  }
}

export type CustomerSort = "dues_desc" | "dues_asc" | "name_asc" | "name_desc";

export function sortCustomers(list: Customer[], sort: CustomerSort): Customer[] {
  const out = [...list];
  switch (sort) {
    case "dues_asc":
      return out.sort((a, b) => a.outstanding - b.outstanding);
    case "name_asc":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return out.sort((a, b) => b.name.localeCompare(a.name));
    case "dues_desc":
    default:
      return out.sort((a, b) => b.outstanding - a.outstanding);
  }
}

export function productCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const c = normalizeCategory(p.category);
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Distinct customer areas (locality / route), sorted A–Z. */
export function customerAreas(customers: Customer[]): string[] {
  const set = new Set<string>();
  for (const c of customers) {
    const a = (c.area ?? "").trim();
    if (a) set.add(a);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterHint(parts: string[]): string | null {
  const active = parts.filter(Boolean);
  return active.length ? active.join(" · ") : null;
}

export { isLowStock };
