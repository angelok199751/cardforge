import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { renderCardToBlob } from "../renderer/exportPng";
import { exportAllAsZip, type ExportProgress } from "../renderer/exportZip";
import { downloadBlob } from "../utils/downloadBlob";
import { sanitizeFilename } from "../utils/sanitizeFilename";

interface ExportDialogProps {
  onClose: () => void;
}

const INDEX_OPTION = "__card_number__";

function pluralCards(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "карточка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "карточки";
  return "карточек";
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const project = useProjectStore((s) => s.project);
  const rows = project.data.rows;
  const columns = project.data.columns;

  const defaultField = columns.find((c) => c.toLowerCase() === "name") ?? INDEX_OPTION;
  const [filenameField, setFilenameField] = useState(defaultField);
  const [busy, setBusy] = useState<"single" | "zip" | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExportSingle() {
    setError(null);
    setBusy("single");
    try {
      const row = rows[0];
      const blob = await renderCardToBlob(project.card, project.elements, row, project.assets);
      downloadBlob(blob, `${sanitizeFilename(project.name)}.png`);
    } catch {
      setError("Не удалось отрисовать карточку. Подробности — в консоли браузера.");
    } finally {
      setBusy(null);
    }
  }

  async function handleExportZip() {
    setError(null);
    setBusy("zip");
    setProgress({ done: 0, total: rows.length });
    try {
      const field = filenameField === INDEX_OPTION ? null : filenameField;
      const blob = await exportAllAsZip(project.card, project.elements, rows, field, project.assets, setProgress);
      downloadBlob(blob, `${sanitizeFilename(project.name)}.zip`);
      onClose();
    } catch {
      setError("Не удалось собрать ZIP. Подробности — в консоли браузера.");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Экспорт</h2>

        <section className="panel-section">
          <h4 className="panel-section-title">Одна карточка</h4>
          <p className="hint-text">
            {rows.length > 0
              ? "Экспортирует карточку по первой импортированной строке."
              : "Данные не импортированы — экспортируется шаблон как есть."}
          </p>
          <button className="btn-ghost" style={{ width: "100%" }} onClick={handleExportSingle} disabled={busy !== null}>
            {busy === "single" ? "Рендеринг…" : "Скачать PNG"}
          </button>
        </section>

        <section className="panel-section">
          <h4 className="panel-section-title">
            Весь набор ({rows.length} {pluralCards(rows.length)})
          </h4>

          {rows.length === 0 ? (
            <p className="hint-text">Импортируйте данные, чтобы сгенерировать больше одной карточки.</p>
          ) : (
            <>
              <label className="field">
                <span className="field-label">Называть файлы по</span>
                <select
                  className="text-input"
                  value={filenameField}
                  onChange={(e) => setFilenameField(e.target.value)}
                  disabled={busy !== null}
                >
                  <option value={INDEX_OPTION}>Номеру карточки (card_001, card_002…)</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn-primary" style={{ width: "100%" }} onClick={handleExportZip} disabled={busy !== null}>
                {busy === "zip" ? "Рендеринг…" : `Скачать ZIP (${rows.length} PNG)`}
              </button>

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
            </>
          )}
        </section>

        {error && <p className="hint-text warning">{error}</p>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={busy !== null}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
