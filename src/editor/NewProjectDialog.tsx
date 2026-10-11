import { useState } from "react";
import { CARD_PRESETS, toPx, type CardSettings, type LengthUnit, type Orientation } from "../types";
import { useProjectStore } from "../state/projectStore";
import { resetHistory } from "../state/history";

interface NewProjectDialogProps {
  onClose: () => void;
}

export function NewProjectDialog({ onClose }: NewProjectDialogProps) {
  const createProject = useProjectStore((s) => s.createProject);

  const [name, setName] = useState("Без названия");
  const [presetIndex, setPresetIndex] = useState(CARD_PRESETS.length - 1); // "Custom" by default
  const [width, setWidth] = useState(750);
  const [height, setHeight] = useState(1050);
  const [unit, setUnit] = useState<LengthUnit>("px");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  function applyPreset(index: number) {
    setPresetIndex(index);
    const preset = CARD_PRESETS[index];
    setWidth(preset.width);
    setHeight(preset.height);
    setUnit(preset.unit);
  }

  function handleOrientationChange(next: Orientation) {
    setOrientation(next);
    const isPortraitNow = height >= width;
    const shouldSwap = (next === "landscape" && isPortraitNow) || (next === "portrait" && !isPortraitNow);
    if (shouldSwap) {
      setWidth(height);
      setHeight(width);
    }
  }

  function handleCreate() {
    const card: CardSettings = {
      width: toPx(width, unit),
      height: toPx(height, unit),
      unit,
      orientation,
      background: { kind: "color", color: "#F5F1E8" },
      border: { enabled: true, color: "#1F1B16", width: 6, radius: 24 },
    };
    createProject(name.trim() || "Без названия", card);
    resetHistory();
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Новый проект</h2>

        <label className="field">
          <span className="field-label">Название проекта</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="text-input" />
        </label>

        <label className="field">
          <span className="field-label">Размер карточки</span>
          <select
            value={presetIndex}
            onChange={(e) => applyPreset(Number(e.target.value))}
            className="text-input"
          >
            {CARD_PRESETS.map((preset, i) => (
              <option key={preset.label} value={i}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Ширина</span>
            <input
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="text-input mono"
            />
          </label>
          <label className="field">
            <span className="field-label">Высота</span>
            <input
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="text-input mono"
            />
          </label>
          <label className="field">
            <span className="field-label">Единицы</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value as LengthUnit)} className="text-input">
              <option value="px">px</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </label>
        </div>

        <div className="field">
          <span className="field-label">Ориентация</span>
          <div className="segmented">
            <button
              className={orientation === "portrait" ? "segmented-btn active" : "segmented-btn"}
              onClick={() => handleOrientationChange("portrait")}
            >
              Портрет
            </button>
            <button
              className={orientation === "landscape" ? "segmented-btn active" : "segmented-btn"}
              onClick={() => handleOrientationChange("landscape")}
            >
              Альбом
            </button>
          </div>
        </div>

        {unit !== "px" && (
          <p className="hint-text">
            Хранится внутри как {toPx(width, unit)}×{toPx(height, unit)} px (~300 DPI) для печати в хорошем качестве.
          </p>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            Создать проект
          </button>
        </div>
      </div>
    </div>
  );
}
