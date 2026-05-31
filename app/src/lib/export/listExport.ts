import type { Customer, Product } from "@/domain/types";
import { CUSTOMER_COLUMNS, plainRow, PRODUCT_COLUMNS } from "@/lib/export/columns";
import { downloadCsv } from "@/lib/export/csv";
import type { CsvRow } from "@/lib/export/types";
import { toDateInput } from "@/lib/utils";

export function productsToCsvRows(products: Product[], includeCost = true): CsvRow[] {
  return products.map((p) =>
    plainRow({
      product_id: p.id,
      code: "",
      name: p.name,
      category: p.category,
      unit: p.uom,
      purchase_price: includeCost ? p.costPrice : "",
      sale_price: p.sellingPrice,
      mrp: p.mrp,
      opening_stock: p.openingStock ?? 0,
      on_hand: p.onHand,
      active: "yes",
    }),
  );
}

export function customersToCsvRows(customers: Customer[]): CsvRow[] {
  return customers.map((c) =>
    plainRow({
      customer_id: c.id,
      name: c.name,
      phone: c.phone ?? "",
      area: c.area ?? "",
      address: c.address ?? "",
      credit_limit: c.creditLimit,
      outstanding: c.outstanding,
    }),
  );
}

/** Slug for export filename from active filter labels. */
export function exportFilterSlug(parts: (string | undefined)[]): string {
  return parts
    .map((p) =>
      (p ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("-")
    .slice(0, 60);
}

export function downloadFilteredProducts(products: Product[], filterSlug: string): void {
  if (products.length === 0) return;
  const rows = productsToCsvRows(products, true);
  const suffix = filterSlug ? `-${filterSlug}` : "";
  downloadCsv(`products-filtered${suffix}-${toDateInput(new Date())}`, rows, [...PRODUCT_COLUMNS]);
}

export function downloadFilteredCustomers(customers: Customer[], filterSlug: string): void {
  if (customers.length === 0) return;
  const rows = customersToCsvRows(customers);
  const suffix = filterSlug ? `-${filterSlug}` : "";
  downloadCsv(`customers-filtered${suffix}-${toDateInput(new Date())}`, rows, [...CUSTOMER_COLUMNS]);
}
