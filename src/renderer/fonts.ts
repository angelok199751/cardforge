export const BASE_FONTS = [
  "Inter", "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New",
  "Verdana", "Trebuchet MS", "Impact", "Comic Sans MS", "Palatino Linotype", "Tahoma",
];

const GENERIC = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"];

/** Превращает "Inter" или "Inter, sans-serif" в безопасное значение CSS font-family. */
export function toCssFontFamily(value: string): string {
  const v = (value || "").trim();
  if (!v) return "Inter, sans-serif";
  if (v.includes(",")) return v;
  const name = v.replace(/^["']|["']$/g, "");
  if (GENERIC.includes(name)) return name;
  return `"${name}", sans-serif`;
}

export function displayFontName(value: string): string {
  return (value || "").split(",")[0].replace(/^["'\s]+|["'\s]+$/g, "");
}

let localCache: string[] | null = null;

export function supportsLocalFonts(): boolean {
  return typeof window !== "undefined" && "queryLocalFonts" in window;
}

/** Запрашивает установленные в системе шрифты (Chrome/Edge, нужно разрешение). */
export async function loadLocalFonts(): Promise<string[]> {
  if (localCache) return localCache;
  const list = await (window as any).queryLocalFonts();
  const set = new Set<string>(list.map((f: any) => f.family as string));
  localCache = Array.from(set).sort((a, b) => a.localeCompare(b));
  return localCache;
}
