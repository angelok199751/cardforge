const ICON_COLOR = "#2b2b2b";

export interface StarterIcon {
  /** Filename this icon is registered under in the asset library. */
  filename: string;
  svg: string;
}

const svg = (inner: string) =>
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

/**
 * A small, original set of game-adjacent icons (weapons, shield, armor,
 * potion, mana, and the six classic elements), drawn as plain geometric SVG
 * so they can ship inline with no external asset fetch or license to track.
 * For a much bigger, professionally made, free (CC BY) set, see
 * https://game-icons.net — download whatever you like from there and
 * upload it through "Upload images" above; it'll sit right alongside these.
 */
export const STARTER_ICONS: StarterIcon[] = [
  {
    filename: "sword.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M50 4 L58 58 L50 66 L42 58 Z M32 58 H68 V70 H32 Z M45 70 H55 V86 H45 Z"/><circle cx="50" cy="91" r="7" fill="${ICON_COLOR}"/>`
    ),
  },
  {
    filename: "axe.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M46 12 H54 V92 H46 Z M50 20 L85 8 C92 18 92 34 85 44 L50 38 Z"/>`
    ),
  },
  {
    filename: "shield.svg",
    svg: svg(`<path fill="${ICON_COLOR}" d="M50 6 L85 18 V48 C85 72 70 88 50 96 C30 88 15 72 15 48 V18 Z"/>`),
  },
  {
    filename: "armor.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M35 15 C40 26 45 32 50 32 C55 32 60 26 65 15 L80 22 L85 42 L78 90 L22 90 L15 42 L20 22 Z"/>`
    ),
  },
  {
    filename: "potion.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M43 6 H57 V22 H43 Z M40 22 H60 V28 H40 Z M32 28 C18 30 12 48 12 62 C12 80 28 93 50 93 C72 93 88 80 88 62 C88 48 82 30 68 28 Z"/>`
    ),
  },
  {
    filename: "mana.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M50 8 C50 8 22 46 22 66 C22 84 34 95 50 95 C66 95 78 84 78 66 C78 46 50 8 50 8 Z"/>`
    ),
  },
  {
    filename: "element-fire.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M52 3 C64 20 58 28 62 30 C66 32 70 24 70 18 C82 30 88 46 88 60 C88 80 71 96 50 96 C29 96 14 82 14 62 C14 48 22 38 30 30 C28 42 34 46 38 40 C44 30 40 16 52 3 Z"/>`
    ),
  },
  {
    filename: "element-water.svg",
    svg: svg(
      `<path fill="${ICON_COLOR}" d="M50 10 C64 32 82 52 82 68 C82 85 68 96 50 96 C32 96 18 85 18 68 C18 52 36 32 50 10 Z"/>`
    ),
  },
  {
    filename: "element-earth.svg",
    svg: svg(`<path fill="${ICON_COLOR}" d="M8 88 L34 34 L50 62 L64 28 L92 88 Z"/>`),
  },
  {
    filename: "element-air.svg",
    svg: svg(
      `<g fill="none" stroke="${ICON_COLOR}" stroke-width="6" stroke-linecap="round"><path d="M10 35 C35 22 60 22 88 35"/><path d="M10 55 C32 45 55 45 80 55"/><path d="M10 75 C28 68 42 68 62 75"/></g>`
    ),
  },
  {
    filename: "element-lightning.svg",
    svg: svg(`<path fill="${ICON_COLOR}" d="M58 4 L24 56 H46 L34 96 L80 42 H56 Z"/>`),
  },
  {
    filename: "element-ice.svg",
    svg: svg(
      `<g fill="none" stroke="${ICON_COLOR}" stroke-width="5" stroke-linecap="round">` +
        `<path d="M8 50 H92"/><path d="M29 13.6 L71 86.4"/><path d="M71 13.6 L29 86.4"/>` +
        `<path d="M8 42 V58"/><path d="M92 42 V58"/>` +
        `<path d="M22.07 17.6 L35.93 9.6"/><path d="M64.07 90.4 L77.93 82.4"/>` +
        `<path d="M64.07 9.6 L77.93 17.6"/><path d="M22.07 82.4 L35.93 90.4"/></g>`
    ),
  },
];

/** Encodes an SVG string as a data URL usable directly as an <img src>. */
export function svgToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;base64,${btoa(svgMarkup)}`;
}
