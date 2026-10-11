import { useEffect, useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { CardThumbnail } from "../renderer/CardThumbnail";
import { renderCardToBlob } from "../renderer/exportPng";
import { downloadBlob } from "../utils/downloadBlob";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import { DataImportDialog } from "./DataImportDialog";
import type { DataRow } from "../types";

const GRID_THUMB_WIDTH = 170;
const FOCUS_MAX_WIDTH = 460;

function pluralCards(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "карточка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "карточки";
  return "карточек";
}

export function PreviewGrid() {
  const project = useProjectStore((s) => s.project);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const rows = project.data.rows;

  // Left/Right to step between cards while one is focused.
  useEffect(() => {
    if (focusedIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setFocusedIndex((i) => Math.max(0, (i ?? 0) - 1));
      else if (e.key === "ArrowRight") setFocusedIndex((i) => Math.min(rows.length - 1, (i ?? 0) + 1));
      else if (e.key === "Escape") setFocusedIndex(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, rows.length]);

  async function handleDownloadFocused(row: DataRow) {
    setDownloading(true);
    try {
      const blob = await renderCardToBlob(project.card, project.elements, row, project.assets);
      const nameField = project.data.columns.find((c) => c.toLowerCase() === "name");
      const base = nameField ? row[nameField] : "";
      downloadBlob(blob, `${sanitizeFilename(base || project.name)}.png`);
    } finally {
      setDownloading(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="empty-view">
        <h2>Пока нечего генерировать</h2>
        <p className="hint-text">Сначала импортируйте данные — по одной карточке на строку.</p>
        <button className="btn-primary" onClick={() => setShowImport(true)}>
          Импорт данных
        </button>
        {showImport && <DataImportDialog onClose={() => setShowImport(false)} />}
      </div>
    );
  }

  if (focusedIndex !== null) {
    const row = rows[focusedIndex];
    return (
      <div className="preview-focus">
        <div className="preview-focus-toolbar">
          <button className="btn-ghost" onClick={() => setFocusedIndex(null)}>
            ← Все карточки
          </button>
          <span className="hint-text">
            Карточка {focusedIndex + 1} из {rows.length}
          </span>
          <button className="btn-primary" onClick={() => handleDownloadFocused(row)} disabled={downloading}>
            {downloading ? "Рендеринг…" : "Скачать PNG"}
          </button>
        </div>
        <div className="preview-focus-stage">
          <button
            className="preview-nav-btn"
            disabled={focusedIndex === 0}
            onClick={() => setFocusedIndex((i) => Math.max(0, (i ?? 0) - 1))}
            aria-label="Предыдущая карточка"
          >
            ‹
          </button>
          <div className="preview-focus-card">
            <CardThumbnail
              card={project.card}
              elements={project.elements}
              dataRow={row}
              assets={project.assets}
              targetWidth={FOCUS_MAX_WIDTH}
            />
          </div>
          <button
            className="preview-nav-btn"
            disabled={focusedIndex === rows.length - 1}
            onClick={() => setFocusedIndex((i) => Math.min(rows.length - 1, (i ?? 0) + 1))}
            aria-label="Следующая карточка"
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-grid-view">
      <div className="data-view-header">
        <div>
          <h2 className="data-view-title">Сгенерированные карточки</h2>
          <p className="hint-text">
            {rows.length} {pluralCards(rows.length)} из текущего шаблона
          </p>
        </div>
      </div>
      <div className="preview-grid">
        {rows.map((row, i) => (
          <button className="preview-grid-item" key={i} onClick={() => setFocusedIndex(i)}>
            <CardThumbnail
              card={project.card}
              elements={project.elements}
              dataRow={row}
              assets={project.assets}
              targetWidth={GRID_THUMB_WIDTH}
            />
            <span className="preview-grid-caption">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
