import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { missingFieldsFor } from "../renderer/binding";

const TYPE_GLYPH: Record<string, string> = {
  text: "T",
  image: "▧",
  value: "#",
  "shape-rect": "▭",
  "shape-circle": "○",
  "shape-line": "╱",
  "shape-polygon": "⬠",
  "shape-heart": "♥",
};

export function LayersPanel() {
  const elements = useProjectStore((s) => s.project.elements);
  const selectedIds = useProjectStore((s) => s.selectedElementIds);
  const selectElement = useProjectStore((s) => s.selectElement);
  const toggleElementSelection = useProjectStore((s) => s.toggleElementSelection);
  const updateElement = useProjectStore((s) => s.updateElement);
  const removeElement = useProjectStore((s) => s.removeElement);
  const duplicateElement = useProjectStore((s) => s.duplicateElement);
  const moveLayer = useProjectStore((s) => s.moveLayer);
  const moveElementToIndex = useProjectStore((s) => s.moveElementToIndex);
  const columns = useProjectStore((s) => s.project.data.columns);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Top of the list = top of the stack (highest zIndex first).
  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      const targetVisualIndex = ordered.findIndex((el) => el.id === targetId);
      const targetArrayIndex = elements.length - 1 - targetVisualIndex;
      moveElementToIndex(draggedId, targetArrayIndex);
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  if (elements.length === 0) {
    return (
      <div className="panel layers-panel">
        <h3 className="panel-title">Слои</h3>
        <p className="hint-text">Добавленные элементы появятся здесь.</p>
      </div>
    );
  }

  return (
    <div className="panel layers-panel">
      <h3 className="panel-title">Слои</h3>
      <div className="layer-list">
        {ordered.map((el) => {
          const isSelected = selectedIds.includes(el.id);
          return (
            <div
              key={el.id}
              draggable
              onDragStart={() => setDraggedId(el.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedId && draggedId !== el.id) setDragOverId(el.id);
              }}
              onDragLeave={() => setDragOverId((current) => (current === el.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(el.id);
              }}
              className={[
                "layer-row",
                isSelected ? "selected" : "",
                dragOverId === el.id ? "drag-over" : "",
                draggedId === el.id ? "dragging" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={(e) => {
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                  toggleElementSelection(el.id);
                } else {
                  selectElement(el.id);
                }
              }}
            >
              <button
                className="layer-visibility"
                title={el.visible ? "Скрыть" : "Показать"}
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(el.id, { visible: !el.visible });
                }}
              >
                {el.visible ? "●" : "○"}
              </button>

              <span className="layer-glyph">{TYPE_GLYPH[el.type] ?? "?"}</span>

              {missingFieldsFor(el, columns).length > 0 && (
                <span className="layer-warning" title="Поле не найдено в импортированных данных">
                  ⚠
                </span>
              )}

              {renamingId === el.id ? (
                <input
                  autoFocus
                  className="layer-name-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    updateElement(el.id, { name: draft.trim() || el.name });
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                />
              ) : (
                <span
                  className="layer-name"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setDraft(el.name);
                    setRenamingId(el.id);
                  }}
                  title="Двойной клик — переименовать"
                >
                  {el.name}
                </span>
              )}

              <div className="layer-actions">
                <button
                  className="layer-action-btn"
                  title="Поднять выше"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(el.id, "up");
                  }}
                >
                  ↑
                </button>
                <button
                  className="layer-action-btn"
                  title="Опустить ниже"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(el.id, "down");
                  }}
                >
                  ↓
                </button>
                <button
                  className="layer-action-btn"
                  title="Дублировать"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateElement(el.id);
                  }}
                >
                  ⧉
                </button>
                <button
                  className="layer-action-btn danger"
                  title="Удалить"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(el.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
