import { createRoot } from "react-dom/client";
import { toBlob } from "html-to-image";
import { CardRenderer } from "./CardRenderer";
import type { AssetLibrary, CardElement, CardSettings, DataRow } from "../types";

/** Waits for every <img> under `el` to finish loading (success or failure). */
function waitForImages(el: HTMLElement): Promise<void> {
  const images = Array.from(el.querySelectorAll("img"));
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          })
    )
  ).then(() => undefined);
}

/**
 * Renders `card` + `elements` (optionally resolved against `dataRow`) to a
 * PNG Blob at the card's real pixel dimensions — not the on-screen preview
 * size. Uses the same <CardRenderer> component the editor renders, in an
 * off-screen container, so export can never visually drift from the canvas.
 */
export async function renderCardToBlob(
  card: CardSettings,
  elements: CardElement[],
  dataRow?: DataRow,
  assets?: AssetLibrary
): Promise<Blob> {
  // A zero-size, overflow:hidden wrapper keeps this invisible on screen while
  // still letting the browser fully lay out and paint the real-size child —
  // unlike pushing the container far off-screen (e.g. left: -100000px), which
  // some html-to-image internals fail to capture correctly, resulting in a
  // blank output despite the DOM content being perfectly valid.
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "0";
  wrapper.style.height = "0";
  wrapper.style.overflow = "hidden";
  wrapper.style.pointerEvents = "none";

  const container = document.createElement("div");
  container.style.width = `${card.width}px`;
  container.style.height = `${card.height}px`;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <CardRenderer card={card} elements={elements} dataRow={dataRow} assets={assets} transparencyPattern={false} />
      );
      // Let React commit, then let the browser paint, before we touch the DOM.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await waitForImages(container);

    const blob = await toBlob(container, {
      width: card.width,
      height: card.height,
      pixelRatio: 1,
      cacheBust: true,
    });

    if (!blob) {
      throw new Error("Рендеринг не дал данных изображения.");
    }
    return blob;
  } finally {
    root.unmount();
    document.body.removeChild(wrapper);
  }
}
