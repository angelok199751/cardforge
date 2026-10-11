export interface Guide {
  axis: "x" | "y";
  pos: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Given a moving box's raw (unsnapped) position, checks its left/center/right
 * (and top/center/bottom) against the card's edges/center and every other
 * element's edges/center. If any pair is within `threshold`, the moving box
 * is nudged to align exactly, and a guide line is returned to render.
 * Picks at most one snap per axis — the closest candidate.
 */
export function computeSnap(
  moving: Box,
  others: Box[],
  card: { width: number; height: number },
  threshold: number
): { x: number; y: number; guides: Guide[] } {
  const targetsX = [0, card.width / 2, card.width];
  const targetsY = [0, card.height / 2, card.height];

  for (const o of others) {
    targetsX.push(o.x, o.x + o.width / 2, o.x + o.width);
    targetsY.push(o.y, o.y + o.height / 2, o.y + o.height);
  }

  const movingXs = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const movingYs = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];

  let bestDx = Infinity;
  let snappedX = moving.x;
  let guideX: number | null = null;
  for (const mx of movingXs) {
    for (const tx of targetsX) {
      const d = tx - mx;
      if (Math.abs(d) <= threshold && Math.abs(d) < Math.abs(bestDx)) {
        bestDx = d;
        snappedX = moving.x + d;
        guideX = tx;
      }
    }
  }

  let bestDy = Infinity;
  let snappedY = moving.y;
  let guideY: number | null = null;
  for (const my of movingYs) {
    for (const ty of targetsY) {
      const d = ty - my;
      if (Math.abs(d) <= threshold && Math.abs(d) < Math.abs(bestDy)) {
        bestDy = d;
        snappedY = moving.y + d;
        guideY = ty;
      }
    }
  }

  const guides: Guide[] = [];
  if (guideX !== null) guides.push({ axis: "x", pos: guideX });
  if (guideY !== null) guides.push({ axis: "y", pos: guideY });

  return { x: snappedX, y: snappedY, guides };
}
