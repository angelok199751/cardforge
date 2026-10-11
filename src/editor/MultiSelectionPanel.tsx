import { useProjectStore } from "../state/projectStore";

interface MultiSelectionPanelProps {
  ids: string[];
}

function pluralElements(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "элемент";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "элемента";
  return "элементов";
}

export function MultiSelectionPanel({ ids }: MultiSelectionPanelProps) {
  const duplicateElements = useProjectStore((s) => s.duplicateElements);
  const removeElements = useProjectStore((s) => s.removeElements);
  const selectElement = useProjectStore((s) => s.selectElement);

  return (
    <div className="panel">
      <div className="element-panel-header">
        <h3 className="panel-title">
          Выделено {ids.length} {pluralElements(ids.length)}
        </h3>
        <button className="icon-link-btn" onClick={() => selectElement(null)} title="Снять выделение">
          × Снять выделение
        </button>
      </div>

      <p className="hint-text">
        Перетащите любой из них, чтобы сдвинуть всю группу вместе. Чтобы редактировать свойства отдельного элемента,
        выделите только его.
      </p>

      <section className="panel-section">
        <div className="element-panel-footer">
          <button className="btn-ghost" onClick={() => duplicateElements(ids)}>
            Дублировать все
          </button>
          <button className="btn-ghost danger" onClick={() => removeElements(ids)}>
            Удалить все
          </button>
        </div>
      </section>
    </div>
  );
}
