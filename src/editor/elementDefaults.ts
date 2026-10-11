import { generateId } from "../utils/id";
import type {
  CardElement,
  CardSettings,
  CircleElement,
  ElementType,
  HeartElement,
  ImageElement,
  LineElement,
  PolygonElement,
  RectElement,
  TextElement,
  ValueElement,
} from "../types";

const LABELS: Record<ElementType, string> = {
  text: "Текст",
  image: "Изображение",
  value: "Значение",
  "shape-rect": "Прямоугольник",
  "shape-circle": "Круг",
  "shape-line": "Линия",
  "shape-polygon": "Многоугольник",
  "shape-heart": "Сердце",
};

/** Centers a default-sized box on the card. */
function centeredBox(card: CardSettings, w: number, h: number) {
  return {
    x: Math.round((card.width - w) / 2),
    y: Math.round((card.height - h) / 2),
    width: w,
    height: h,
  };
}

export function createDefaultElement(type: ElementType, card: CardSettings, order: number): CardElement {
  const base = {
    id: generateId("el"),
    name: `${LABELS[type]} ${order}`,
    rotation: 0,
    opacity: 1,
    visible: true,
    zIndex: order,
  };

  switch (type) {
    case "text": {
      const box = centeredBox(card, Math.round(card.width * 0.7), Math.round(card.height * 0.12));
      const el: TextElement = {
        ...base,
        ...box,
        type: "text",
        content: "${name}",
        fontFamily: "Inter, sans-serif",
        fontSize: 28,
        color: "#1F1B16",
        bold: false,
        italic: false,
        underline: false,
        align: "center",
        verticalAlign: "middle",
        lineHeight: 1.2,
      };
      return el;
    }
    case "value": {
      const box = centeredBox(card, Math.round(card.width * 0.25), Math.round(card.height * 0.1));
      const el: ValueElement = {
        ...base,
        ...box,
        type: "value",
        dataBinding: "",
        prefix: "",
        suffix: "",
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        color: "#1F1B16",
        align: "center",
      };
      return el;
    }
    case "image": {
      const box = centeredBox(card, Math.round(card.width * 0.6), Math.round(card.height * 0.4));
      const el: ImageElement = {
        ...base,
        ...box,
        type: "image",
        fit: "cover",
        borderRadius: 0,
      };
      return el;
    }
    case "shape-rect": {
      const box = centeredBox(card, Math.round(card.width * 0.5), Math.round(card.height * 0.2));
      const el: RectElement = {
        ...base,
        ...box,
        type: "shape-rect",
        fill: "#9c8ff0",
        fillOpacity: 1,
        strokeColor: "#1F1B16",
        strokeWidth: 0,
        borderRadius: 8,
      };
      return el;
    }
    case "shape-circle": {
      const size = Math.round(Math.min(card.width, card.height) * 0.3);
      const box = centeredBox(card, size, size);
      const el: CircleElement = {
        ...base,
        ...box,
        type: "shape-circle",
        fill: "#9c8ff0",
        fillOpacity: 1,
        strokeColor: "#1F1B16",
        strokeWidth: 0,
      };
      return el;
    }
    case "shape-line": {
      const box = centeredBox(card, Math.round(card.width * 0.6), 4);
      const el: LineElement = {
        ...base,
        ...box,
        type: "shape-line",
        color: "#1F1B16",
        thickness: 4,
      };
      return el;
    }
    case "shape-polygon": {
      const size = Math.round(Math.min(card.width, card.height) * 0.3);
      const box = centeredBox(card, size, size);
      const el: PolygonElement = {
        ...base,
        ...box,
        type: "shape-polygon",
        sides: 6,
        fill: "#9c8ff0",
        fillOpacity: 1,
        strokeColor: "#1F1B16",
        strokeWidth: 0,
      };
      return el;
    }
    case "shape-heart": {
      const size = Math.round(Math.min(card.width, card.height) * 0.3);
      const box = centeredBox(card, size, size);
      const el: HeartElement = {
        ...base,
        ...box,
        type: "shape-heart",
        fill: "#C9524B",
        fillOpacity: 1,
        strokeColor: "#1F1B16",
        strokeWidth: 0,
      };
      return el;
    }
  }
}
