import { useProjectStore } from "../state/projectStore";
import type { ElementType } from "../types";

const TOOLS: { type: ElementType; label: string; glyph: string }[] = [
  { type: "text", label: "Текст", glyph: "T" },
  { type: "image", label: "Изображение", glyph: "▧" },
  { type: "value", label: "Значение", glyph: "#" },
  { type: "shape-rect", label: "Прямоугольник", glyph: "▭" },
  { type: "shape-circle", label: "Круг", glyph: "○" },
  { type: "shape-line", label: "Линия", glyph: "╱" },
  { type: "shape-polygon", label: "Многоугольник", glyph: "⬠" },
  { type: "shape-heart", label: "Сердце", glyph: "♥" },
];

/** Left rail: click a tool to drop a default-sized instance in the middle of the card. */
export function ToolsPanel() {
  const addElement = useProjectStore((s) => s.addElement);

  return (
    <div className="panel tools-panel">
      <h3 className="panel-title">Элементы</h3>
      <div className="tool-list">
        {TOOLS.map((tool) => (
          <button key={tool.type} className="tool-btn" onClick={() => addElement(tool.type)}>
            <span className="tool-glyph">{tool.glyph}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
