import { useEffect } from "react";

/** Default browser tab title (avoid brand name in print headers). */
export const APP_DOCUMENT_TITLE = "Bill";

const PRINT_FRAME_STYLE = `
@page { size: A4 portrait; margin: 18mm 12mm 16mm 12mm; }
html, body { margin: 0; padding: 0; background: #fff; }
.bill-print-zone {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
}
.bill-print-a4 {
  width: 186mm !important;
  max-width: 186mm !important;
  margin: 0 auto !important;
}
`;

/**
 * Print only the bill card in a hidden iframe (empty page title → no bill no. in browser header).
 * In the print dialog: turn off "Headers and footers" for a clean page; turn on "Background graphics".
 */
export function printBill(_billNo?: string): void {
  const root = document.getElementById("bill-print-root");
  if (!root) {
    window.print();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc || !win) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(
    '<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>',
  );
  doc.close();

  const inline = doc.createElement("style");
  inline.textContent = PRINT_FRAME_STYLE;
  doc.head.appendChild(inline);

  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });

  const zone = doc.createElement("div");
  zone.className = "bill-print-zone";
  zone.appendChild(root.cloneNode(true));
  doc.body.appendChild(zone);

  const cleanup = () => {
    iframe.remove();
    win.removeEventListener("afterprint", cleanup);
  };
  win.addEventListener("afterprint", cleanup);

  const run = () => {
    win.focus();
    win.print();
  };

  if (doc.fonts?.ready) {
    void doc.fonts.ready.then(() => setTimeout(run, 80));
  } else {
    setTimeout(run, 200);
  }
}

/** Tab title while viewing a bill (print uses iframe — does not change print header). */
export function useBillDocumentTitle(billNo: string | undefined): void {
  useEffect(() => {
    if (!billNo?.trim()) return;
    const prev = document.title;
    document.title = billNo.trim();
    return () => {
      document.title = prev;
    };
  }, [billNo]);
}
