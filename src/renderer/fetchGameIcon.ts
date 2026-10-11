export interface FetchedIcon {
  dataUrl: string;
  /** False if we had to fall back to a live external reference instead of an embedded copy. */
  embedded: boolean;
}

/**
 * Tries to download the icon and embed it as a self-contained data URL (the
 * same, most-robust form every other asset in the library uses — works
 * forever, offline, no matter what happens to the source site). If the
 * fetch is blocked (most likely a CORS restriction on the response), falls
 * back to storing the live URL itself: our image renderer already treats
 * any http(s) URL as directly loadable, so it still works — it just
 * depends on the source staying online and reachable at export time.
 */
export async function fetchAndEmbedIcon(url: string): Promise<FetchedIcon> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const svgText = await response.text();
    if (!svgText.includes("<svg")) throw new Error("Response wasn't SVG");
    return { dataUrl: `data:image/svg+xml;base64,${btoa(svgText)}`, embedded: true };
  } catch {
    return { dataUrl: url, embedded: false };
  }
}
