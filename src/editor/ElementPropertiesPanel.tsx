import { useProjectStore } from "../state/projectStore";
import { applyMode, defaultPoints, getLinePoints, removePoint } from "../renderer/linePath";
import type { ReactNode } from "react";
import { ICONS, IconButton } from "./IconButton";
import { FontPicker } from "./FontPicker";
import { missingFieldsFor } from "../renderer/binding";
import type { AssetLibrary, BackgroundFit, CardElement, ElementPatch, PointMode } from "../types";

interface ElementPropertiesPanelProps {
  element: CardElement;
}

const ALIGN_LABELS: Record<string, string> = { left: "слева", center: "по центру", right: "справа" };
const VALIGN_LABELS: Record<string, string> = { top: "сверху", middle: "по центру", bottom: "снизу" };
const FIT_LABELS: Record<string, string> = { cover: "Заполнить", contain: "Вписать", stretch: "Растянуть" };

export function ElementPropertiesPanel({ element }: ElementPropertiesPanelProps) {
  const updateElement = useProjectStore((s) => s.updateElement);
  const removeElement = useProjectStore((s) => s.removeElement);
  const duplicateElement = useProjectStore((s) => s.duplicateElement);
  const selectElement = useProjectStore((s) => s.selectElement);
  const columns = useProjectStore((s) => s.project.data.columns);
  const assets = useProjectStore((s) => s.project.assets);

  const selectedPoint = useProjectStore((s) => s.selectedPoint);
  const setSelectedPoint = useProjectStore((s) => s.setSelectedPoint);
  const missing = missingFieldsFor(element, columns);

  function patch(p: ElementPatch) {
    updateElement(element.id, p);
  }

  function handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => patch({ srcDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="panel">
      <div className="element-panel-header">
        <h3 className="panel-title">{element.name}</h3>
        <button className="icon-link-btn" onClick={() => selectElement(null)} title="Вернуться к свойствам карточки">
          × Снять выделение
        </button>
      </div>

      <section className="panel-section">
        <h4 className="panel-section-title">Позиция и размер</h4>
        <div className="field-row">
          <label className="field">
            <span className="field-label">X</span>
            <input
              type="number"
              className="text-input mono"
              value={Math.round(element.x)}
              onChange={(e) => patch({ x: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Y</span>
            <input
              type="number"
              className="text-input mono"
              value={Math.round(element.y)}
              onChange={(e) => patch({ y: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Ширина</span>
            <input
              type="number"
              min={1}
              className="text-input mono"
              value={Math.round(element.width)}
              onChange={(e) => patch({ width: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Высота</span>
            <input
              type="number"
              min={1}
              className="text-input mono"
              value={Math.round(element.height)}
              onChange={(e) => patch({ height: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Поворот</span>
            <input
              type="number"
              className="text-input mono"
              value={element.rotation}
              onChange={(e) => patch({ rotation: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Прозрачность</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className="text-input mono"
              value={element.opacity}
              onChange={(e) => patch({ opacity: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={element.visible} onChange={(e) => patch({ visible: e.target.checked })} />
          <span>Видимый</span>
        </label>
      </section>

      {renderTypeSpecificFields(
        element,
        patch,
        handleImageUpload,
        assets,
        selectedPoint && selectedPoint.elementId === element.id ? selectedPoint.index : null,
        setSelectedPoint
      )}

      {missing.length > 0 && (
        <p className="hint-text warning">
          {missing.length > 1 ? "Поля" : "Поле"} "{missing.join('", "')}"{" "}
          {missing.length > 1 ? "не найдены" : "не найдено"} в импортированных данных.
        </p>
      )}

      <section className="panel-section">
        <div className="element-panel-footer">
          <button className="btn-ghost" onClick={() => duplicateElement(element.id)}>
            Дублировать
          </button>
          <button className="btn-ghost danger" onClick={() => removeElement(element.id)}>
            Удалить
          </button>
        </div>
      </section>
    </div>
  );
}

function renderTypeSpecificFields(
  element: CardElement,
  patch: (p: ElementPatch) => void,
  handleImageUpload: (file: File) => void,
  assets: AssetLibrary,
  selectedPointIndex: number | null,
  setSelectedPoint: (p: { elementId: string; index: number } | null) => void
) {
  switch (element.type) {
    case "text":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Текст</h4>
          <label className="field">
            <span className="field-label">Содержимое (используйте ${"{"}поле{"}"} для привязки к данным)</span>
            <textarea
              className="text-input textarea"
              rows={3}
              value={element.content}
              onChange={(e) => patch({ content: e.target.value })}
            />
          </label>
          <FontPicker value={element.fontFamily} onChange={(v) => patch({ fontFamily: v })} />
          <div className="field-row">
            <label className="field">
              <span className="field-label">Размер шрифта</span>
              <input
                type="number"
                className="text-input mono"
                value={element.fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Цвет</span>
              <input
                type="color"
                className="color-input"
                value={element.color}
                onChange={(e) => patch({ color: e.target.value })}
              />
            </label>
          </div>
          <div className="segmented compact">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                className={element.align === align ? "segmented-btn active" : "segmented-btn"}
                onClick={() => patch({ align })}
              >
                {ALIGN_LABELS[align]}
              </button>
            ))}
          </div>
          <div className="segmented compact" style={{ marginTop: 6 }}>
            {(["top", "middle", "bottom"] as const).map((v) => (
              <button
                key={v}
                className={element.verticalAlign === v ? "segmented-btn active" : "segmented-btn"}
                onClick={() => patch({ verticalAlign: v })}
              >
                {VALIGN_LABELS[v]}
              </button>
            ))}
          </div>
          <div className="toggle-row">
            <button
              className={element.bold ? "toggle-btn active" : "toggle-btn"}
              onClick={() => patch({ bold: !element.bold })}
              title="Жирный"
            >
              Ж
            </button>
            <button
              className={element.italic ? "toggle-btn active" : "toggle-btn"}
              onClick={() => patch({ italic: !element.italic })}
              title="Курсив"
            >
              К
            </button>
            <button
              className={element.underline ? "toggle-btn active" : "toggle-btn"}
              onClick={() => patch({ underline: !element.underline })}
              title="Подчёркнутый"
            >
              Ч
            </button>
          </div>
        </section>
      );

    case "value":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Значение</h4>
          <label className="field">
            <span className="field-label">Привязка к данным (имя поля)</span>
            <input
              className="text-input mono"
              placeholder="например, attack"
              value={element.dataBinding}
              onChange={(e) => patch({ dataBinding: e.target.value })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Префикс</span>
              <input
                className="text-input"
                value={element.prefix}
                onChange={(e) => patch({ prefix: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Суффикс</span>
              <input
                className="text-input"
                value={element.suffix}
                onChange={(e) => patch({ suffix: e.target.value })}
              />
            </label>
          </div>
          <FontPicker value={element.fontFamily} onChange={(v) => patch({ fontFamily: v })} />
          <div className="field-row">
            <label className="field">
              <span className="field-label">Размер шрифта</span>
              <input
                type="number"
                className="text-input mono"
                value={element.fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Цвет</span>
              <input
                type="color"
                className="color-input"
                value={element.color}
                onChange={(e) => patch({ color: e.target.value })}
              />
            </label>
          </div>
          <p className="hint-text">Данные ещё не импортированы — привязка заработает после импорта таблицы.</p>
        </section>
      );

    case "image": {
      const assetNames = Object.keys(assets ?? {}).sort((a, b) => a.localeCompare(b));
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Изображение</h4>
          <label className="field">
            <span className="field-label">Загрузить (статично)</span>
            <input
              type="file"
              className="file-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
          </label>

          {assetNames.length > 0 && (
            <div className="field">
              <span className="field-label">Или выбрать из библиотеки</span>
              <div className="asset-picker-grid">
                {assetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="asset-picker-item"
                    title={name}
                    onClick={() => patch({ srcDataUrl: assets[name] })}
                  >
                    <div className="asset-thumb" style={{ backgroundImage: `url(${assets[name]})` }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="field">
            <span className="field-label">Или привязка к данным (имя поля)</span>
            <input
              className="text-input mono"
              placeholder="например, image"
              value={element.dataBinding ?? ""}
              onChange={(e) => patch({ dataBinding: e.target.value || undefined })}
            />
            <span className="hint-text">
              Значением привязанной колонки может быть полная ссылка на изображение или точное имя файла, загруженного
              в библиотеку на вкладке «Данные».
            </span>
          </label>
          <label className="field">
            <span className="field-label">Заполнение</span>
            <select
              className="text-input"
              value={element.fit}
              onChange={(e) => patch({ fit: e.target.value as BackgroundFit })}
            >
              <option value="cover">{FIT_LABELS.cover}</option>
              <option value="contain">{FIT_LABELS.contain}</option>
              <option value="stretch">{FIT_LABELS.stretch}</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Скругление углов</span>
            <input
              type="number"
              min={0}
              className="text-input mono"
              value={element.borderRadius}
              onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
            />
          </label>
        </section>
      );
    }

    case "shape-rect":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Прямоугольник</h4>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Заливка</span>
              <input
                type="color"
                className="color-input"
                value={element.fill}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Прозрачность заливки</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="text-input mono"
                value={element.fillOpacity}
                onChange={(e) => patch({ fillOpacity: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Обводка</span>
              <input
                type="color"
                className="color-input"
                value={element.strokeColor}
                onChange={(e) => patch({ strokeColor: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина обводки</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={element.strokeWidth}
                onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Скругление углов</span>
            <input
              type="number"
              min={0}
              className="text-input mono"
              value={element.borderRadius}
              onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
            />
          </label>
        </section>
      );

    case "shape-circle":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Круг</h4>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Заливка</span>
              <input
                type="color"
                className="color-input"
                value={element.fill}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Прозрачность заливки</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="text-input mono"
                value={element.fillOpacity}
                onChange={(e) => patch({ fillOpacity: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Обводка</span>
              <input
                type="color"
                className="color-input"
                value={element.strokeColor}
                onChange={(e) => patch({ strokeColor: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина обводки</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={element.strokeWidth}
                onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              />
            </label>
          </div>
        </section>
      );

    case "shape-line": {
      const line = element;
      const pts = getLinePoints(line);
      const isPath = !!pts;
      const pointIdx = pts && selectedPointIndex !== null && selectedPointIndex < pts.length ? selectedPointIndex : null;
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Линия</h4>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Цвет</span>
              <input
                type="color"
                className="color-input"
                value={line.color}
                onChange={(e) => patch({ color: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина</span>
              <input
                type="number"
                min={1}
                className="text-input mono"
                value={line.thickness}
                onChange={(e) =>
                  patch(
                    isPath
                      ? { thickness: Number(e.target.value) }
                      : { thickness: Number(e.target.value), height: Number(e.target.value) }
                  )
                }
              />
            </label>
          </div>
          <div className="icon-row">
            <IconButton
              tip="Прямая линия"
              active={!isPath}
              onClick={() => {
                if (!isPath) return;
                patch({
                  points: undefined,
                  curve: undefined,
                  height: line.thickness,
                  y: Math.round(line.y + line.height / 2 - line.thickness / 2),
                });
              }}
            >
              {ICONS.straight}
            </IconButton>
            <IconButton
              tip="Кривая Безье"
              active={isPath}
              onClick={() => {
                if (isPath) return;
                const h = 120;
                patch({
                  points: defaultPoints(),
                  height: h,
                  y: Math.round(line.y + line.height / 2 - h / 2),
                });
              }}
            >
              {ICONS.bezier}
            </IconButton>
          </div>
          {isPath && (
            <>
              <span className="field-hint">
                Двойной клик правой кнопкой по линии добавляет точку. Точки можно двигать, а их ручки — тянуть.
              </span>
              {pointIdx !== null && pts ? (
                <>
                  <h4 className="panel-section-title" style={{ marginTop: 12 }}>
                    Точка {pointIdx + 1} из {pts.length}
                  </h4>
                  <div className="icon-row">
                    {(
                      [
                        ["corner", "Прямой угол", ICONS.corner],
                        ["mirrored", "Симметрия (угол и длина)", ICONS.mirrored],
                        ["angle", "Угловая симметрия (только угол)", ICONS.angle],
                        ["free", "Асимметрия", ICONS.free],
                      ] as [PointMode, string, ReactNode][]
                    ).map(([m, label, icon]) => (
                      <IconButton
                        key={m}
                        tip={label}
                        active={pts[pointIdx].mode === m}
                        onClick={() => patch({ points: applyMode(pts, pointIdx, m, line.width, line.height) })}
                      >
                        {icon}
                      </IconButton>
                    ))}
                    <IconButton
                      tip="Удалить точку"
                      disabled={pts.length <= 2}
                      onClick={() => {
                        patch({ points: removePoint(pts, pointIdx) });
                        setSelectedPoint(null);
                      }}
                    >
                      {ICONS.trash}
                    </IconButton>
                  </div>
                </>
              ) : (
                <span className="field-hint">Выберите точку на холсте, чтобы настроить изгиб.</span>
              )}
            </>
          )}
        </section>
      );
    }

    case "shape-polygon":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Многоугольник</h4>
          <label className="field">
            <span className="field-label">Количество сторон ({element.sides})</span>
            <input
              type="range"
              min={3}
              max={100}
              className="range-input"
              value={element.sides}
              onChange={(e) => patch({ sides: Number(e.target.value) })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Заливка</span>
              <input
                type="color"
                className="color-input"
                value={element.fill}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Прозрачность заливки</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="text-input mono"
                value={element.fillOpacity}
                onChange={(e) => patch({ fillOpacity: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Обводка</span>
              <input
                type="color"
                className="color-input"
                value={element.strokeColor}
                onChange={(e) => patch({ strokeColor: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина обводки</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={element.strokeWidth}
                onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              />
            </label>
          </div>
          <p className="hint-text">
            3 стороны — треугольник, 4 — ромб, 5 и больше — пятиугольник и далее; при большом количестве сторон фигура
            становится похожа на круг. Повернуть в любую сторону можно полем «Поворот» выше.
          </p>
        </section>
      );

    case "shape-heart":
      return (
        <section className="panel-section">
          <h4 className="panel-section-title">Сердце</h4>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Заливка</span>
              <input
                type="color"
                className="color-input"
                value={element.fill}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Прозрачность заливки</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="text-input mono"
                value={element.fillOpacity}
                onChange={(e) => patch({ fillOpacity: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Обводка</span>
              <input
                type="color"
                className="color-input"
                value={element.strokeColor}
                onChange={(e) => patch({ strokeColor: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Толщина обводки</span>
              <input
                type="number"
                min={0}
                className="text-input mono"
                value={element.strokeWidth}
                onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              />
            </label>
          </div>
        </section>
      );
  }
}
