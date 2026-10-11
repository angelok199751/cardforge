import JSZip from "jszip";
import { renderCardToBlob } from "./exportPng";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import type { AssetLibrary, CardElement, CardSettings, DataRow } from "../types";

export interface ExportProgress {
  done: number;
  total: number;
}

/**
 * Renders one PNG per data row and packs them into a ZIP Blob.
 *
 * @param filenameField Column to name files after (e.g. "name"). Pass `null`
 *   to always use a zero-padded card number instead.
 */
export async function exportAllAsZip(
  card: CardSettings,
  elements: CardElement[],
  rows: DataRow[],
  filenameField: string | null,
  assets: AssetLibrary | undefined,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Set<string>();
  const pad = String(rows.length).length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const blob = await renderCardToBlob(card, elements, row, assets);

    const fallback = `card_${String(i + 1).padStart(pad, "0")}`;
    const fromField = filenameField ? row[filenameField] : "";
    const base = sanitizeFilename(fromField || fallback);

    let finalName = `${base}.png`;
    let suffix = 2;
    while (usedNames.has(finalName)) {
      finalName = `${base}_${suffix}.png`;
      suffix += 1;
    }
    usedNames.add(finalName);

    zip.file(finalName, blob);
    onProgress?.({ done: i + 1, total: rows.length });
  }

  return zip.generateAsync({ type: "blob" });
}
