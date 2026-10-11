import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { CardRenderer } from "../renderer/CardRenderer";
import { ElementLayer } from "./ElementLayer";

export function Canvas() {
  const project = useProjectStore((s) => s.project);
  const zoom = useProjectStore((s) => s.zoom);
  const setZoom = useProjectStore((s) => s.setZoom);
  const selectElement = useProjectStore((s) => s.selectElement);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRow = project.data.rows[0];
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Ctrl/Cmd + колесо = масштаб. Нативный слушатель (не passive), иначе браузер масштабирует всю страницу.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    function onWheel(e: globalThis.WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const st = useProjectStore.getState();
      st.setZoom(st.zoom + (e.deltaY > 0 ? -0.08 : 0.08));
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  // Горячие клавиши
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;

      const st = useProjectStore.getState();
      const ids = st.selectedElementIds;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Масштаб: + / − / Ctrl+0
      if (!e.altKey && (key === "+" || key === "=")) {
        e.preventDefault();
        st.setZoom(st.zoom + 0.1);
        return;
      }
      if (!e.altKey && (key === "-" || key === "_")) {
        e.preventDefault();
        st.setZoom(st.zoom - 0.1);
        return;
      }
      if (mod && key === "0") {
        e.preventDefault();
        st.setZoom(1);
        return;
      }

      if (mod && key === "a") {
        e.preventDefault();
        st.selectElements(st.project.elements.map((el) => el.id));
        return;
      }
      if (mod && key === "v") {
        e.preventDefault();
        st.paste();
        return;
      }
      if (ids.length === 0) return;

      if (mod && key === "c") {
        e.preventDefault();
        st.copySelected();
      } else if (mod && key === "x") {
        e.preventDefault();
        st.copySelected();
        st.removeElements(ids);
      } else if (mod && key === "d") {
        e.preventDefault();
        st.duplicateElements(ids);
      } else if (mod && key === "g") {
        e.preventDefault();
        if (e.shiftKey) st.ungroupSelected();
        else st.groupSelected();
      } else if (mod && e.shiftKey && key === "l") {
        e.preventDefault();
        const sel = st.project.elements.filter((el) => ids.includes(el.id));
        st.setLocked(ids, !sel.every((el) => el.locked));
      } else if (mod && (e.code === "BracketRight" || e.code === "BracketLeft")) {
        e.preventDefault();
        const forward = e.code === "BracketRight";
        st.moveLayers(ids, e.shiftKey ? (forward ? "front" : "back") : forward ? "up" : "down");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        st.removeElements(ids);
      } else if (e.key === "Escape") {
        st.selectElement(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        st.setElementPositions(
          st.project.elements
            .filter((el) => ids.includes(el.id) && !el.locked)
            .map((el) => ({ id: el.id, x: el.x + dx, y: el.y + dy }))
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="canvas-shell">
      <div className="canvas-scroll" ref={scrollRef}>
        <div className="canvas-pad" onPointerDown={() => selectElement(null)}>
          <div
            className="card-stage"
            style={{
              width: project.card.width * zoom,
              height: project.card.height * zoom,
            }}
          >
            <div
              style={{
                width: project.card.width,
                height: project.card.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                position: "relative",
              }}
            >
              <CardRenderer card={project.card} elements={project.elements} dataRow={previewRow} assets={project.assets} />
              <ElementLayer elements={project.elements} zoom={zoom} card={project.card} snapEnabled={snapEnabled} />
            </div>
          </div>
        </div>
      </div>

      {previewRow && (
        <div className="preview-indicator">Предпросмотр по строке 1 из {project.data.rows.length}</div>
      )}

      <div className="zoom-bar">
        <button
          className={snapEnabled ? "zoom-btn active" : "zoom-btn"}
          onClick={() => setSnapEnabled((v) => !v)}
          title="Привязка к центру/краям карточки и другим элементам при перетаскивании"
        >
          ⌁
        </button>
        <span className="zoom-divider" />
        <button className="zoom-btn" onClick={() => setZoom(zoom - 0.1)} aria-label="Уменьшить">
          –
        </button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={() => setZoom(zoom + 0.1)} aria-label="Увеличить">
          +
        </button>
        <button className="zoom-reset" onClick={() => setZoom(1)}>
          Сброс
        </button>
      </div>
    </div>
  );
}
