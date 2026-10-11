import type { LineElement, PathPoint, PointMode } from "../types";

type V = { x: number; y: number };

/** Точки линии. Старые проекты с `curve` переводятся на лету. */
export function getLinePoints(el: LineElement): PathPoint[] | undefined {
  if (el.points) return el.points;
  if (el.curve) {
    const c = el.curve;
    return [
      { x: 0, y: 0.5, inX: 0, inY: 0, outX: c.c1x, outY: c.c1y - 0.5, mode: "free" },
      { x: 1, y: 0.5, inX: c.c2x - 1, inY: c.c2y - 0.5, outX: 0, outY: 0, mode: "free" },
    ];
  }
  return undefined;
}

export function defaultPoints(): PathPoint[] {
  return [
    { x: 0, y: 0.5, inX: 0, inY: 0, outX: 0, outY: 0, mode: "corner" },
    { x: 1, y: 0.5, inX: 0, inY: 0, outX: 0, outY: 0, mode: "corner" },
  ];
}

const anchor = (p: PathPoint, w: number, h: number): V => ({ x: p.x * w, y: p.y * h });
const hIn = (p: PathPoint, w: number, h: number): V => ({ x: (p.x + p.inX) * w, y: (p.y + p.inY) * h });
const hOut = (p: PathPoint, w: number, h: number): V => ({ x: (p.x + p.outX) * w, y: (p.y + p.outY) * h });

export function buildPathD(points: PathPoint[], w: number, h: number): string {
  if (points.length === 0) return "";
  const a0 = anchor(points[0], w, h);
  let d = `M ${a0.x} ${a0.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const o = hOut(points[i], w, h);
    const n = hIn(points[i + 1], w, h);
    const a = anchor(points[i + 1], w, h);
    d += ` C ${o.x} ${o.y}, ${n.x} ${n.y}, ${a.x} ${a.y}`;
  }
  return d;
}

function lerp(a: V, b: V, t: number): V {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function cubicAt(p0: V, p1: V, p2: V, p3: V, t: number): V {
  const q0 = lerp(p0, p1, t), q1 = lerp(p1, p2, t), q2 = lerp(p2, p3, t);
  return lerp(lerp(q0, q1, t), lerp(q1, q2, t), t);
}

/** Ближайшая к (px,py) точка кривой (в пикселях рамки): номер сегмента и параметр t. */
export function nearestOnPath(points: PathPoint[], w: number, h: number, px: number, py: number) {
  let best = { seg: 0, t: 0.5, dist: Infinity };
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = anchor(points[i], w, h), p1 = hOut(points[i], w, h);
    const p2 = hIn(points[i + 1], w, h), p3 = anchor(points[i + 1], w, h);
    for (let k = 1; k < 60; k++) {
      const t = k / 60;
      const q = cubicAt(p0, p1, p2, p3, t);
      const dist = Math.hypot(q.x - px, q.y - py);
      if (dist < best.dist) best = { seg: i, t, dist };
    }
  }
  return best;
}

const isZero = (x: number, y: number) => Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6;

/** Вставляет точку в сегмент seg. Форма кривой сохраняется; на прямом участке точка — «прямой угол». */
export function insertPoint(points: PathPoint[], w: number, h: number, seg: number, t: number): PathPoint[] {
  const a = points[seg], b = points[seg + 1];
  const straight = isZero(a.outX, a.outY) && isZero(b.inX, b.inY);
  const p0 = anchor(a, w, h), p1 = hOut(a, w, h), p2 = hIn(b, w, h), p3 = anchor(b, w, h);
  const q0 = lerp(p0, p1, t), q1 = lerp(p1, p2, t), q2 = lerp(p2, p3, t);
  const r0 = lerp(q0, q1, t), r1 = lerp(q1, q2, t);
  const s = lerp(r0, r1, t);
  const next = [...points];
  if (straight) {
    next.splice(seg + 1, 0, { x: s.x / w, y: s.y / h, inX: 0, inY: 0, outX: 0, outY: 0, mode: "corner" });
    return next;
  }
  const np: PathPoint = {
    x: s.x / w, y: s.y / h,
    inX: (r0.x - s.x) / w, inY: (r0.y - s.y) / h,
    outX: (r1.x - s.x) / w, outY: (r1.y - s.y) / h,
    mode: "angle",
  };
  next[seg] = { ...a, outX: (q0.x - p0.x) / w, outY: (q0.y - p0.y) / h, mode: a.mode === "mirrored" ? "angle" : a.mode };
  next[seg + 1] = { ...b, inX: (q2.x - p3.x) / w, inY: (q2.y - p3.y) / h, mode: b.mode === "mirrored" ? "angle" : b.mode };
  next.splice(seg + 1, 0, np);
  return next;
}

export function removePoint(points: PathPoint[], index: number): PathPoint[] {
  if (points.length <= 2) return points;
  return points.filter((_, i) => i !== index);
}

/** Меняет тип точки и подбирает ручки, чтобы кривизна сразу была видна. */
export function applyMode(points: PathPoint[], index: number, mode: PointMode, w: number, h: number): PathPoint[] {
  const p = points[index];
  let inV: V = { x: p.inX * w, y: p.inY * h };
  let outV: V = { x: p.outX * w, y: p.outY * h };

  if (mode === "corner") {
    inV = { x: 0, y: 0 };
    outV = { x: 0, y: 0 };
  } else {
    if (isZero(inV.x, inV.y) && isZero(outV.x, outV.y)) {
      const cur = anchor(p, w, h);
      const prev = index > 0 ? anchor(points[index - 1], w, h) : null;
      const next = index < points.length - 1 ? anchor(points[index + 1], w, h) : null;
      const from = prev ?? cur;
      const to = next ?? cur;
      let dx = to.x - from.x, dy = to.y - from.y;
      const dirLen = Math.hypot(dx, dy) || 1;
      dx /= dirLen; dy /= dirLen;
      const dists = [prev, next].filter(Boolean).map((v) => Math.hypot(v!.x - cur.x, v!.y - cur.y));
      const len = (dists.length ? Math.min(...dists) : 60) / 3;
      outV = { x: dx * len, y: dy * len };
      inV = { x: -dx * len, y: -dy * len };
    } else if (mode === "mirrored") {
      if (isZero(outV.x, outV.y)) outV = { x: -inV.x, y: -inV.y };
      inV = { x: -outV.x, y: -outV.y };
    } else if (mode === "angle") {
      const lo = Math.hypot(outV.x, outV.y), li = Math.hypot(inV.x, inV.y);
      if (lo === 0) outV = { x: -inV.x, y: -inV.y };
      const l2 = Math.hypot(outV.x, outV.y);
      const target = li || l2;
      inV = { x: (-outV.x / l2) * target, y: (-outV.y / l2) * target };
    }
  }
  const next = [...points];
  next[index] = { ...p, mode, inX: inV.x / w, inY: inV.y / h, outX: outV.x / w, outY: outV.y / h };
  return next;
}

/** Двигает ручку (offset в пикселях от точки) и подстраивает вторую по типу точки. */
export function moveHandle(
  points: PathPoint[], index: number, which: "in" | "out", off: V, w: number, h: number
): PathPoint[] {
  const p = points[index];
  let inV: V = { x: p.inX * w, y: p.inY * h };
  let outV: V = { x: p.outX * w, y: p.outY * h };
  if (which === "out") outV = off; else inV = off;
  const moved = which === "out" ? outV : inV;
  const lm = Math.hypot(moved.x, moved.y);
  if (p.mode === "mirrored") {
    const o = { x: -moved.x, y: -moved.y };
    if (which === "out") inV = o; else outV = o;
  } else if (p.mode === "angle" && lm > 0) {
    const other = which === "out" ? inV : outV;
    const lo = Math.hypot(other.x, other.y) || lm;
    const o = { x: (-moved.x / lm) * lo, y: (-moved.y / lm) * lo };
    if (which === "out") inV = o; else outV = o;
  }
  const next = [...points];
  next[index] = { ...p, inX: inV.x / w, inY: inV.y / h, outX: outV.x / w, outY: outV.y / h };
  return next;
}

export function movePoint(points: PathPoint[], index: number, x: number, y: number): PathPoint[] {
  const next = [...points];
  next[index] = { ...points[index], x, y };
  return next;
}
