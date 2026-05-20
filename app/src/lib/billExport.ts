import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** 210mm at 96dpi — matches A4 print width */
const A4_WIDTH_PX = Math.round((210 * 96) / 25.4);
const PDF_MARGIN_MM = 12;

function sanitizeFilename(billNo: string): string {
  return billNo.replace(/[^\w.-]+/g, "_") || "bill";
}

/** Clone bill at A4 width so PDF/print match desktop layout, not narrow mobile. */
async function captureBillCanvas(): Promise<HTMLCanvasElement> {
  const el = document.getElementById("bill-print-root");
  if (!el) throw new Error("Bill preview not found");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    "background:#fff",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.classList.add("bill-pdf-capture");
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    return await html2canvas(clone, {
      scale: 2,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  } finally {
    document.body.removeChild(host);
  }
}

function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - PDF_MARGIN_MM * 2;
  const contentH = pageH - PDF_MARGIN_MM * 2;
  const imgData = canvas.toDataURL("image/png", 1.0);
  const imgHmm = (canvas.height * contentW) / canvas.width;

  let offset = 0;
  while (offset < imgHmm) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", PDF_MARGIN_MM, PDF_MARGIN_MM - offset, contentW, imgHmm);
    offset += contentH;
  }
}

/** Render bill to PDF (A4) and trigger download. */
export async function downloadBillPdf(billNo: string): Promise<void> {
  const canvas = await captureBillCanvas();
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  addCanvasToPdf(pdf, canvas);
  pdf.save(`${sanitizeFilename(billNo)}.pdf`);
}

/** Share PDF via Web Share API when available; otherwise download. */
export async function shareBillPdf(billNo: string): Promise<"shared" | "downloaded"> {
  const canvas = await captureBillCanvas();
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  addCanvasToPdf(pdf, canvas);

  const blob = pdf.output("blob");
  const filename = `${sanitizeFilename(billNo)}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Bill ${billNo}`,
      text: `Sales bill ${billNo}`,
      files: [file],
    });
    return "shared";
  }

  pdf.save(filename);
  return "downloaded";
}
