import type { BillPdfInput } from "@/lib/billPdfDocument";
import { createBillPdf, sanitizeBillFilename } from "@/lib/billPdfDocument";
import { billPdfBlobFromElement, findBillPrintRoot } from "@/lib/billPdfCapture";

/** Same design as print preview (html2canvas of #bill-print-root); vector fallback if bill not on screen. */
async function billPdfBlob(input: BillPdfInput): Promise<Blob> {
  const root = findBillPrintRoot();
  if (root) {
    try {
      return await billPdfBlobFromElement(root);
    } catch {
      /* fallback */
    }
  }
  return createBillPdf(input).output("blob");
}

export async function downloadBillPdf(input: BillPdfInput): Promise<void> {
  const filename = `${sanitizeBillFilename(input.sale.billNo)}.pdf`;
  const blob = await billPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareBillPdf(input: BillPdfInput): Promise<"shared" | "downloaded"> {
  const filename = `${sanitizeBillFilename(input.sale.billNo)}.pdf`;
  const blob = await billPdfBlob(input);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Bill ${input.sale.billNo}`,
      text: `Sales bill ${input.sale.billNo}`,
      files: [file],
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
