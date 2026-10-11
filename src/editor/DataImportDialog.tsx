import { useState } from "react";
import { parseDelimitedText } from "../data/parseTable";
import { useProjectStore } from "../state/projectStore";

interface DataImportDialogProps {
  onClose: () => void;
}

type Tab = "paste" | "upload";

function pluralColumns(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "колонка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "колонки";
  return "колонок";
}

function pluralRows(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "строка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "строки";
  return "строк";
}

export function DataImportDialog({ onClose }: DataImportDialogProps) {
  const importData = useProjectStore((s) => s.importData);
  const existingRowCount = useProjectStore((s) => s.project.data.rows.length);
  const setView = useProjectStore((s) => s.setView);

  const [tab, setTab] = useState<Tab>("paste");
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sourceText = tab === "paste" ? pasteText : fileText;
  const preview = sourceText.trim() ? parseDelimitedText(sourceText) : null;

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function handleImport() {
    if (!preview || preview.columns.length === 0 || preview.rows.length === 0) {
      setError("Не удалось найти ни одной строки для импорта. Проверьте формат и попробуйте снова.");
      return;
    }
    importData(preview);
    setView("data");
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-wide">
        <h2 className="modal-title">Импорт данных</h2>

        {existingRowCount > 0 && (
          <p className="hint-text warning">
            Это заменит уже загруженные данные ({existingRowCount} {pluralRows(existingRowCount)}).
          </p>
        )}

        <div className="segmented compact" style={{ marginBottom: 14 }}>
          <button className={tab === "paste" ? "segmented-btn active" : "segmented-btn"} onClick={() => setTab("paste")}>
            Вставить таблицу
          </button>
          <button
            className={tab === "upload" ? "segmented-btn active" : "segmented-btn"}
            onClick={() => setTab("upload")}
          >
            Загрузить CSV
          </button>
        </div>

        {tab === "paste" ? (
          <label className="field">
            <span className="field-label">
              Вставьте данные из Excel / Google Таблиц или введите значения через запятую. Первая строка считается
              заголовками.
            </span>
            <textarea
              className="text-input textarea mono"
              rows={8}
              placeholder={"name\tattack\thealth\nGoblin\t2\t5\nOrc\t5\t12"}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          </label>
        ) : (
          <label className="field">
            <span className="field-label">CSV-файл</span>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="file-input"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {fileName && <span className="hint-text">Загружен: {fileName}</span>}
          </label>
        )}

        {preview && preview.columns.length > 0 && (
          <div className="import-preview">
            <p className="hint-text">
              Обнаружено: {preview.columns.length} {pluralColumns(preview.columns.length)} · {preview.rows.length}{" "}
              {pluralRows(preview.rows.length)}
            </p>
            <div className="mini-table-wrap">
              <table className="mini-table">
                <thead>
                  <tr>
                    {preview.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 4).map((row, i) => (
                    <tr key={i}>
                      {preview.columns.map((col) => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 4 && <p className="hint-text">…и ещё {preview.rows.length - 4}</p>}
          </div>
        )}

        {error && <p className="hint-text warning">{error}</p>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-primary" onClick={handleImport} disabled={!preview || preview.rows.length === 0}>
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}
