// Core data model for Cardforge.
// The template (card + elements) is intentionally generic: nothing here
// knows about "attack", "HP", "rarity", etc. Those are just data field
// names supplied by the user at generation time.

export type LengthUnit = "px" | "mm" | "cm" | "in";

export type Orientation = "portrait" | "landscape";

export type BackgroundFit = "cover" | "contain" | "stretch";

export interface CardBackground {
  kind: "color" | "transparent" | "image" | "gradient";
  color?: string;
  gradient?: {
    from: string;
    to: string;
    angle: number; // degrees
  };
  imageDataUrl?: string;
  fit?: BackgroundFit;
}

export interface CardBorder {
  enabled: boolean;
  color: string;
  width: number; // px, always in card's internal px space
  radius: number; // px
}

export interface CardSettings {
  /** Width/height are always stored in px internally (the render space). */
  width: number;
  height: number;
  unit: LengthUnit;
  orientation: Orientation;
  background: CardBackground;
  border: CardBorder;
}

// ---- Elements -------------------------------------------------------

export type ElementType =
  | "text"
  | "image"
  | "value"
  | "shape-rect"
  | "shape-circle"
  | "shape-line"
  | "shape-polygon"
  | "shape-heart";

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string; // user-facing label shown in the Layers panel
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0..1
  visible: boolean;
  zIndex: number;
  locked?: boolean; // закреплён: нельзя двигать и менять размер
  groupId?: string; // элементы с одним groupId выделяются и двигаются вместе
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string; // may contain ${fieldName} bindings
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  lineHeight: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /** Either a static data URL, or a data-field binding resolved at generation time. */
  srcDataUrl?: string;
  dataBinding?: string;
  fit: BackgroundFit;
  borderRadius: number;
}

export interface ValueElement extends BaseElement {
  type: "value";
  dataBinding: string;
  /** Optional display template, e.g. "★".repeat(value) is out of scope for MVP; use prefix/suffix. */
  prefix: string;
  suffix: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface RectElement extends BaseElement {
  type: "shape-rect";
  fill: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface CircleElement extends BaseElement {
  type: "shape-circle";
  fill: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
}

/** Тип узла: прямой угол (без ручек), симметрия (угол и длина), угловая симметрия (только угол), асимметрия. */
export type PointMode = "corner" | "mirrored" | "angle" | "free";

/** Узел линии. x/y — в долях рамки элемента, ручки — смещения от узла тоже в долях рамки. */
export interface PathPoint {
  x: number;
  y: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
  mode: PointMode;
}

export interface LineElement extends BaseElement {
  type: "shape-line";
  color: string;
  thickness: number;
  /**
   * Если задано — линия рисуется кубической кривой Безье. Концы кривой лежат на середине левого и
   * правого краёв рамки, контрольные точки — в долях рамки (0..1, можно выходить за границы).
   */
  points?: PathPoint[];
  /** устаревшее, читается для старых проектов */
  curve?: { c1x: number; c1y: number; c2x: number; c2y: number };
}

export interface PolygonElement extends BaseElement {
  type: "shape-polygon";
  /** Number of sides of a regular polygon: 3 (triangle) up to 100. */
  sides: number;
  fill: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
}

export interface HeartElement extends BaseElement {
  type: "shape-heart";
  fill: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
}

export type CardElement =
  | TextElement
  | ImageElement
  | ValueElement
  | RectElement
  | CircleElement
  | LineElement
  | PolygonElement
  | HeartElement;

/**
 * The type accepted by `updateElement`. `Partial<CardElement>` would collapse
 * to only the fields shared by every variant (TS computes `keyof` of a union
 * as the *intersection* of keys), which excludes type-specific fields like
 * `content` or `fill`. A union of each variant's Partial keeps those fields
 * available while every variant still exposes the common BaseElement fields.
 */
export type ElementPatch =
  | Partial<TextElement>
  | Partial<ImageElement>
  | Partial<ValueElement>
  | Partial<RectElement>
  | Partial<CircleElement>
  | Partial<LineElement>
  | Partial<PolygonElement>
  | Partial<HeartElement>;

// ---- Data -------------------------------------------------------------

export type DataRow = Record<string, string>;

export interface DataTable {
  columns: string[];
  rows: DataRow[];
}

// ---- Project ------------------------------------------------------------

/** Uploaded images available for lookup by exact filename (e.g. "goblin.png" -> data URL). */
export type AssetLibrary = Record<string, string>;

export interface Project {
  id: string;
  name: string;
  card: CardSettings;
  elements: CardElement[];
  data: DataTable;
  assets: AssetLibrary;
}

export interface CardSizePreset {
  label: string;
  width: number;
  height: number;
  unit: LengthUnit;
}

export const CARD_PRESETS: CardSizePreset[] = [
  { label: "Покер (63×88мм)", width: 63, height: 88, unit: "mm" },
  { label: "Таро (70×120мм)", width: 70, height: 120, unit: "mm" },
  { label: "Бридж (57×89мм)", width: 57, height: 89, unit: "mm" },
  { label: "Свой размер", width: 750, height: 1050, unit: "px" },
];

/** Physical units are converted to a fixed print resolution for internal px storage. */
export const PX_PER_MM = 11.81; // ~300 DPI
export const PX_PER_INCH = 300;

export function toPx(value: number, unit: LengthUnit): number {
  switch (unit) {
    case "px":
      return Math.round(value);
    case "mm":
      return Math.round(value * PX_PER_MM);
    case "cm":
      return Math.round(value * PX_PER_MM * 10);
    case "in":
      return Math.round(value * PX_PER_INCH);
  }
}
