import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useProjectStore } from "../state/projectStore";
import { ContextMenu } from "./ContextMenu";
import { computeSnap, type Guide } from "./alignment";
import { getLinePoints, insertPoint, movePoint, moveHandle, nearestOnPath } from "../renderer/linePath";
import type { CardElement, LineElement, PathPoint } from "../types";

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLES: HandlePosition[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const HANDLE_CURSOR: Record<HandlePosition, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

const MIN_SIZE = 8;
const SNAP_THRESHOLD_SCREEN_PX = 6;
const MARQUEE_DRAG_THRESHOLD = 3;

interface ElementLayerProps {
  elements: CardElement[];
  zoom: number;
  card: { width: number; height: number };
  snapEnabled: boolean;
}

export function ElementLayer({ elements, zoom, card, snapEnabled }: ElementLayerProps) {
  const selectedIds = useProjectStore((s) => s.selectedElementIds);
  const selectElement = useProjectStore((s) => s.selectElement);
  const selectElements = useProjectStore((s) => s.selectElements);
  const toggleElementSelection = useProjectStore((s) => s.toggleElementSelection);
  const updateElement = useProjectStore((s) => s.updateElement);
  const setElementPositions = useProjectStore((s) => s.setElementPositions);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  const selectedPoint = useProjectStore((s) => s.selectedPoint);
  const setSelectedPoint = useProjectStore((s) => s.setSelectedPoint);
  const lastRightClick = useRef<{ t: number; x: number; y: number } | null>(null);

  /** Клик (в экранных координатах) -> координаты внутри рамки элемента с учётом поворота. */
  function toLocal(el: CardElement, clientX: number, clientY: number) {
    const rect = rootRef.current!.getBoundingClientRect();
    const cx = (clientX - rect.left) / zoom - (el.x + el.width / 2);
    const cy = (clientY - rect.top) / zoom - (el.y + el.height / 2);
    const rad = (-el.rotation * Math.PI) / 180;
    return {
      x: cx * Math.cos(rad) - cy * Math.sin(rad) + el.width / 2,
      y: cx * Math.sin(rad) + cy * Math.cos(rad) + el.height / 2,
    };
  }

  function addPointAt(el: LineElement, clientX: number, clientY: number) {
    const pts = getLinePoints(el);
    if (!pts) return;
    const local = toLocal(el, clientX, clientY);
    const near = nearestOnPath(pts, el.width, el.height, local.x, local.y);
    if (near.dist > Math.max(24, el.thickness * 2) / Math.min(1, zoom)) return; // клик далеко от линии
    updateElement(el.id, { points: insertPoint(pts, el.width, el.height, near.seg, near.t) });
    setSelectedPoint({ elementId: el.id, index: near.seg + 1 });
  }

  function startPointDrag(el: LineElement, index: number, kind: "anchor" | "in" | "out") {
    return (e: ReactPointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const orig = getLinePoints(el);
      if (!orig) return;
      setSelectedPoint({ elementId: el.id, index });
      const startX = e.clientX;
      const startY = e.clientY;
      const rad = (-el.rotation * Math.PI) / 180;
      const op = orig[index];
      function move(ev: PointerEvent) {
        const dx = (ev.clientX - startX) / zoom;
        const dy = (ev.clientY - startY) / zoom;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        let next: PathPoint[];
        if (kind === "anchor") {
          next = movePoint(orig!, index, op.x + lx / el.width, op.y + ly / el.height);
        } else {
          const base = kind === "out" ? { x: op.outX * el.width, y: op.outY * el.height } : { x: op.inX * el.width, y: op.inY * el.height };
          next = moveHandle(orig!, index, kind, { x: base.x + lx, y: base.y + ly }, el.width, el.height);
        }
        updateElement(el.id, { points: next });
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
  }

  const rootRef = useRef<HTMLDivElement>(null);

  const dragState = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    mode: "move" | HandlePosition;
    /** All elements being moved together (>=1). Only meaningful for mode === "move". */
    groupOrigins: { id: string; x: number; y: number }[];
  } | null>(null);

  const marqueeState = useRef<{
    originX: number;
    originY: number;
    startClientX: number;
    startClientY: number;
    additive: boolean;
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;

      if (drag.mode === "move") {
        if (drag.groupOrigins.length > 1) {
          // Group move: shift every selected element by the same delta, no snapping (keeps this simple).
          const positions = drag.groupOrigins.map((o) => ({
            id: o.id,
            x: Math.round(o.x + dx),
            y: Math.round(o.y + dy),
          }));
          setElementPositions(positions);
          setGuides([]);
          return;
        }

        const rawX = drag.origX + dx;
        const rawY = drag.origY + dy;

        if (snapEnabled) {
          const threshold = SNAP_THRESHOLD_SCREEN_PX / zoom;
          const others = elements
            .filter((el) => el.id !== drag.id)
            .map((el) => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
          const snap = computeSnap({ x: rawX, y: rawY, width: drag.origW, height: drag.origH }, others, card, threshold);
          updateElement(drag.id, { x: Math.round(snap.x), y: Math.round(snap.y) });
          setGuides(snap.guides);
        } else {
          updateElement(drag.id, { x: Math.round(rawX), y: Math.round(rawY) });
        }
        return;
      }

      let { origX: x, origY: y, origW: w, origH: h } = drag;
      const mode = drag.mode;

      if (mode.includes("e")) w = Math.max(MIN_SIZE, drag.origW + dx);
      if (mode.includes("s")) h = Math.max(MIN_SIZE, drag.origH + dy);
      if (mode.includes("w")) {
        w = Math.max(MIN_SIZE, drag.origW - dx);
        x = drag.origX + (drag.origW - w);
      }
      if (mode.includes("n")) {
        h = Math.max(MIN_SIZE, drag.origH - dy);
        y = drag.origY + (drag.origH - h);
      }

      updateElement(drag.id, {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(w),
        height: Math.round(h),
      });
    },
    [zoom, updateElement, setElementPositions, elements, card, snapEnabled]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setGuides([]);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const startDrag = useCallback(
    (el: CardElement, mode: "move" | HandlePosition) => (e: ReactPointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return; // правая кнопка — только контекстное меню

      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (additive) {
        toggleElementSelection(el.id);
        return; // additive clicks only adjust the selection — drag separately to move
      }

      const isPartOfSelection = selectedIds.includes(el.id);
      if (!isPartOfSelection) {
        if (el.groupId) selectElements(elements.filter((c) => c.groupId === el.groupId).map((c) => c.id));
        else selectElement(el.id);
      }
      if (el.locked && mode !== "move") return;
      // else: clicking an element that's already part of a multi-selection keeps the whole
      // selection intact and drags the group together.

      let idsToMove: string[];
      if (mode !== "move") idsToMove = [el.id];
      else if (isPartOfSelection && selectedIds.length > 1) idsToMove = selectedIds;
      else if (el.groupId) idsToMove = elements.filter((c) => c.groupId === el.groupId).map((c) => c.id);
      else idsToMove = [el.id];
      idsToMove = idsToMove.filter((id) => !elements.find((c) => c.id === id)?.locked);
      if (idsToMove.length === 0) return;
      const groupOrigins = idsToMove.map((id) => {
        const found = elements.find((candidate) => candidate.id === id);
        return { id, x: found?.x ?? 0, y: found?.y ?? 0 };
      });

      const lead = elements.find((c) => c.id === (idsToMove.includes(el.id) ? el.id : idsToMove[0])) ?? el;
      dragState.current = {
        id: lead.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: lead.x,
        origY: lead.y,
        origW: lead.width,
        origH: lead.height,
        mode,
        groupOrigins,
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [selectedIds, selectElement, selectElements, toggleElementSelection, elements, handlePointerMove, handlePointerUp]
  );

  // --- Marquee (rubber-band) selection on empty canvas space ---

  const handleMarqueeMove = useCallback(
    (e: PointerEvent) => {
      const state = marqueeState.current;
      if (!state) return;
      const dx = (e.clientX - state.startClientX) / zoom;
      const dy = (e.clientY - state.startClientY) / zoom;
      setMarqueeRect({
        x: Math.min(state.originX, state.originX + dx),
        y: Math.min(state.originY, state.originY + dy),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    },
    [zoom]
  );

  const handleMarqueeUp = useCallback(() => {
    const state = marqueeState.current;
    marqueeState.current = null;
    window.removeEventListener("pointermove", handleMarqueeMove);
    window.removeEventListener("pointerup", handleMarqueeUp);

    setMarqueeRect((rectNow) => {
      if (!state || !rectNow) return null;
      const moved = rectNow.width > MARQUEE_DRAG_THRESHOLD || rectNow.height > MARQUEE_DRAG_THRESHOLD;

      if (moved) {
        const hits = elements
          .filter(
            (el) =>
              el.x < rectNow.x + rectNow.width &&
              el.x + el.width > rectNow.x &&
              el.y < rectNow.y + rectNow.height &&
              el.y + el.height > rectNow.y
          )
          .map((el) => el.id);

        if (state.additive) {
          selectElements(Array.from(new Set([...selectedIds, ...hits])));
        } else if (hits.length > 0) {
          selectElements(hits);
        } else {
          selectElement(null);
        }
      } else if (!state.additive) {
        // A plain click with no drag — clear the selection. An additive (shift/ctrl) click
        // that didn't move is left alone, so it doesn't wipe out an existing selection.
        selectElement(null);
      }
      return null;
    });
  }, [elements, selectElements, selectElement, selectedIds, handleMarqueeMove]);

  const handleRootPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      // Only fires for clicks that land directly on empty card background — per-element
      // handles already call stopPropagation, so they never reach here.
      e.stopPropagation();
      if (e.button !== 0 || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const originX = (e.clientX - rect.left) / zoom;
      const originY = (e.clientY - rect.top) / zoom;
      marqueeState.current = {
        originX,
        originY,
        startClientX: e.clientX,
        startClientY: e.clientY,
        additive: e.shiftKey || e.metaKey || e.ctrlKey,
      };
      setMarqueeRect({ x: originX, y: originY, width: 0, height: 0 });
      window.addEventListener("pointermove", handleMarqueeMove);
      window.addEventListener("pointerup", handleMarqueeUp);
    },
    [zoom, handleMarqueeMove, handleMarqueeUp]
  );

  function openMenu(e: ReactMouseEvent, el?: CardElement) {
    e.preventDefault();
    e.stopPropagation();
    // двойной правый клик по линии-кривой добавляет точку
    const now = Date.now();
    const last = lastRightClick.current;
    lastRightClick.current = { t: now, x: e.clientX, y: e.clientY };
    if (el && el.type === "shape-line" && getLinePoints(el) && last && now - last.t < 500 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 10) {
      lastRightClick.current = null;
      setMenu(null);
      if (!selectedIds.includes(el.id)) selectElement(el.id);
      addPointAt(el, e.clientX, e.clientY);
      return;
    }
    if (el && !selectedIds.includes(el.id)) {
      if (el.groupId) selectElements(elements.filter((c) => c.groupId === el.groupId).map((c) => c.id));
      else selectElement(el.id);
    } else if (!el) {
      selectElement(null);
    }
    setMenu({ x: e.clientX, y: e.clientY });
  }

  return (
    <div
      ref={rootRef}
      style={{ position: "absolute", inset: 0, zIndex: 10000 }}
      onPointerDown={handleRootPointerDown}
      onContextMenu={(e) => openMenu(e)}
    >
      {elements.map((el) => {
        const isSelected = selectedIds.includes(el.id);
        return (
          <div
            key={el.id}
            onPointerDown={startDrag(el, "move")}
            onContextMenu={(e) => openMenu(e, el)}
            onDoubleClick={(e) => {
              if (el.type === "shape-line" && getLinePoints(el)) addPointAt(el, e.clientX, e.clientY);
            }}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              cursor: !el.visible ? "not-allowed" : el.locked ? "default" : "move",
              outline: isSelected ? "1.5px solid #9c8ff0" : "1px dashed transparent",
              outlineOffset: 1,
              opacity: el.visible ? 1 : 0.35,
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLDivElement).style.outline = "1px dashed rgba(156,143,240,0.6)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) (e.currentTarget as HTMLDivElement).style.outline = "1px dashed transparent";
            }}
          >
            {isSelected && selectedIds.length === 1 && !el.locked && el.type === "shape-line" && getLinePoints(el) && (
              <PathOverlay
                el={el}
                points={getLinePoints(el)!}
                zoom={zoom}
                selectedIndex={selectedPoint && selectedPoint.elementId === el.id ? selectedPoint.index : null}
                startDrag={(i, k) => startPointDrag(el as LineElement, i, k)}
              />
            )}
            {isSelected &&
              selectedIds.length === 1 &&
              !el.locked &&
              HANDLES.map((pos) => (
                <ResizeHandle key={pos} position={pos} onPointerDown={startDrag(el, pos)} zoom={zoom} />
              ))}
          </div>
        );
      })}

      {guides.map((g, i) =>
        g.axis === "x" ? (
          <div
            key={i}
            style={{ position: "absolute", left: g.pos, top: 0, bottom: 0, width: 1, background: "#9c8ff0", pointerEvents: "none" }}
          />
        ) : (
          <div
            key={i}
            style={{ position: "absolute", top: g.pos, left: 0, right: 0, height: 1, background: "#9c8ff0", pointerEvents: "none" }}
          />
        )
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}

      {marqueeRect && (
        <div
          style={{
            position: "absolute",
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.width,
            height: marqueeRect.height,
            background: "rgba(156,143,240,0.15)",
            border: "1px solid #9c8ff0",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

function ResizeHandle({
  position,
  onPointerDown,
  zoom,
}: {
  position: HandlePosition;
  onPointerDown: (e: ReactPointerEvent) => void;
  zoom: number;
}) {
  const size = 8 / zoom;
  const offset = -size / 2;

  const placement: Record<HandlePosition, CSSProperties> = {
    nw: { left: offset, top: offset },
    n: { left: `calc(50% + ${offset}px)`, top: offset },
    ne: { right: offset, top: offset },
    e: { right: offset, top: `calc(50% + ${offset}px)` },
    se: { right: offset, bottom: offset },
    s: { left: `calc(50% + ${offset}px)`, bottom: offset },
    sw: { left: offset, bottom: offset },
    w: { left: offset, top: `calc(50% + ${offset}px)` },
  };

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: "#9c8ff0",
        border: `${1 / zoom}px solid #17151d`,
        borderRadius: 2,
        cursor: HANDLE_CURSOR[position],
        ...placement[position],
      }}
    />
  );
}

function PathOverlay({
  el, points, zoom, selectedIndex, startDrag,
}: {
  el: CardElement;
  points: PathPoint[];
  zoom: number;
  selectedIndex: number | null;
  startDrag: (index: number, kind: "anchor" | "in" | "out") => (e: ReactPointerEvent) => void;
}) {
  const w = el.width;
  const h = el.height;
  const r = 5 / zoom;
  const dot = (cx: number, cy: number, square: boolean, active: boolean, onDown: (e: ReactPointerEvent) => void, key: string) => (
    <div
      key={key}
      onPointerDown={onDown}
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: square ? 2 / zoom : "50%",
        background: active ? "#9c8ff0" : "#ece9f3",
        border: `${1.5 / zoom}px solid ${active ? "#ece9f3" : "#7d6dec"}`,
        cursor: square ? "move" : "crosshair",
        boxSizing: "border-box",
      }}
    />
  );
  return (
    <>
      <svg
        style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "visible", pointerEvents: "none" }}
        viewBox={`0 0 ${w} ${h}`}
      >
        {points.map((p, i) => {
          if (p.mode === "corner" || i !== selectedIndex) return null;
          const lines = [];
          if (i > 0) lines.push(<line key="i" x1={p.x * w} y1={p.y * h} x2={(p.x + p.inX) * w} y2={(p.y + p.inY) * h} stroke="#9c8ff0" strokeWidth={1 / zoom} />);
          if (i < points.length - 1) lines.push(<line key="o" x1={p.x * w} y1={p.y * h} x2={(p.x + p.outX) * w} y2={(p.y + p.outY) * h} stroke="#9c8ff0" strokeWidth={1 / zoom} />);
          return <g key={i}>{lines}</g>;
        })}
      </svg>
      {points.map((p, i) => {
        const active = i === selectedIndex;
        const items = [dot(p.x * w, p.y * h, true, active, startDrag(i, "anchor"), `a${i}`)];
        if (active && p.mode !== "corner") {
          if (i > 0) items.push(dot((p.x + p.inX) * w, (p.y + p.inY) * h, false, true, startDrag(i, "in"), `i${i}`));
          if (i < points.length - 1) items.push(dot((p.x + p.outX) * w, (p.y + p.outY) * h, false, true, startDrag(i, "out"), `o${i}`));
        }
        return items;
      })}
    </>
  );
}
