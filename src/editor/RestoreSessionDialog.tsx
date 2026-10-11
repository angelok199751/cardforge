import type { Project } from "../types";

interface RestoreSessionDialogProps {
  project: Project;
  onRestore: () => void;
  onDiscard: () => void;
}

function pluralElements(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "элемент";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "элемента";
  return "элементов";
}

function pluralRows(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "строка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "строки";
  return "строк";
}

export function RestoreSessionDialog({ project, onRestore, onDiscard }: RestoreSessionDialogProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Восстановить предыдущую сессию?</h2>
        <p className="hint-text">
          Cardforge автоматически сохранил «{project.name}» ({project.elements.length}{" "}
          {pluralElements(project.elements.length)}, {project.data.rows.length}{" "}
          {pluralRows(project.data.rows.length)} данных) с прошлого визита в этом браузере.
        </p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onDiscard}>
            Начать заново
          </button>
          <button className="btn-primary" onClick={onRestore}>
            Восстановить
          </button>
        </div>
      </div>
    </div>
  );
}
