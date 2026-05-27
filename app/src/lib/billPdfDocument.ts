/**
 * Vector PDF bill — standard A4, symmetric margins (Preview-safe).
 */
import { jsPDF } from "jspdf";
import type { BusinessSettings, Customer, Sale, SaleLine } from "@/domain/types";
import {
  billDocumentTitleDisplay,
  billBalanceDueLabel,
  billPaymentModeDisplay,
  billPaymentStatusLabel,
  billFooterDiscountLabel,
  billShowsFooterDiscount,
  billShowsLineDiscColumn,
  billSubtotalForDisplay,
  sellerContactLine,
  sellerTaxId,
} from "@/lib/billDisplay";
import { roundMoney } from "@/lib/money";
import { billLineAmount } from "@/lib/saleLineMath";
import { amountInWords, fmtDate, nprNum, toMiti } from "@/lib/utils";

export type BillPdfInput = {
  sale: Sale;
  customer?: Customer;
  business: BusinessSettings;
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const RIGHT = PAGE_W - MARGIN;
const CONTENT_W = RIGHT - MARGIN;
const TEAL: [number, number, number] = [13, 148, 136];

function rs(n: number): string {
  return `Rs. ${nprNum(n)}`;
}

function sellerBillName(b: BusinessSettings): string {
  const legal = b.legalName.trim();
  const trading = b.name.trim();
  return legal || trading || "—";
}

function lineDiscPct(line: SaleLine): number {
  if ((line.discountPct ?? 0) > 0) return line.discountPct ?? 0;
  const mrp = Number(line.mrp) || 0;
  const qty = Number(line.qty) || 0;
  if (mrp <= 0 || qty <= 0) return 0;
  const gross = roundMoney(qty * mrp);
  const amt = billLineAmount(line);
  if (amt >= gross) return 0;
  return Math.round((1 - amt / gross) * 100);
}

type Col = { key: string; label: string; w: number; align: "left" | "center" | "right" };

function buildCols(lines: SaleLine[], sale: Sale): Col[] {
  const hasDisc = billShowsLineDiscColumn(lines, sale);
  const cols: Col[] = [
    { key: "sn", label: "S.N.", w: 11, align: "center" },
    { key: "name", label: "PARTICULARS", w: hasDisc ? 48 : 58, align: "center" },
    { key: "mrp", label: "MRP", w: 20, align: "right" },
    { key: "unit", label: "UNIT", w: 14, align: "center" },
    { key: "qty", label: "QTY", w: 14, align: "right" },
  ];
  if (hasDisc) cols.push({ key: "disc", label: "DISC%", w: 13, align: "right" });
  cols.push({ key: "amt", label: "AMOUNT", w: 22, align: "right" });
  const sum = cols.reduce((s, c) => s + c.w, 0);
  const scale = CONTENT_W / sum;
  return cols.map((c) => ({ ...c, w: c.w * scale }));
}

function cellText(line: SaleLine, i: number, key: string): string {
  switch (key) {
    case "sn":
      return String(i + 1);
    case "name":
      return line.productName || "—";
    case "mrp":
      return line.mrp ? nprNum(line.mrp) : "—";
    case "qty":
      return nprNum(line.qty);
    case "unit":
      return line.uom || "PCS";
    case "disc":
      return lineDiscPct(line) > 0 ? `${lineDiscPct(line)}%` : "—";
    case "amt":
      return nprNum(billLineAmount(line));
    default:
      return "";
  }
}

/** Draw text inside a column box — avoids jsPDF align+maxWidth overflow past page edge. */
function drawInCell(
  pdf: jsPDF,
  text: string | string[],
  x: number,
  w: number,
  y: number,
  align: Col["align"],
  fontSize: number,
): number {
  pdf.setFontSize(fontSize);
  const pad = 0.8;
  const maxW = Math.max(4, w - pad * 2);
  const lines = Array.isArray(text) ? text : pdf.splitTextToSize(String(text), maxW);
  let lineY = y + 3.2;
  for (const line of lines) {
    const tw = pdf.getTextWidth(line);
    let tx = x + pad;
    if (align === "right") tx = x + w - pad - tw;
    else if (align === "center") tx = x + (w - tw) / 2;
    pdf.text(line, tx, lineY);
    lineY += 3.4;
  }
  return lineY - y;
}

function drawTotalRow(
  pdf: jsPDF,
  label: string,
  value: string,
  y: number,
  xLabel: number,
  xValueRight: number,
  bold = false,
  color?: [number, number, number],
): number {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(8);
  if (color) pdf.setTextColor(...color);
  else pdf.setTextColor(bold ? 20 : 55, bold ? 20 : 55, bold ? 20 : 55);
  pdf.text(label, xLabel, y);
  const vw = pdf.getTextWidth(value);
  pdf.text(value, xValueRight - vw, y);
  return y + 4.2;
}

/** Build A4 PDF (always 210×297 mm — no custom size that clips in Preview). */
export function createBillPdf({ sale, customer, business }: BillPdfInput): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const cols = buildCols(lines, sale);
  let y = MARGIN;

  const sellerTax = sellerTaxId(business);
  const sellerContact = sellerContactLine(business);

  // ── Letterhead: shop+address left, VAT/PAN right, title centered on own line ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text(sellerBillName(business), MARGIN, y);
  if (sellerTax) {
    pdf.setFontSize(9);
    const taxStr = `${sellerTax.label} ${sellerTax.number}`;
    const tw = pdf.getTextWidth(taxStr);
    pdf.text(taxStr, RIGHT - tw, y);
  }
  y += 5;

  if (sellerContact) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    const contactLines = pdf.splitTextToSize(sellerContact, CONTENT_W * 0.7);
    pdf.text(contactLines, MARGIN, y);
    y += contactLines.length * 3.2 + 1;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(30, 30, 30);
  const title = billDocumentTitleDisplay();
  const titleW = pdf.getTextWidth(title);
  pdf.text(title, (PAGE_W - titleW) / 2, y);
  y += 6;

  pdf.setDrawColor(200);
  pdf.line(MARGIN, y, RIGHT, y);
  y += 4;

  const payMode = billPaymentModeDisplay(sale);
  const paymentStatus = billPaymentStatusLabel(sale);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  let meta = `Bill ${sale.billNo} · ${fmtDate(sale.date)} (${toMiti(sale.date)}) · ${payMode}`;
  if (paymentStatus && paymentStatus !== "Paid") meta += ` · ${paymentStatus}`;
  pdf.text(pdf.splitTextToSize(meta, CONTENT_W), MARGIN, y);
  y += meta.split("\n").length * 3.5 + 3;

  const customerName = sale.customerName || customer?.name || "—";
  const buyerParts = [
    customerName,
    customer?.address?.trim() || null,
    customer?.phone?.trim() ? `Ph ${customer.phone.trim()}` : null,
    customer?.panNumber?.trim() ? `PAN ${customer.panNumber.trim()}` : null,
  ].filter(Boolean);
  pdf.setFont("helvetica", "bold");
  pdf.text("To: ", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  const toX = MARGIN + pdf.getTextWidth("To: ");
  const buyerLines = pdf.splitTextToSize(buyerParts.join(" · "), CONTENT_W - toX);
  pdf.text(buyerLines, toX, y);
  y += buyerLines.length * 3.5 + 3;

  // ── Table ──
  const headerH = 5.5;
  const headerY = y;
  pdf.setFillColor(...TEAL);
  pdf.rect(MARGIN, headerY, CONTENT_W, headerH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  let cx = MARGIN;
  for (const col of cols) {
    drawInCell(pdf, col.label, cx, col.w, headerY, col.align, 7);
    cx += col.w;
  }
  y = headerY + headerH;

  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "normal");

  for (let i = 0; i < lines.length; i++) {
    if (y > PAGE_H - 55) {
      pdf.addPage("a4", "portrait");
      y = MARGIN;
    }
    const line = lines[i];
    const nameCol = cols.find((c) => c.key === "name")!;
    const nameLines = pdf.splitTextToSize(line.productName || "—", nameCol.w - 2);
    const rowH = Math.max(headerH, nameLines.length * 3.4 + 2);

    if (i % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(MARGIN, y, CONTENT_W, rowH, "F");
    }
    pdf.setDrawColor(210);
    pdf.rect(MARGIN, y, CONTENT_W, rowH, "S");

    cx = MARGIN;
    for (const col of cols) {
      const content = col.key === "name" ? nameLines : cellText(line, i, col.key);
      drawInCell(pdf, content, cx, col.w, y, col.align, 8);
      cx += col.w;
    }
    y += rowH;
  }

  y += 5;

  // ── Amount in words (full width) ──
  const wordsTop = y;
  const leftW = CONTENT_W * 0.52;
  const wordsLines = pdf.splitTextToSize(amountInWords(sale.grandTotal), leftW - 4);
  const wordsH = 10 + wordsLines.length * 3.2 + (business.billFooter?.trim() ? 6 : 0);
  pdf.setDrawColor(220);
  pdf.setFillColor(249, 250, 251);
  pdf.rect(MARGIN, wordsTop, leftW, wordsH, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text("AMOUNT IN WORDS", MARGIN + 2, wordsTop + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);
  pdf.text(wordsLines, MARGIN + 2, wordsTop + 8);
  if (business.billFooter?.trim()) {
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      pdf.splitTextToSize(business.billFooter.trim(), leftW - 4),
      MARGIN + 2,
      wordsTop + 8 + wordsLines.length * 3.2,
    );
  }

  // ── Totals (right column, aligned) ──
  const summaryTop = wordsTop;
  const totalsX = MARGIN + leftW + 4;
  const totalsRight = RIGHT;

  const billLines = Array.isArray(sale.lines) ? sale.lines : [];
  const showFooterDisc = billShowsFooterDiscount(sale);
  const subtotalOnBill = billSubtotalForDisplay(sale);

  let ty = summaryTop + 4;
  ty = drawTotalRow(pdf, "Subtotal", rs(subtotalOnBill), ty, totalsX, totalsRight);
  if (showFooterDisc) {
    ty = drawTotalRow(
      pdf,
      billFooterDiscountLabel(sale),
      `- ${rs(sale.discountAmount)}`,
      ty,
      totalsX,
      totalsRight,
      false,
      [
      220, 38, 38,
    ]);
  }
  if (sale.billTermsAmount > 0) {
    ty = drawTotalRow(pdf, sale.billTerms || "Add. charges", rs(sale.billTermsAmount), ty, totalsX, totalsRight);
  }
  if (sale.vatRate > 0) {
    ty = drawTotalRow(pdf, `VAT (${sale.vatRate}%)`, rs(sale.vatAmount), ty, totalsX, totalsRight);
  }

  ty += 3;
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.2);
  pdf.line(totalsX, ty, totalsRight, ty);
  pdf.setLineWidth(0.1);
  ty += 6;
  ty = drawTotalRow(pdf, "Grand total (NPR)", rs(sale.grandTotal), ty, totalsX, totalsRight, true);
  if (sale.paidNow > 0) {
    ty = drawTotalRow(pdf, "Paid at billing", rs(sale.paidNow), ty, totalsX, totalsRight, false, [
      4, 120, 87,
    ]);
  }
  if (sale.balance > 0) {
    ty = drawTotalRow(pdf, billBalanceDueLabel(), rs(sale.balance), ty, totalsX, totalsRight, true, [
      146, 64, 14,
    ]);
  }

  const summaryH = Math.max(wordsH, ty - summaryTop + 2);
  y = summaryTop + summaryH + 4;

  pdf.setDrawColor(180);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.line(MARGIN, y, RIGHT, y);
  pdf.setLineDashPattern([], 0);
  y += 10;

  const sigW = (CONTENT_W - 6) / 2;
  pdf.setDrawColor(120);
  pdf.line(MARGIN, y, MARGIN + sigW, y);
  pdf.line(MARGIN + sigW + 6, y, RIGHT, y);
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  pdf.text("Authorised signature", MARGIN + sigW / 2, y + 4, { align: "center" });
  pdf.text("Received by", MARGIN + sigW + 6 + sigW / 2, y + 4, { align: "center" });

  return pdf;
}

export function sanitizeBillFilename(billNo: string): string {
  return billNo.replace(/[^\w.-]+/g, "_") || "bill";
}
