import type { ProductScheme } from "@/domain/types";

export type SaleDraftLine = {
  id: number;
  productId: string;
  productName: string;
  uom: string;
  qty: number;
  mrp: number;
  rate: number;
  discountPct: number;
  isSchemeFree?: boolean;
  schemePaidLineId?: number;
  schemeName?: string;
};

export function isSchemeActiveOnDate(scheme: ProductScheme, billDate: string): boolean {
  if (!scheme.isActive) return false;
  const d = billDate.slice(0, 10);
  return d >= scheme.startDate && d <= scheme.endDate;
}

/** Free units earned for paid qty under buy-X-get-Y. */
export function schemeFreeQtyForPaid(paidQty: number, buyQty: number, freeQty: number): number {
  const buy = Number(buyQty) || 0;
  const free = Number(freeQty) || 0;
  const paid = Number(paidQty) || 0;
  if (buy < 1 || free < 1 || paid < buy) return 0;
  return Math.floor(paid / buy) * free;
}

export function schemeMatchesPaidUom(scheme: ProductScheme, paidUom: string): boolean {
  const required = scheme.buyUom?.trim();
  if (!required) return true;
  return paidUom.trim() === required;
}

export function pickBestScheme(
  schemes: ProductScheme[],
  productId: string,
  billDate: string,
  paidUom?: string,
): ProductScheme | null {
  if (!productId) return null;
  const eligible = schemes.filter(
    (s) =>
      s.productId === productId &&
      isSchemeActiveOnDate(s, billDate) &&
      (!paidUom || schemeMatchesPaidUom(s, paidUom)),
  );
  if (!eligible.length) return null;
  return [...eligible].sort((a, b) => {
    const ratioA = a.freeQty / a.buyQty;
    const ratioB = b.freeQty / b.buyQty;
    if (ratioB !== ratioA) return ratioB - ratioA;
    return b.endDate.localeCompare(a.endDate);
  })[0]!;
}

/** True when this product has at least one active scheme on the given date. */
export function productHasActiveScheme(
  schemes: ProductScheme[],
  productId: string,
  billDate: string,
): boolean {
  return pickBestScheme(schemes, productId, billDate) != null;
}

export function schemeSummaryLabel(scheme: ProductScheme): string {
  const buyU = scheme.buyUom?.trim();
  const freeU = scheme.freeUom?.trim();
  if (buyU || freeU) {
    const buyPart = buyU ? `${scheme.buyQty} ${buyU}` : String(scheme.buyQty);
    const freePart = freeU ? `${scheme.freeQty} ${freeU}` : String(scheme.freeQty);
    return `Buy ${buyPart} get ${freePart} free`;
  }
  return `Buy ${scheme.buyQty} get ${scheme.freeQty} free`;
}

export function freeLineUomForScheme(scheme: ProductScheme, paidUom: string): string {
  return scheme.freeUom?.trim() || paidUom;
}

/** Product IDs with a scheme active on `billDate` (for home filter / badges). */
export function productIdsWithActiveSchemes(schemes: ProductScheme[], billDate: string): Set<string> {
  const ids = new Set<string>();
  for (const s of schemes) {
    if (s.productId && isSchemeActiveOnDate(s, billDate)) {
      ids.add(s.productId);
    }
  }
  return ids;
}

function nextLineId(lines: SaleDraftLine[]): number {
  const max = lines.reduce((m, l) => Math.max(m, l.id), 0);
  return max + 1;
}

/**
 * After paid-line edits, insert/update/remove scheme free lines (rate 0) linked to paid rows.
 */
export function syncSchemeFreeLines(
  lines: SaleDraftLine[],
  schemes: ProductScheme[],
  billDate: string,
): SaleDraftLine[] {
  if (!schemes.length) {
    if (!lines.some((l) => l.isSchemeFree)) return lines;
    return lines.filter((l) => !l.isSchemeFree);
  }

  const paidLines = lines.filter((l) => !l.isSchemeFree && l.productId);
  const freeByPaid = new Map<number, SaleDraftLine>();
  for (const l of lines) {
    if (l.isSchemeFree && l.schemePaidLineId != null) {
      freeByPaid.set(l.schemePaidLineId, l);
    }
  }

  const out: SaleDraftLine[] = [];

  for (const paid of paidLines) {
    out.push(paid);
    const scheme = pickBestScheme(schemes, paid.productId, billDate, paid.uom);
    const freeQty = scheme ? schemeFreeQtyForPaid(paid.qty, scheme.buyQty, scheme.freeQty) : 0;
    const existing = freeByPaid.get(paid.id);

    if (freeQty > 0 && scheme) {
      out.push({
        id: existing?.id ?? nextLineId([...lines, ...out]),
        productId: paid.productId,
        productName: paid.productName,
        uom: freeLineUomForScheme(scheme, paid.uom),
        qty: freeQty,
        mrp: 0,
        rate: 0,
        discountPct: 0,
        isSchemeFree: true,
        schemePaidLineId: paid.id,
        schemeName: scheme.schemeName,
      });
      freeByPaid.delete(paid.id);
    }
  }

  return out.length ? out : lines.filter((l) => !l.isSchemeFree);
}

export function schemeHintForLine(
  schemes: ProductScheme[],
  productId: string,
  paidQty: number,
  billDate: string,
  paidUom?: string,
): string | null {
  const scheme = pickBestScheme(schemes, productId, billDate, paidUom);
  if (!scheme) {
    const anyOnProduct = pickBestScheme(schemes, productId, billDate);
    if (anyOnProduct?.buyUom && paidUom && !schemeMatchesPaidUom(anyOnProduct, paidUom)) {
      return `${anyOnProduct.schemeName}: sell in ${anyOnProduct.buyUom} to qualify`;
    }
    return null;
  }
  const freeUom = paidUom ? freeLineUomForScheme(scheme, paidUom) : scheme.freeUom ?? "";
  const free = schemeFreeQtyForPaid(paidQty, scheme.buyQty, scheme.freeQty);
  if (free > 0) {
    const freeLabel = freeUom ? `${free} ${freeUom}` : `${free}`;
    return `${scheme.schemeName}: +${freeLabel} free (${schemeSummaryLabel(scheme)})`;
  }
  const need = Math.max(0, scheme.buyQty - paidQty);
  if (need > 0) {
    return `${scheme.schemeName}: ${schemeSummaryLabel(scheme)} — add ${need} more`;
  }
  return null;
}
