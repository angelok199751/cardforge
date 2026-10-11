export interface GameIconRef {
  author: string;
  name: string;
  label: string;
  category: string;
}

/**
 * A small starter catalog of verified game-icons.net icons (CC BY 3.0,
 * https://game-icons.net). Each author/name pair here has been confirmed
 * against the real site — game-icons.net has 4000+ icons total, and the
 * "Add by author/name" field in the browser lets you pull in any of them,
 * not just what's listed here.
 */
export const GAME_ICONS_CATALOG: GameIconRef[] = [
  { author: "delapouite", name: "two-handed-sword", label: "Two-handed sword", category: "Weapon" },
  { author: "lorc", name: "checked-shield", label: "Checked shield", category: "Shield" },
  { author: "willdabeast", name: "round-shield", label: "Round shield", category: "Shield" },
  { author: "delapouite", name: "viking-shield", label: "Viking shield", category: "Shield" },
  { author: "delapouite", name: "shield-bash", label: "Shield bash", category: "Shield" },
  { author: "delapouite", name: "roman-shield", label: "Roman shield", category: "Shield" },
  { author: "lorc", name: "surrounded-shield", label: "Surrounded shield", category: "Shield" },
  { author: "delapouite", name: "health-potion", label: "Health potion", category: "Potion" },
  { author: "lorc", name: "standing-potion", label: "Standing potion", category: "Potion" },
];

/** Builds the game-icons.net SVG URL for a given icon and color scheme. */
export function gameIconUrl(author: string, name: string, fg = "2b2b2b", bg = "transparent"): string {
  return `https://game-icons.net/icons/${fg}/${bg}/1x1/${author}/${name}.svg`;
}
