export type SellerAddressFields = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  province?: string | null;
  country?: string | null;
};

function partMentionsToken(part: string, token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return false;
  const pl = part.trim().toLowerCase();
  if (pl === t) return true;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s,·])${escaped}(?:$|[\\s,·])`, "i").test(part);
}

/** Keep first occurrence; skip later segments that repeat an earlier place name. */
function compactAddressParts(parts: string[]): string[] {
  const out: string[] = [];
  for (const raw of parts) {
    const p = (raw ?? "").trim();
    if (!p) continue;
    const key = p.toLowerCase();
    if (out.some((x) => x.toLowerCase() === key)) continue;
    if (out.some((x) => partMentionsToken(x, p) || partMentionsToken(p, x))) continue;
    out.push(p);
  }
  return out;
}

/** Ordered address segments for bill letterhead (dedupes repeated place names from Settings). */
export function formatSellerAddressSegments(fields: SellerAddressFields): string[] {
  const raw = [
    fields.addressLine1,
    fields.addressLine2,
    fields.district,
    fields.province,
    fields.country,
  ]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  return compactAddressParts(raw);
}

/** Address only (no phone). Phone is on letterhead right column per IRD layout. */
export function buildSellerContactLine(
  segments: string[],
  _contact?: { mobile?: string | null; phone?: string | null },
): string {
  return segments.join(" · ");
}

function trim(s: string | null | undefined): string {
  return (s ?? "").trim();
}

/** Primary phone for letterhead (mobile preferred). IRD layout: right column under VAT/PAN. */
export function sellerPhoneNumber(contact: {
  mobile?: string | null;
  phone?: string | null;
}): string | null {
  const n = trim(contact.mobile) || trim(contact.phone);
  return n || null;
}

export type FormatSellerAddressOptions = {
  /** When true, append district · province · country after address lines (Settings toggle). */
  includeDistrictProvince?: boolean;
};

/**
 * Printed bill address: address line 1 (and line 2 if set) from Settings.
 * District/province/country only when `includeDistrictProvince` is true (off by default).
 */
export function formatSellerAddressLines(
  fields: SellerAddressFields,
  options?: FormatSellerAddressOptions,
): string[] {
  const billLines = compactAddressParts(
    [fields.addressLine1, fields.addressLine2].map(trim).filter(Boolean),
  );

  if (!options?.includeDistrictProvince) return billLines;

  const adminSegments = formatSellerAddressSegments({
    addressLine1: "",
    addressLine2: "",
    district: fields.district,
    province: fields.province,
    country: fields.country,
  });

  const printed = billLines.join(" ").toLowerCase();
  const adminFiltered = adminSegments.filter((seg) => {
    const s = seg.toLowerCase();
    if (!printed) return true;
    if (printed.includes(s) || s.includes(printed)) return false;
    return true;
  });

  const adminLine = adminFiltered.join(" · ");
  if (adminLine) return [...billLines, adminLine];
  return billLines;
}
