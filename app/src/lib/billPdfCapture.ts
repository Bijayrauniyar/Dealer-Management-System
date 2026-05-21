/**
 * PDF from on-screen bill — same layout, borders, and colors as BillPrintView.
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** Same width as @media print .bill-print-a4 (186mm on A4). */
export const BILL_PRINT_WIDTH_MM = 186;
export const BILL_CAPTURE_WIDTH_PX = Math.round((BILL_PRINT_WIDTH_MM * 96) / 25.4);
const A4_W_MM = 210;
const A4_H_MM = 297;
const PAGE_MARGIN_MM = 12;

/** Copy computed styles so html2canvas clone matches the live bill. */
function syncComputedStyles(source: Element, target: Element): void {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;

  const cs = getComputedStyle(source);
  target.style.color = cs.color;
  target.style.backgroundColor = cs.backgroundColor;
  target.style.fontSize = cs.fontSize;
  target.style.fontWeight = cs.fontWeight;
  target.style.fontStyle = cs.fontStyle;
  target.style.textAlign = cs.textAlign;
  target.style.verticalAlign = cs.verticalAlign;
  target.style.lineHeight = cs.lineHeight;
  target.style.padding = cs.padding;
  target.style.borderTop = cs.borderTop;
  target.style.borderRight = cs.borderRight;
  target.style.borderBottom = cs.borderBottom;
  target.style.borderLeft = cs.borderLeft;
  target.style.whiteSpace = cs.whiteSpace;

  const srcKids = Array.from(source.children);
  const tgtKids = Array.from(target.children);
  for (let i = 0; i < Math.min(srcKids.length, tgtKids.length); i++) {
    syncComputedStyles(srcKids[i], tgtKids[i]);
  }
}

function prepareCaptureClone(el: HTMLElement): { host: HTMLDivElement; clone: HTMLElement } {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-12000px;top:0;z-index:-1;width:${BILL_CAPTURE_WIDTH_PX}px;background:#fff;overflow:visible`;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.classList.add("bill-pdf-capture");
  clone.style.width = `${BILL_CAPTURE_WIDTH_PX}px`;
  clone.style.maxWidth = `${BILL_CAPTURE_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.background = "#fff";

  host.appendChild(clone);
  return { host, clone };
}

export function findBillPrintRoot(): HTMLElement | null {
  return document.getElementById("bill-print-root");
}

/** PDF blob matching visible bill (teal table, colored totals, aligned Rs.). */
export async function billPdfBlobFromElement(el: HTMLElement): Promise<Blob> {
  const { host, clone } = prepareCaptureClone(el);
  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    syncComputedStyles(el, clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: BILL_CAPTURE_WIDTH_PX,
      windowWidth: BILL_CAPTURE_WIDTH_PX,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const contentW = A4_W_MM - PAGE_MARGIN_MM * 2;
    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    let offset = 0;
    let page = 0;
    while (offset < imgH) {
      if (page > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(imgData, "PNG", PAGE_MARGIN_MM, -offset + PAGE_MARGIN_MM, imgW, imgH);
      offset += A4_H_MM - PAGE_MARGIN_MM * 2;
      page += 1;
    }

    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
