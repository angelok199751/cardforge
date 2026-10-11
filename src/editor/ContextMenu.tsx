import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useProjectStore } from "../state/projectStore";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ x, y, onClose }: Props) {
  const ids = useProjectStore((s) => s.selectedElementIds);
  const elements = useProjectStore((s) => s.project.elements);
  const clipboard = useProjectStore((s) => s.clipboard);
  const copySelected = useProjectStore((s) => s.copySelected);
  const paste = useProjectStore((s) => s.paste);
  const duplicateElements = useProjectStore((s) => s.duplicateElements);
  const removeElements = useProjectStore((s) => s.removeElements);
  const setLocked = useProjectStore((s) => s.setLocked);
  const groupSelected = useProjectStore((s) => s.groupSelected);
  const ungroupSelected = useProjectStore((s) => s.ungroupSelected);
  const moveLayers = useProjectStore((s) => s.moveLayers);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  const selected = elements.filter((el) => ids.includes(el.id));
  const has = selected.length > 0;
  const allLocked = has && selected.every((el) => el.locked);
  const anyGrouped = selected.some((el) => el.groupId);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // не выходим за экран
  useEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: Math.min(x, window.innerWidth - r.width - 8),
      y: Math.min(y, window.innerHeight - r.height - 8),
    });
  }, [x, y]);

  function run(fn: () => void) {
    return () => {
      fn();
      onClose();
    };
  }

  const items: ({ label: string; hint?: string; action: () => void; disabled?: boolean } | "sep")[] = [
    { label: "Копировать", hint: "Ctrl+C", action: copySelected, disabled: !has },
    { label: "Вставить", hint: "Ctrl+V", action: paste, disabled: clipboard.length === 0 },
    { label: "Дублировать", hint: "Ctrl+D", action: () => duplicateElements(ids), disabled: !has },
    "sep",
    { label: allLocked ? "Открепить" : "Закрепить", action: () => setLocked(ids, !allLocked), disabled: !has },
    { label: "Сгруппировать", action: groupSelected, disabled: ids.length < 2 },
    { label: "Разгруппировать", action: ungroupSelected, disabled: !anyGrouped },
    "sep",
    { label: "На передний план", action: () => moveLayers(ids, "front"), disabled: !has },
    { label: "Переместить вперёд", action: () => moveLayers(ids, "up"), disabled: !has },
    { label: "Переместить назад", action: () => moveLayers(ids, "down"), disabled: !has },
    { label: "На задний план", action: () => moveLayers(ids, "back"), disabled: !has },
    "sep",
    { label: "Удалить", hint: "Del", action: () => removeElements(ids), disabled: !has },
  ];

  return createPortal(
    <div
      ref={ref}
      className="context-menu"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) =>
        it === "sep" ? (
          <div key={i} className="context-menu-sep" />
        ) : (
          <button key={i} className="context-menu-item" disabled={it.disabled} onClick={run(it.action)}>
            <span>{it.label}</span>
            {it.hint && <span className="context-menu-hint">{it.hint}</span>}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
