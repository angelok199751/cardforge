import { useState, type CSSProperties } from "react";
import type { AssetLibrary, CardElement, ImageElement, CardSettings, DataRow } from "../types";
import { buildPathD, getLinePoints } from "./linePath";
import { toCssFontFamily } from "./fonts";
import { resolveField, resolveTemplate } from "./binding";

interface CardRendererProps {
  card: CardSettings;
  elements: CardElement[];
  /** A row of data to resolve bindings against. Omit for an empty/template preview. */
  dataRow?: DataRow;
  /** Uploaded images, looked up by exact filename when a bound field holds a filename rather than a URL. */
  assets?: AssetLibrary;
  /**
   * Whether a "transparent" background renders as a visible checkerboard
   * (editor/preview, so the person can see what's transparent) or as real
   * alpha (PNG export, where a checkerboard must never end up baked into
   * the pixels). Defaults to the checkerboard since every editor surface
   * wants it; export explicitly passes `false`.
   */
  transparencyPattern?: boolean;
}

/** True for anything the browser can load directly as an <img src>. */
function isLoadableImageSource(value: string): boolean {
  return (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  );
}

function backgroundStyle(card: CardSettings, transparencyPattern: boolean): CSSProperties {
  const { background } = card;
  switch (background.kind) {
    case "transparent":
      return transparencyPattern
        ? {
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            backgroundColor: "#fff",
          }
        : { backgroundColor: "transparent" };
    case "gradient":
      return {
        background: `linear-gradient(${background.gradient?.angle ?? 180}deg, ${
          background.gradient?.from ?? "#ffffff"
        }, ${background.gradient?.to ?? "#000000"})`,
      };
    case "image":
      return {
        backgroundColor: background.color ?? "#ffffff",
        backgroundImage: background.imageDataUrl ? `url(${background.imageDataUrl})` : undefined,
        backgroundSize:
          background.fit === "stretch" ? "100% 100%" : background.fit === "contain" ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "color":
    default:
      return { backgroundColor: background.color ?? "#ffffff" };
  }
}

function elementBaseStyle(el: CardElement): CSSProperties {
  return {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity,
    zIndex: el.zIndex,
    display: el.visible ? undefined : "none",
    boxSizing: "border-box",
  };
}

function renderElement(el: CardElement, dataRow: DataRow | undefined, assets: AssetLibrary | undefined) {
  const style = elementBaseStyle(el);

  switch (el.type) {
    case "text": {
      const text = resolveTemplate(el.content, dataRow);
      return (
        <div
          key={el.id}
          style={{
            ...style,
            fontFamily: toCssFontFamily(el.fontFamily),
            fontSize: el.fontSize,
            color: el.color,
            fontWeight: el.bold ? 700 : 400,
            fontStyle: el.italic ? "italic" : "normal",
            textDecoration: el.underline ? "underline" : "none",
            textAlign: el.align,
            lineHeight: el.lineHeight,
            display: el.visible ? "flex" : "none",
            alignItems: el.verticalAlign === "top" ? "flex-start" : el.verticalAlign === "bottom" ? "flex-end" : "center",
            justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          <span style={{ width: "100%" }}>{text}</span>
        </div>
      );
    }

    case "value": {
      const raw = resolveField(el.dataBinding, dataRow);
      return (
        <div
          key={el.id}
          style={{
            ...style,
            fontFamily: toCssFontFamily(el.fontFamily),
            fontSize: el.fontSize,
            color: el.color,
            display: el.visible ? "flex" : "none",
            alignItems: "center",
            justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
            whiteSpace: "nowrap",
          }}
        >
          {el.prefix}
          {raw}
          {el.suffix}
        </div>
      );
    }

    case "image": {
      const boundValue = el.dataBinding ? resolveField(el.dataBinding, dataRow) : undefined;
      let src: string | undefined;
      let unresolvedHint: string | undefined;

      if (boundValue) {
        if (isLoadableImageSource(boundValue)) {
          src = boundValue;
        } else {
          const fromAssets = assets?.[boundValue];
          if (fromAssets) {
            src = fromAssets;
          } else {
            unresolvedHint = boundValue;
          }
        }
      }

      if (!src) src = el.srcDataUrl;

      // Keyed on src too: if the bound row changes to a different (valid) image,
      // this remounts fresh rather than carrying over a previous row's load-error state.
      return <ImageElementView key={`${el.id}:${src ?? ""}`} el={el} src={src} unresolvedHint={unresolvedHint} style={style} />;
    }

    case "shape-rect":
      return (
        <div
          key={el.id}
          style={{
            ...style,
            backgroundColor: el.fill,
            opacity: el.opacity * el.fillOpacity,
            border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.strokeColor}` : undefined,
            borderRadius: el.borderRadius,
          }}
        />
      );

    case "shape-circle":
      return (
        <div
          key={el.id}
          style={{
            ...style,
            backgroundColor: el.fill,
            opacity: el.opacity * el.fillOpacity,
            border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.strokeColor}` : undefined,
            borderRadius: "50%",
          }}
        />
      );

    case "shape-line":
      {
        const pts = getLinePoints(el);
        if (pts) {
          return (
            <svg key={el.id} style={{ ...style, overflow: "visible" }} viewBox={`0 0 ${el.width} ${el.height}`}>
              <path
                d={buildPathD(pts, el.width, el.height)}
                fill="none"
                stroke={el.color}
                strokeWidth={el.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        }
      }
      return (
        <div
          key={el.id}
          style={{
            ...style,
            height: el.thickness,
            backgroundColor: el.color,
          }}
        />
      );

    case "shape-polygon": {
      const points = polygonPoints(el.sides, el.width, el.height);
      return (
        <svg key={el.id} style={style} viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
          <polygon
            points={points}
            fill={el.fill}
            fillOpacity={el.fillOpacity}
            stroke={el.strokeWidth > 0 ? el.strokeColor : "none"}
            strokeWidth={el.strokeWidth}
          />
        </svg>
      );
    }

    case "shape-heart":
      return (
        <svg key={el.id} style={style} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 50 30 C 35 5, 0 5, 0 32.5 C 0 57.5, 25 72.5, 50 95 C 75 72.5, 100 57.5, 100 32.5 C 100 5, 65 5, 50 30 Z"
            fill={el.fill}
            fillOpacity={el.fillOpacity}
            stroke={el.strokeWidth > 0 ? el.strokeColor : "none"}
            strokeWidth={el.strokeWidth}
          />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Renders an image element. Split out as its own component (rather than
 * inline in `renderElement`) because it needs local state: whether the
 * `<img>` failed to load is only known after the browser tries, and the
 * striped "no image" placeholder should only ever show when there's
 * genuinely nothing to display — never behind a real image, or it would
 * paint through any transparent (alpha) areas of an uploaded PNG.
 */
function ImageElementView({
  el,
  src,
  unresolvedHint,
  style,
}: {
  el: ImageElement;
  src: string | undefined;
  unresolvedHint: string | undefined;
  style: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      style={{
        ...style,
        overflow: "hidden",
        borderRadius: el.borderRadius,
        backgroundColor: "transparent",
      }}
    >
      {showPlaceholder && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(45deg, #eee, #eee 8px, #f7f7f7 8px, #f7f7f7 16px)",
          }}
        />
      )}
      {src && !failed && (
        <img
          src={src}
          alt=""
          crossOrigin={src.startsWith("http://") || src.startsWith("https://") ? "anonymous" : undefined}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: el.fit === "stretch" ? "fill" : el.fit,
            display: "block",
          }}
          onError={() => setFailed(true)}
        />
      )}
      {showPlaceholder && unresolvedHint && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            textAlign: "center",
            fontSize: 10,
            lineHeight: 1.3,
            color: "#a33",
            fontFamily: "monospace",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          Изображение «{unresolvedHint}» не найдено — загрузите его в библиотеку изображений
        </div>
      )}
    </div>
  );
}

/** Vertices of a regular N-gon (3–100 sides), inscribed in a width×height box, point facing up. */
function polygonPoints(sides: number, width: number, height: number): string {
  const n = Math.max(3, Math.min(100, Math.round(sides)));
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

/**
 * Renders a card at its real pixel dimensions. This exact component is reused
 * by the editor's live preview and (in the export stage) an off-screen
 * rasterization container, so the two never drift apart.
 */
export function CardRenderer({ card, elements, dataRow, assets, transparencyPattern = true }: CardRendererProps) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      style={{
        position: "relative",
        width: card.width,
        height: card.height,
        overflow: "hidden",
        borderRadius: card.border.radius,
        boxSizing: "border-box",
      }}
    >
      {/* Background layer — a plain, border-less box so it can't shift the coordinate origin below. */}
      <div style={{ position: "absolute", inset: 0, ...backgroundStyle(card, transparencyPattern) }} />

      {/* Border drawn before the elements, so elements that overlap the frame still paint on top of
          it — matching how it looked when border+background lived on the same box as the elements'
          old (buggy) containing block. */}
      {card.border.enabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `${card.border.width}px solid ${card.border.color}`,
            borderRadius: card.border.radius,
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Elements — positioned in a border-less container, so el.x/el.y line up exactly with the
          editor's selection frame. (A border on this ancestor would inset the containing block by
          its own width, silently shifting every child's 0,0 — that was the coordinate bug.)
          zIndex:0 here (rather than "auto") is deliberate: it makes this div establish its own
          stacking context, so individual elements' z-index (0, 1, 2…) stay contained inside it and
          can never leak out to compete with — and possibly paint above — the editor's interactive
          overlay, which sits in a completely separate sibling layer. */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>{sorted.map((el) => renderElement(el, dataRow, assets))}</div>
    </div>
  );
}
