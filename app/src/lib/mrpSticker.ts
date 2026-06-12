/**
 * MRP sticker generator — size presets, A4 sheet layout math, font auto-suggest.
 * Print area matches printBill.ts iframe: A4 portrait minus 18/12/16/12mm margins.
 */

export type MrpStickerAlign = "left" | "center" | "right";

export type MrpStickerDesign = {
  id: string;
  title: string;
  lines: string[];
  widthMm: number;
  heightMm: number;
  titleSize: number;
  lineSize: number;
  titleBold: boolean;
  border: boolean;
  align: MrpStickerAlign;
  qty: number;
  updatedAt: string;
  lastPrintedAt: string | null;
};

export type MrpStickerDraft = Omit<MrpStickerDesign, "id" | "updatedAt" | "lastPrintedAt"> & {
  id?: string;
};

export const STICKER_PRESETS = [
  { id: "tiny", label: "Tiny (25 × 15 mm)", widthMm: 25, heightMm: 15 },
  { id: "small", label: "Small (35 × 20 mm)", widthMm: 35, heightMm: 20 },
  { id: "medium", label: "Medium (45 × 25 mm)", widthMm: 45, heightMm: 25 },
  { id: "large", label: "Large (60 × 30 mm)", widthMm: 60, heightMm: 30 },
] as const;

export type StickerPresetId = (typeof STICKER_PRESETS)[number]["id"] | "custom";

/** Printable area inside print iframe margins (A4 210×297, margins 18/12/16/12). */
export const SHEET_WIDTH_MM = 186;
export const SHEET_HEIGHT_MM = 263;
/** Gap between stickers for scissor cutting. */
export const STICKER_GAP_MM = 2;

export function presetForSize(widthMm: number, heightMm: number): StickerPresetId {
  const hit = STICKER_PRESETS.find((p) => p.widthMm === widthMm && p.heightMm === heightMm);
  return hit?.id ?? "custom";
}

/** Rows × columns that fit one A4 portrait sheet. */
export function stickerSheetLayout(
  widthMm: number,
  heightMm: number,
): { cols: number; rows: number; perPage: number } {
  const w = Math.max(10, widthMm);
  const h = Math.max(6, heightMm);
  const cols = Math.max(1, Math.floor((SHEET_WIDTH_MM + STICKER_GAP_MM) / (w + STICKER_GAP_MM)));
  const rows = Math.max(1, Math.floor((SHEET_HEIGHT_MM + STICKER_GAP_MM) / (h + STICKER_GAP_MM)));
  return { cols, rows, perPage: cols * rows };
}

export function pagesNeeded(qty: number, perPage: number): number {
  if (perPage <= 0) return 0;
  return Math.max(1, Math.ceil(Math.max(1, qty) / perPage));
}

/**
 * Auto-suggest font sizes (pt) from sticker height so users who pick nothing
 * still get a readable, full label. 1mm ≈ 2.835pt.
 */
export function suggestedFontSizes(
  _widthMm: number,
  heightMm: number,
): { titleSize: number; lineSize: number } {
  const ptPerMm = 2.835;
  const titleSize = Math.round(Math.min(28, Math.max(8, heightMm * 0.32 * ptPerMm)) * 2) / 2;
  const lineSize = Math.round(Math.min(12, Math.max(5, heightMm * 0.13 * ptPerMm)) * 2) / 2;
  return { titleSize, lineSize };
}

export const DEFAULT_STICKER_DRAFT: MrpStickerDraft = {
  title: "MRP NRS 95/-",
  lines: [],
  widthMm: 45,
  heightMm: 25,
  ...suggestedFontSizes(45, 25),
  titleBold: true,
  border: true,
  align: "center",
  // Default = exactly one full A4 page for the default size.
  qty: stickerSheetLayout(45, 25).perPage,
};
