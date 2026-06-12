/**
 * MRP sticker print rendering — one design spread over full A4 page(s)
 * as a repeatable rows × columns grid (cut with scissors).
 * Printed via printDocument("mrp-sticker-print-root") iframe.
 */
import type { MrpStickerDraft } from "@/lib/mrpSticker";
import {
  pagesNeeded,
  SHEET_WIDTH_MM,
  STICKER_GAP_MM,
  stickerSheetLayout,
} from "@/lib/mrpSticker";

export const MRP_STICKER_PRINT_ROOT_ID = "mrp-sticker-print-root";

type StickerLike = Omit<MrpStickerDraft, "id" | "qty"> & { qty?: number };

export function MrpStickerLabel({ design }: { design: StickerLike }) {
  const align = design.align ?? "center";
  return (
    <div
      className="flex flex-col justify-center overflow-hidden bg-white text-gray-900"
      style={{
        width: `${design.widthMm}mm`,
        height: `${design.heightMm}mm`,
        padding: "1mm 1.5mm",
        border: design.border ? "0.35mm solid #111" : "none",
        borderRadius: design.border ? "1mm" : 0,
        boxSizing: "border-box",
        textAlign: align,
        alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
      }}
    >
      <p
        className="w-full leading-tight"
        style={{
          fontSize: `${design.titleSize}pt`,
          fontWeight: design.titleBold ? 700 : 400,
        }}
      >
        {design.title || "MRP"}
      </p>
      {design.lines.filter((l) => l.trim()).map((line, i) => (
        <p
          key={i}
          className="w-full leading-snug"
          style={{ fontSize: `${design.lineSize}pt` }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/** Full pages for one or more designs — each design starts on its own page. */
export function MrpStickerSheet({ designs }: { designs: MrpStickerDraft[] }) {
  return (
    <div id={MRP_STICKER_PRINT_ROOT_ID} className="bg-white">
      {designs.map((design, di) => {
        const { perPage } = stickerSheetLayout(design.widthMm, design.heightMm);
        const pages = pagesNeeded(design.qty, perPage);
        return Array.from({ length: pages }).map((_, page) => (
          <div
            key={`${design.id ?? di}-${page}`}
            style={{
              width: `${SHEET_WIDTH_MM}mm`,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              gap: `${STICKER_GAP_MM}mm`,
              breakAfter: "page",
            }}
          >
            {Array.from({ length: perPage }).map((_, i) => (
              <MrpStickerLabel key={i} design={design} />
            ))}
          </div>
        ));
      })}
    </div>
  );
}
