# Cardforge — Stage 1–7 (feature-complete)

A fully client-side card template generator for board-game prototyping. The
UI is in Russian; this README stays in English for maintainers.
No backend, no database, no accounts — everything runs in the browser and the
built app is a static bundle you can drop on GitHub Pages, Vercel, or Netlify.

## What's in Stage 1–7

**Landing page:** a visual, product-style page (own purple/teal palette,
using the same accent color family as the builder itself) that sells the core idea — one
template + a data table becomes a whole deck — through a hero with an
animated one-card-becomes-many visual, a template → data → result
demonstration, a 3-step "how it works", a feature grid, and use-case
examples, ending in a final CTA. Shown on first visit (tracked in
localStorage); click the "Cardforge" wordmark in the top bar any time to
bring it back.

**Unified color scheme:** the builder used to run on a black/gold ("brass")
palette while the landing page used purple/teal, so the two felt like
different products. The whole app now shares one accent color family
(`--accent-500/400/600` + `--accent-wash` in `index.css`) matching the
landing page's purple — buttons, active tabs, selection outlines, snap
guides, resize handles, and default shape fills all follow it. The one
thing left untouched on purpose: a newly created card's own default
background/border/text colors (a warm cream-and-ink look), since those are
starting points for the user's own card design, not app chrome.

**Stage 1 — foundation:** project shell, New Project dialog (size presets,
custom px/mm/cm/in, orientation), zoomable canvas, card background/border.

**Stage 2 — editor:** add text/image/value/shape elements from the
tools rail (rectangle, circle, line, a configurable regular polygon, and a
heart); select, drag, and resize on the canvas; a Layers panel
(reorder, rename, show/hide, duplicate, delete); a contextual properties
panel per element type; keyboard shortcuts (Delete, Esc, Ctrl/Cmd+D). The
polygon element's side count (3–100) is adjustable in its properties panel —
a triangle, hexagon, and near-circle are all the same element type.

**Stage 3 — data:**
- **Import data**: paste a table copied from Excel/Google Sheets, or upload
  a CSV file. A small preview is shown before you confirm.
- **Data view**: an editable spreadsheet-like table of the imported rows —
  edit cells inline, add/delete/rename rows and now columns too (rename a
  column by double-clicking its header, delete with the ✕ next to it, or
  add a brand-new one — including starting a table from scratch with no
  import at all).
- **Template ↔ Data binding**: text elements resolve `${field}` placeholders;
  Value and Image elements bind to a single field by name. The canvas
  previews the template using the first imported row. Fields referenced by
  the template that don't exist in the imported columns are flagged (in the
  element's properties panel, in the Layers list, and in the Data view).
- **Preview**: a "Preview" tab renders one card per data row from the
  current template — click a card to view it larger with prev/next
  navigation. Because cards are rendered from `template + row` on demand
  (not stored as separate copies), editing the template and switching back
  to Preview always reflects the latest design — no separate "regenerate"
  step needed.

**Stage 4 — export:**
- **Export dialog** (top bar → Export): download the current card as a single
  PNG, or the whole generated set as a ZIP of PNGs.
- Rendering happens off-screen at the card's real pixel size (not the
  on-screen preview size) using the *exact same* `CardRenderer` component
  the editor uses — so what you see is what gets exported, always.
- A transparent card background exports as real alpha, not the checkerboard
  hint shown in the editor.
- Filenames are informative and safe: pick which imported column to name
  files after (defaults to a `name` column if one exists), with automatic
  de-duplication and cross-platform character sanitization (Cyrillic and
  other non-Latin text is preserved).
- The Preview tab's single-card view also has its own quick "Download PNG"
  button for that specific row.

**Stage 5 — save / load / autosave:**
- **Save** (top bar) downloads the entire project — card settings, every
  element and its properties, layer order, and all imported data — as a
  single `.cardforge` JSON file. Uploaded images are already stored as
  embedded data URLs on their elements, so nothing extra needs bundling
  alongside it.
- **Load** opens a `.cardforge` file back up, replacing the current project.
  A corrupt or unrelated JSON file shows a clear error instead of crashing
  the app.
- **Autosave**: every change is debounce-persisted to the browser's
  IndexedDB in the background. If you come back to a fresh page load and a
  previous session is found, Cardforge asks whether to restore it or start
  fresh — it never silently overwrites what's on screen, and it's a
  convenience net, not a replacement for actually saving a `.cardforge` file
  when you want to keep or share a project.

This completes the core MVP feature set from the spec: build a template,
import data, generate a set, export it, and pick the work back up later.

**Stage 6 — UX polish:**
- **Undo/Redo**: Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (also buttons in the top
  bar) undo/redo template edits, element changes, data edits — anything
  that touches the project. Rapid-fire changes (dragging, typing) are
  coalesced into one step per pause, so undo doesn't require dozens of
  presses to undo a single drag. History resets on New Project / Load /
  Restore session, since those are meant to be fresh starts.
- **Smart alignment guides**: dragging an element now snaps to the card's
  center/edges and to other elements' edges/centers, with an accent-colored guide
  line while it's snapped. Toggle with the magnet button next to the zoom
  controls.
- **Layers panel drag-and-drop**: rows can be dragged to reorder, in
  addition to the existing up/down/duplicate/delete buttons.
- **Preview navigation**: Left/Right arrow keys step between cards while
  one is focused in the Preview tab; Escape returns to the grid.
- **Confirmation on destructive bulk actions**: clearing all imported data
  now asks first (per-row and per-element deletes still don't, since
  they're easy to undo and shouldn't be interrupted by a dialog).
- **Multi-select**: Shift/Ctrl/Cmd+click an element (on the canvas or in the
  Layers list) to add it to the selection; drag any selected element to move
  the whole group together. Drag on empty canvas space to rubber-band select
  everything inside the marquee (hold Shift while doing it to add to the
  current selection instead of replacing it). Resize handles only show for a
  single selection — resizing a group isn't supported. Delete/Duplicate
  (buttons or Delete/Ctrl+D) act on the whole selection.
- **Image asset library** (Data tab): upload a batch of image files once,
  then reference them by exact filename from a table column bound to an
  Image element — e.g. a column containing `goblin.png` matches a file
  uploaded as `goblin.png`. An Image element's binding is resolved in this
  order: a full URL/data-URI in the cell is used directly; otherwise the
  cell's value is looked up in the asset library by filename; otherwise it
  falls back to the element's own static upload. If a bound value can't be
  resolved at all, the card shows a visible "not found" hint (including in
  exports) instead of silently rendering blank, so a missing image is never
  a silent surprise in a finished set. Assets are stored as embedded data
  URLs, so they save/load/autosave with the rest of the project like
  everything else — no separate file management needed. An uploaded image's
  own transparency (alpha channel) is preserved — the striped "no image"
  placeholder only ever shows behind a genuinely missing image, never behind
  a real one. Any uploaded asset can also be dropped straight onto an Image
  element as a fixed, non-data-bound source via the "Or pick from asset
  library" thumbnail grid in the element's properties — handy for reusing
  the same image across elements without re-uploading it each time.

**Stage 7 — print PDF:**
- **Print PDF** (top bar) lays multiple cards out on standard print pages
  instead of one PNG per file — pick a page size (A4 / A3 / US Letter / US
  Legal / custom mm), a margin, spacing between cards, and optionally crop
  marks. The dialog shows a live "N × M = cards per page, P pages total"
  readout, and flags up front if the card is too large to fit the chosen
  page/margins at all.
- Cards are still rendered off-screen through the same `CardRenderer` +
  `renderCardToBlob` pipeline as PNG/ZIP export, then placed as embedded PNG
  images on `pdf-lib`-generated pages — no separate rendering path to drift
  out of sync.
- This was the one piece of the spec explicitly marked "implement only
  after the core system is stable" (§25/§45) — with Stages 1–6 done, the
  full MVP feature list in §46 of the spec is now complete end to end.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

This produces a static `dist/` folder — plain HTML/CSS/JS, no server needed.

```bash
npm run preview   # sanity-check the production build locally
```

## Deploy

**Vercel / Netlify:** point either at this repo. Build command `npm run
build`, output directory `dist`. No environment variables or backend
configuration needed.

**GitHub Pages:** run `npm run build`, then publish the contents of `dist/`
to your `gh-pages` branch (e.g. via the `gh-pages` npm package or a GitHub
Action). `vite.config.ts` already uses a relative `base: "./"` so the build
works from a project sub-path like `username.github.io/cardforge/`.

## Project structure

```
src/
  types/        Shared data model (card, elements, project) — no game concepts
  renderer/     CardRenderer, CardThumbnail, export (PNG/ZIP/PDF), binding helpers
  data/         CSV / pasted-table parsing
  storage/      .cardforge save/load, IndexedDB autosave
  editor/       UI: top bar, tools rail, canvas, layers, data view, preview, dialogs, alignment guides
  state/        Zustand store (current project/view) + undo/redo history
  utils/        Small helpers (id generation, filename sanitizing, downloads)
```

## Шрифты
У текстовых элементов есть поле «Шрифт». Кнопка «Мои шрифты» (Chrome/Edge) подгружает установленные в системе шрифты; в других браузерах можно ввести имя вручную. Шрифт должен быть установлен на устройстве, где открыт сайт/идёт экспорт.

## Контекстное меню
ПКМ по элементу или пустому месту: копировать/вставить/дублировать, закрепить/открепить, сгруппировать/разгруппировать, порядок слоёв (на передний/задний план, вперёд/назад), удалить. Горячие клавиши: Ctrl+C, Ctrl+V, Ctrl+D, Del.

## Горячие клавиши
Ctrl+колесо / + / − — масштаб, Ctrl+0 — 100%; Ctrl+A выделить всё; Ctrl+C/X/V/D; Ctrl+G / Ctrl+Shift+G — группа/разгруппировать; Ctrl+Shift+L — закрепить; Ctrl+] / Ctrl+[ — слой вперёд/назад (с Shift — на передний/задний план); стрелки — сдвиг (Shift — по 10 px); Del; Esc.

## Кривая Безье
У элемента «Линия» в панели свойств есть переключатель «Прямая / Кривая Безье». У кривой на холсте появляются две контрольные точки — тяните их, чтобы изогнуть линию.

Кривая Безье: двойной правый (или левый) клик по линии добавляет точку; тип точки (прямой угол / симметрия / угловая симметрия / асимметрия) выбирается в панели справа.
# cardforge
