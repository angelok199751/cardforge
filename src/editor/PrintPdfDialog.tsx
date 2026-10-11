import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import {
  PDF_PAGE_SIZES,
  cardSizeMm,
  computePrintLayout,
  exportPrintPdf,
  type PdfExportProgress,
  type PrintPdfOptions,
} from "../renderer/exportPdf";
import { downloadBlob } from "../utils/downloadBlob";
import { sanitizeFilename } from "../utils/sanitizeFilename";

interface PrintPdfDialogProps {
  onClose: () => void;
}

const CUSTOM_LABEL = "Свой размер";

function pluralCards(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "карточка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "карточки";
  return "карточек";
}

function pluralPages(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "страница";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "страницы";
  return "страниц";
}

export function PrintPdfDialog({ onClose }: PrintPdfDialogProps) {
  const project = useProjectStore((s) => s.project);
  const rows = project.data.rows;

  const [presetLabel, setPresetLabel] = useState(PDF_PAGE_SIZES[0].label);
  const [pageWidthMm, setPageWidthMm] = useState(PDF_PAGE_SIZES[0].width);
  const [pageHeightMm, setPageHeightMm] = useState(PDF_PAGE_SIZES[0].height);
  const [marginMm, setMarginMm] = useState(10);
  const [gutterMm, setGutterMm] = useState(4);
  const [cropMarks, setCropMarks] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PdfExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(label: string) {
    setPresetLabel(label);
    const preset = PDF_PAGE_SIZES.find((p) => p.label === label);
    if (preset) {
      setPageWidthMm(preset.width);
      setPageHeightMm(preset.height);
    }
  }

  const options: PrintPdfOptions = { pageWidthMm, pageHeightMm, marginMm, gutterMm, cropMarks };
  const layout = rows.length > 0 ? computePrintLayout(project.card, options, rows.length) : null;
  const cardMm = cardSizeMm(project.card);

  async function handleExport() {
    setError(null);
    if (rows.length === 0) {
      setError("Сначала импортируйте данные — PDF раскладывает по одной карточке на строку.");
      return;
    }
    if (layout && !layout.fits) {
      setError("Карточка не помещается на странице с текущими полями.");
      return;
    }

    setBusy(true);
    setProgress({ done: 0, total: rows.length });
    try {
      const blob = await exportPrintPdf(project.card, project.elements, rows, options, project.assets, setProgress);
      downloadBlob(blob, `${sanitizeFilename(project.name)}.pdf`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось собрать PDF.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Печать PDF</h2>
        <p className="hint-text">
          Карточка {Math.round(cardMm.width)}×{Math.round(cardMm.height)}мм — на печатных страницах разместится{" "}
          {rows.length} {pluralCards(rows.length)}.
        </p>

        <label className="field">
          <span className="field-label">Размер страницы</span>
          <select className="text-input" value={presetLabel} onChange={(e) => applyPreset(e.target.value)} disabled={busy}>
            {PDF_PAGE_SIZES.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label} ({p.width}×{p.height}мм)
              </option>
            ))}
            <option value={CUSTOM_LABEL}>{CUSTOM_LABEL}</option>
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Ширина (мм)</span>
            <input
              type="number"
              min={1}
              className="text-input mono"
              value={pageWidthMm}
              onChange={(e) => {
                setPresetLabel(CUSTOM_LABEL);
                setPageWidthMm(Number(e.target.value));
              }}
              disabled={busy}
            />
          </label>
          <label className="field">
            <span className="field-label">Высота (мм)</span>
            <input
              type="number"
              min={1}
              className="text-input mono"
              value={pageHeightMm}
              onChange={(e) => {
                setPresetLabel(CUSTOM_LABEL);
                setPageHeightMm(Number(e.target.value));
              }}
              disabled={busy}
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Отступ (мм)</span>
            <input
              type="number"
              min={0}
              className="text-input mono"
              value={marginMm}
              onChange={(e) => setMarginMm(Number(e.target.value))}
              disabled={busy}
            />
          </label>
          <label className="field">
            <span className="field-label">Расстояние между карточками (мм)</span>
            <input
              type="number"
              min={0}
              className="text-input mono"
              value={gutterMm}
              onChange={(e) => setGutterMm(Number(e.target.value))}
              disabled={busy}
            />
          </label>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={cropMarks} onChange={(e) => setCropMarks(e.target.checked)} disabled={busy} />
          <span>Метки обрезки</span>
        </label>

        {rows.length === 0 ? (
          <p className="hint-text warning">
            Сначала импортируйте данные — PDF раскладывает по одной карточке на строку.
          </p>
        ) : layout && !layout.fits ? (
          <p className="hint-text warning">Карточка не помещается на странице с текущими полями.</p>
        ) : layout ? (
          <p className="hint-text">
            {layout.cols} × {layout.rows} = {layout.cardsPerPage} карточек на странице · всего{" "}
            {layout.totalPages} {pluralPages(layout.totalPages)}
          </p>
        ) : null}

        {progress && (
          <div className="export-progress">
            <div className="export-progress-bar">
              <div
                className="export-progress-fill"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <span className="hint-text">
              {progress.done} / {progress.total}
            </span>
          </div>
        )}

        {error && <p className="hint-text warning">{error}</p>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Закрыть
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={busy || rows.length === 0}>
            {busy ? "Рендеринг…" : "Скачать PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
