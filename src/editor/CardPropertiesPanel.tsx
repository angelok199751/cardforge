import { useProjectStore } from "../state/projectStore";
import type { BackgroundFit } from "../types";

const BACKGROUND_KIND_LABELS: Record<string, string> = {
  color: "Цвет",
  transparent: "Прозрачный",
  gradient: "Градиент",
  image: "Изображение",
};

export function CardPropertiesPanel() {
  const card = useProjectStore((s) => s.project.card);
  const updateBackground = useProjectStore((s) => s.updateBackground);
  const updateBorder = useProjectStore((s) => s.updateBorder);
  const setOrientation = useProjectStore((s) => s.setOrientation);

  function handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      updateBackground({ kind: "image", imageDataUrl: reader.result as string, fit: card.background.fit ?? "cover" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Карточка</h3>

      <section className="panel-section">
        <h4 className="panel-section-title">Размер</h4>
        <div className="kv-row">
          <span>Размеры</span>
          <span className="mono">
            {card.width} × {card.height} px
          </span>
        </div>
        <div className="kv-row">
          <span>Ориентация</span>
          <div className="segmented compact">
            <button
              className={card.orientation === "portrait" ? "segmented-btn active" : "segmented-btn"}
              onClick={() => setOrientation("portrait")}
            >
              Портрет
            </button>
            <button
              className={card.orientation === "landscape" ? "segmented-btn active" : "segmented-btn"}
              onClick={() => setOrientation("landscape")}
            >
              Альбом
            </button>
          </div>
        </div>
      </section>

      <section className="panel-section">
        <h4 className="panel-section-title">Фон</h4>
        <div className="segmented compact wrap">
          {(["color", "transparent", "gradient", "image"] as const).map((kind) => (
            <button
              key={kind}
              className={card.background.kind === kind ? "segmented-btn active" : "segmented-btn"}
              onClick={() => updateBackground({ kind })}
            >
              {BACKGROUND_KIND_LABELS[kind]}
            </button>
          ))}
        </div>

        {card.background.kind === "color" && (
          <label className="field">
            <span className="field-label">Цвет</span>
            <input
              type="color"
              value={card.background.color ?? "#ffffff"}
              onChange={(e) => updateBackground({ color: e.target.value })}
              className="color-input"
            />
          </label>
        )}

        {card.background.kind === "gradient" && (
          <>
            <label className="field">
              <span className="field-label">От</span>
              <input
                type="color"
                value={card.background.gradient?.from ?? "#ffffff"}
                onChange={(e) =>
                  updateBackground({
                    gradient: {
                      from: e.target.value,
                      to: card.background.gradient?.to ?? "#000000",
                      angle: card.background.gradient?.angle ?? 180,
                    },
                  })
                }
                className="color-input"
              />
            </label>
            <label className="field">
              <span className="field-label">До</span>
              <input
                type="color"
                value={card.background.gradient?.to ?? "#000000"}
                onChange={(e) =>
                  updateBackground({
                    gradient: {
                      from: card.background.gradient?.from ?? "#ffffff",
                      to: e.target.value,
                      angle: card.background.gradient?.angle ?? 180,
                    },
                  })
                }
                className="color-input"
              />
            </label>
            <label className="field">
              <span className="field-label">Угол</span>
              <input
                type="number"
                className="text-input mono"
                value={card.background.gradient?.angle ?? 180}
                onChange={(e) =>
                  updateBackground({
                    gradient: {
                      from: card.background.gradient?.from ?? "#ffffff",
                      to: card.background.gradient?.to ?? "#000000",
                      angle: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </>
        )}

        {card.background.kind === "image" && (
          <>
            <label className="field">
              <span className="field-label">Изображение</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="file-input"
              />
            </label>
            <label className="field">
              <span className="field-label">Заполнение</span>
              <select
                className="text-input"
                value={card.background.fit ?? "cover"}
                onChange={(e) => updateBackground({ fit: e.target.value as BackgroundFit })}
              >
                <option value="cover">Заполнить</option>
                <option value="contain">Вписать</option>
                <option value="stretch">Растянуть</option>
              </select>
            </label>
          </>
        )}
      </section>

      <section className="panel-section">
        <h4 className="panel-section-title">Рамка</h4>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={card.border.enabled}
            onChange={(e) => updateBorder({ enabled: e.target.checked })}
          />
          <span>Включена</span>
        </label>

        {card.border.enabled && (
          <>
            <label className="field">
              <span className="field-label">Цвет</span>
              <input
                type="color"
                value={card.border.color}
                onChange={(e) => updateBorder({ color: e.target.value })}
                className="color-input"
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={card.border.width}
                onChange={(e) => updateBorder({ width: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Скругление</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={card.border.radius}
                onChange={(e) => updateBorder({ radius: Number(e.target.value) })}
              />
            </label>
          </>
        )}
      </section>
    </div>
  );
}
