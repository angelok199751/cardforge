import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { fieldsReferencedBy } from "../renderer/binding";
import { DataImportDialog } from "./DataImportDialog";
import { AssetsPanel } from "./AssetsPanel";

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

export function DataTablePanel() {
  const data = useProjectStore((s) => s.project.data);
  const elements = useProjectStore((s) => s.project.elements);
  const updateDataCell = useProjectStore((s) => s.updateDataCell);
  const addDataRow = useProjectStore((s) => s.addDataRow);
  const deleteDataRow = useProjectStore((s) => s.deleteDataRow);
  const clearData = useProjectStore((s) => s.clearData);
  const addDataColumn = useProjectStore((s) => s.addDataColumn);
  const removeDataColumn = useProjectStore((s) => s.removeDataColumn);
  const renameDataColumn = useProjectStore((s) => s.renameDataColumn);

  const [showImport, setShowImport] = useState(false);
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [columnDraft, setColumnDraft] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnDraft, setNewColumnDraft] = useState("");

  // Columns referenced by the template but absent from the imported data —
  // surfaced once at the top rather than duplicated per-cell.
  const allReferencedFields = Array.from(new Set(elements.flatMap((el) => fieldsReferencedBy(el))));
  const missingTemplateFields =
    data.columns.length > 0 ? allReferencedFields.filter((f) => !data.columns.includes(f)) : [];

  function commitNewColumn() {
    const trimmed = newColumnDraft.trim();
    if (trimmed) addDataColumn(trimmed);
    setNewColumnDraft("");
    setAddingColumn(false);
  }

  function commitRenameColumn(oldName: string) {
    const trimmed = columnDraft.trim();
    if (trimmed && trimmed !== oldName) renameDataColumn(oldName, trimmed);
    setRenamingColumn(null);
  }

  if (data.columns.length === 0) {
    return (
      <div>
        <div className="empty-view">
          <h2>Данные ещё не импортированы</h2>
          <p className="hint-text">
            Загрузите CSV-файл или вставьте таблицу из Excel / Google Таблиц, чтобы начать.
          </p>
          <button className="btn-primary" onClick={() => setShowImport(true)}>
            Импорт данных
          </button>
          <p className="hint-text" style={{ marginTop: 18 }}>
            Или начните таблицу с нуля:
          </p>
          {addingColumn ? (
            <div className="field-row" style={{ justifyContent: "center" }}>
              <input
                autoFocus
                className="text-input"
                style={{ maxWidth: 180 }}
                placeholder="Название колонки"
                value={newColumnDraft}
                onChange={(e) => setNewColumnDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitNewColumn();
                  if (e.key === "Escape") setAddingColumn(false);
                }}
                onBlur={commitNewColumn}
              />
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setAddingColumn(true)}>
              + Добавить колонку
            </button>
          )}
          {showImport && <DataImportDialog onClose={() => setShowImport(false)} />}
        </div>

        <AssetsPanel />
      </div>
    );
  }

  return (
    <div className="data-view">
      <div className="data-view-header">
        <div>
          <h2 className="data-view-title">Данные</h2>
          <p className="hint-text">
            {data.columns.length} {pluralColumns(data.columns.length)} · {data.rows.length} {pluralRows(data.rows.length)}
          </p>
        </div>
        <div className="data-view-actions">
          <button className="btn-ghost" onClick={addDataRow}>
            Добавить строку
          </button>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            Импортировать заново
          </button>
          <button
            className="btn-ghost danger"
            onClick={() => {
              if (
                window.confirm(
                  `Удалить все ${data.rows.length} импортированных строк? Это можно отменить через Ctrl/Cmd+Z.`
                )
              ) {
                clearData();
              }
            }}
          >
            Очистить данные
          </button>
        </div>
      </div>

      {missingTemplateFields.length > 0 &&
        (missingTemplateFields.length > 1 ? (
          <p className="hint-text warning">
            Поля «{missingTemplateFields.join('», «')}», используемые в шаблоне, не найдены в импортированных
            данных.
          </p>
        ) : (
          <p className="hint-text warning">
            Поле «{missingTemplateFields[0]}», используемое в шаблоне, не найдено в импортированных данных.
          </p>
        ))}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-index-col" />
              {data.columns.map((col) => (
                <th key={col}>
                  {renamingColumn === col ? (
                    <input
                      autoFocus
                      className="column-name-input"
                      value={columnDraft}
                      onChange={(e) => setColumnDraft(e.target.value)}
                      onBlur={() => commitRenameColumn(col)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setRenamingColumn(null);
                      }}
                    />
                  ) : (
                    <div className="column-header">
                      <span
                        className="column-name"
                        title="Двойной клик — переименовать"
                        onDoubleClick={() => {
                          setColumnDraft(col);
                          setRenamingColumn(col);
                        }}
                      >
                        {col}
                      </span>
                      <button
                        className="layer-action-btn danger"
                        title="Удалить колонку"
                        onClick={() => removeDataColumn(col)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="add-column-col">
                {addingColumn ? (
                  <input
                    autoFocus
                    className="column-name-input"
                    placeholder="Название колонки"
                    value={newColumnDraft}
                    onChange={(e) => setNewColumnDraft(e.target.value)}
                    onBlur={commitNewColumn}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitNewColumn();
                      if (e.key === "Escape") setAddingColumn(false);
                    }}
                  />
                ) : (
                  <button className="layer-action-btn" title="Добавить колонку" onClick={() => setAddingColumn(true)}>
                    +
                  </button>
                )}
              </th>
              <th className="row-actions-col" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="row-index-col mono">{rowIndex + 1}</td>
                {data.columns.map((col) => (
                  <td key={col}>
                    <input
                      className="cell-input"
                      value={row[col] ?? ""}
                      onChange={(e) => updateDataCell(rowIndex, col, e.target.value)}
                    />
                  </td>
                ))}
                <td className="add-column-col" />
                <td className="row-actions-col">
                  <button
                    className="layer-action-btn danger"
                    title="Удалить строку"
                    onClick={() => deleteDataRow(rowIndex)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssetsPanel />

      {showImport && <DataImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
