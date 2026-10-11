import { PDFDocument, rgb } from "pdf-lib";
import { renderCardToBlob } from "./exportPng";
import { PX_PER_MM } from "../types";
import type { AssetLibrary, CardElement, CardSettings, DataRow } from "../types";

const MM_TO_PT = 72 / 25.4;
const CROP_MARK_GAP_MM = 2;
const CROP_MARK_LENGTH_MM = 4;

export interface PageSizeMm {
  label: string;
  width: number;
  height: number;
}

export const PDF_PAGE_SIZES: PageSizeMm[] = [
  { label: "A4", width: 210, height: 297 },
  { label: "A3", width: 297, height: 420 },
  { label: "US Letter", width: 215.9, height: 279.4 },
  { label: "US Legal", width: 215.9, height: 355.6 },
];

export interface PrintPdfOptions {
  pageWidthMm: number;
  pageHeightMm: number;
  marginMm: number;
  gutterMm: number;
  cropMarks: boolean;
}

export interface PrintLayout {
  cols: number;
  rows: number;
  cardsPerPage: number;
  totalPages: number;
  fits: boolean;
}

/** Card's physical size in millimeters, derived from its ~300dpi internal px. */
export function cardSizeMm(card: CardSettings): { width: number; height: number } {
  return { width: card.width / PX_PER_MM, height: card.height / PX_PER_MM };
}

export function computePrintLayout(card: CardSettings, options: PrintPdfOptions, rowCount: number): PrintLayout {
  const { width: cardWidthMm, height: cardHeightMm } = cardSizeMm(card);
  const usableWidth = options.pageWidthMm - 2 * options.marginMm;
  const usableHeight = options.pageHeightMm - 2 * options.marginMm;

  if (cardWidthMm > usableWidth || cardHeightMm > usableHeight || usableWidth <= 0 || usableHeight <= 0) {
    return { cols: 0, rows: 0, cardsPerPage: 0, totalPages: 0, fits: false };
  }

  const cols = Math.max(1, Math.floor((usableWidth + options.gutterMm) / (cardWidthMm + options.gutterMm)));
  const rows = Math.max(1, Math.floor((usableHeight + options.gutterMm) / (cardHeightMm + options.gutterMm)));
  const cardsPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(rowCount / cardsPerPage));

  return { cols, rows, cardsPerPage, totalPages, fits: true };
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Eight short lines (two per corner) just outside the card's bounding box, standard printer crop marks. */
function cropMarksForCard(leftPt: number, topPt: number, widthPt: number, heightPt: number): Line[] {
  const gap = CROP_MARK_GAP_MM * MM_TO_PT;
  const len = CROP_MARK_LENGTH_MM * MM_TO_PT;
  const right = leftPt + widthPt;
  const bottom = topPt - heightPt;

  const corners: { cx: number; cy: number; dx: 1 | -1; dy: 1 | -1 }[] = [
    { cx: leftPt, cy: topPt, dx: -1, dy: 1 },
    { cx: right, cy: topPt, dx: 1, dy: 1 },
    { cx: leftPt, cy: bottom, dx: -1, dy: -1 },
    { cx: right, cy: bottom, dx: 1, dy: -1 },
  ];

  const lines: Line[] = [];
  for (const c of corners) {
    lines.push({ x1: c.cx + c.dx * gap, y1: c.cy, x2: c.cx + c.dx * (gap + len), y2: c.cy });
    lines.push({ x1: c.cx, y1: c.cy + c.dy * gap, x2: c.cx, y2: c.cy + c.dy * (gap + len) });
  }
  return lines;
}

export interface PdfExportProgress {
  done: number;
  total: number;
}

/**
 * Renders one PNG per data row (same off-screen CardRenderer pipeline as
 * the PNG/ZIP export) and lays them out across print-ready PDF pages.
 */
export async function exportPrintPdf(
  card: CardSettings,
  elements: CardElement[],
  rows: DataRow[],
  options: PrintPdfOptions,
  assets: AssetLibrary | undefined,
  onProgress?: (progress: PdfExportProgress) => void
): Promise<Blob> {
  const layout = computePrintLayout(card, options, rows.length);
  if (!layout.fits) {
    throw new Error("Карточка не помещается на странице с текущими полями.");
  }

  const { width: cardWidthMm, height: cardHeightMm } = cardSizeMm(card);
  const cardWidthPt = cardWidthMm * MM_TO_PT;
  const cardHeightPt = cardHeightMm * MM_TO_PT;
  const pageWidthPt = options.pageWidthMm * MM_TO_PT;
  const pageHeightPt = options.pageHeightMm * MM_TO_PT;
  const marginPt = options.marginMm * MM_TO_PT;
  const gutterPt = options.gutterMm * MM_TO_PT;

  const usableWidthPt = pageWidthPt - 2 * marginPt;
  const usableHeightPt = pageHeightPt - 2 * marginPt;
  const gridWidthPt = layout.cols * cardWidthPt + (layout.cols - 1) * gutterPt;
  const gridHeightPt = layout.rows * cardHeightPt + (layout.rows - 1) * gutterPt;
  const offsetXPt = marginPt + (usableWidthPt - gridWidthPt) / 2;
  const offsetYPt = marginPt + (usableHeightPt - gridHeightPt) / 2;

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < rows.length; i++) {
    const positionOnPage = i % layout.cardsPerPage;
    if (positionOnPage === 0) {
      pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    }
    const page = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

    const col = positionOnPage % layout.cols;
    const rowInGrid = Math.floor(positionOnPage / layout.cols);

    const xPt = offsetXPt + col * (cardWidthPt + gutterPt);
    // PDF y grows upward from the page bottom — "top" of a grid row is the
    // higher y value, so walking down the grid subtracts from the page top.
    const topPt = pageHeightPt - offsetYPt - rowInGrid * (cardHeightPt + gutterPt);
    const bottomForImagePt = topPt - cardHeightPt;

    const blob = await renderCardToBlob(card, elements, rows[i], assets);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const png = await pdfDoc.embedPng(bytes);

    page.drawImage(png, { x: xPt, y: bottomForImagePt, width: cardWidthPt, height: cardHeightPt });

    if (options.cropMarks) {
      for (const line of cropMarksForCard(xPt, topPt, cardWidthPt, cardHeightPt)) {
        page.drawLine({
          start: { x: line.x1, y: line.y1 },
          end: { x: line.x2, y: line.y2 },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
      }
    }

    onProgress?.({ done: i + 1, total: rows.length });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
}
