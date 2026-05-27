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

export function buildSellerContactLine(
  segments: string[],
  contact: { mobile?: string | null; phone?: string | null },
): string {
  const addr = segments.join(" · ");
  const phone = ((contact.mobile ?? "") || (contact.phone ?? "")).trim();
  return [addr, phone ? `Ph ${phone}` : ""].filter(Boolean).join(" · ");
}
