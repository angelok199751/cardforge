import { useRef, useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { DataImportDialog } from "./DataImportDialog";
import { ExportDialog } from "./ExportDialog";
import { PrintPdfDialog } from "./PrintPdfDialog";
import { downloadProjectFile, ProjectFileError, readProjectFile } from "../storage/projectFile";
import { resetHistory, undo, redo, useHistoryStatus } from "../state/history";
import type { AppView } from "../state/projectStore";

interface TopBarProps {
  onNewProject: () => void;
  onShowAbout: () => void;
}

const VIEW_TABS: { id: AppView; label: string }[] = [
  { id: "template", label: "Шаблон" },
  { id: "data", label: "Данные" },
  { id: "preview", label: "Просмотр" },
];

export function TopBar({ onNewProject, onShowAbout }: TopBarProps) {
  const project = useProjectStore((s) => s.project);
  const renameProject = useProjectStore((s) => s.renameProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const view = useProjectStore((s) => s.view);
  const setView = useProjectStore((s) => s.setView);
  const rowCount = useProjectStore((s) => s.project.data.rows.length);
  const historyStatus = useHistoryStatus();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPrintPdf, setShowPrintPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commitRename() {
    renameProject(draft.trim() || "Без названия");
    setEditing(false);
  }

  async function handleFileChosen(file: File) {
    try {
      const loaded = await readProjectFile(file);
      loadProject(loaded);
      resetHistory();
    } catch (err) {
      setLoadError(err instanceof ProjectFileError ? err.message : "Не удалось открыть файл.");
    }
  }

  return (
    <header className="topbar">
      <button className="topbar-brand" onClick={onShowAbout} title="О Карточнице">
        Карточница
      </button>

      {editing ? (
        <input
          autoFocus
          className="text-input project-name-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === "Enter" && commitRename()}
        />
      ) : (
        <button
          className="project-name-btn"
          onClick={() => {
            setDraft(project.name);
            setEditing(true);
          }}
        >
          {project.name}
        </button>
      )}

      <nav className="view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            className={view === tab.id ? "view-tab active" : "view-tab"}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
            {tab.id === "preview" && rowCount > 0 && <span className="view-tab-badge">{rowCount}</span>}
          </button>
        ))}
      </nav>

      <div className="history-buttons">
        <button
          className="icon-btn"
          onClick={() => undo()}
          disabled={!historyStatus.canUndo}
          title="Отменить (Ctrl/Cmd+Z)"
        >
          ↶
        </button>
        <button
          className="icon-btn"
          onClick={() => redo()}
          disabled={!historyStatus.canRedo}
          title="Повторить (Ctrl/Cmd+Shift+Z)"
        >
          ↷
        </button>
      </div>

      <div className="topbar-actions">
        <button className="btn-ghost" onClick={onNewProject}>
          Новый проект
        </button>
        <button className="btn-ghost" onClick={() => downloadProjectFile(project)}>
          Сохранить
        </button>
        <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
          Загрузить
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".cardforge,application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChosen(file);
            e.target.value = "";
          }}
        />
        <button className="btn-ghost" onClick={() => setShowImport(true)}>
          Импорт данных
        </button>
        <button className="btn-ghost" onClick={() => setShowPrintPdf(true)}>
          Печать PDF
        </button>
        <button className="btn-primary" onClick={() => setShowExport(true)}>
          Экспорт
        </button>
      </div>

      {loadError && (
        <div className="modal-overlay" onClick={() => setLoadError(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Не удалось открыть проект</h2>
            <p className="hint-text warning">{loadError}</p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setLoadError(null)}>
                ОК
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && <DataImportDialog onClose={() => setShowImport(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showPrintPdf && <PrintPdfDialog onClose={() => setShowPrintPdf(false)} />}
    </header>
  );
}
