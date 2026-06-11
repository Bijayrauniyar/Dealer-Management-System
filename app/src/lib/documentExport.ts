import { billPdfBlobFromElement } from "@/lib/billPdfCapture";

export async function shareDocumentPdf(
  rootId: string,
  filename: string,
  title: string,
): Promise<"shared" | "downloaded"> {
  const root = document.getElementById(rootId);
  if (!root) throw new Error("Document not ready for export.");
  const blob = await billPdfBlobFromElement(root);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, text: title, files: [file] });
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

export async function downloadDocumentPdf(rootId: string, filename: string): Promise<void> {
  const root = document.getElementById(rootId);
  if (!root) throw new Error("Document not ready for export.");
  const blob = await billPdfBlobFromElement(root);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
