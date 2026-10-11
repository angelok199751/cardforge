import { create } from "zustand";
import { generateId } from "../utils/id";
import { createDefaultElement } from "../editor/elementDefaults";
import type {
  CardBackground,
  CardBorder,
  CardElement,
  CardSettings,
  DataRow,
  DataTable,
  ElementPatch,
  ElementType,
  Orientation,
  Project,
} from "../types";

function defaultCard(): CardSettings {
  return {
    width: 750,
    height: 1050,
    unit: "px",
    orientation: "portrait",
    background: { kind: "color", color: "#F5F1E8" },
    border: { enabled: true, color: "#1F1B16", width: 6, radius: 24 },
  };
}

function emptyProject(name: string): Project {
  return {
    id: generateId("project"),
    name,
    card: defaultCard(),
    elements: [],
    data: { columns: [], rows: [] },
    assets: {},
  };
}

/** Keeps zIndex in sync with array position: index 0 = bottom of the stack. */
function resequence(elements: CardElement[]): CardElement[] {
  return elements.map((el, i) => ({ ...el, zIndex: i }));
}

export type LayerMove = "up" | "down" | "front" | "back";

/** Moves a set of elements in the stack, keeping their relative order. */
function moveMany(elements: CardElement[], ids: Set<string>, dir: LayerMove): CardElement[] {
  const arr = [...elements];
  if (dir === "front") return [...arr.filter((e) => !ids.has(e.id)), ...arr.filter((e) => ids.has(e.id))];
  if (dir === "back") return [...arr.filter((e) => ids.has(e.id)), ...arr.filter((e) => !ids.has(e.id))];
  if (dir === "up") {
    for (let i = arr.length - 2; i >= 0; i--) {
      if (ids.has(arr[i].id) && !ids.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    }
  } else {
    for (let i = 1; i < arr.length; i++) {
      if (ids.has(arr[i].id) && !ids.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
    }
  }
  return arr;
}
export type AppView = "template" | "data" | "preview";

interface ProjectStore {
  project: Project;
  /** Current zoom level for the canvas, 1 = 100%. */
  zoom: number;
  selectedElementIds: string[];
  view: AppView;

  createProject: (name: string, card: CardSettings) => void;
  renameProject: (name: string) => void;
  updateCard: (patch: Partial<CardSettings>) => void;
  updateBackground: (patch: Partial<CardBackground>) => void;
  updateBorder: (patch: Partial<CardBorder>) => void;
  setOrientation: (orientation: Orientation) => void;
  setZoom: (zoom: number) => void;

  addElement: (type: ElementType) => void;
  updateElement: (id: string, patch: ElementPatch) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  duplicateElements: (ids: string[]) => void;
  setElementPositions: (positions: { id: string; x: number; y: number }[]) => void;
  moveLayer: (id: string, direction: LayerMove) => void;
  moveElementToIndex: (id: string, newIndex: number) => void;
  clipboard: CardElement[];
  pasteCount: number;
  selectedPoint: { elementId: string; index: number } | null;
  setSelectedPoint: (p: { elementId: string; index: number } | null) => void;
  copySelected: () => void;
  paste: () => void;
  setLocked: (ids: string[], locked: boolean) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  moveLayers: (ids: string[], direction: LayerMove) => void;
  selectElement: (id: string | null) => void;
  selectElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;

  setView: (view: AppView) => void;
  importData: (table: DataTable) => void;
  clearData: () => void;
  updateDataCell: (rowIndex: number, column: string, value: string) => void;
  addDataRow: () => void;
  deleteDataRow: (rowIndex: number) => void;
  addDataColumn: (name: string) => void;
  removeDataColumn: (name: string) => void;
  renameDataColumn: (oldName: string, newName: string) => void;

  uploadAssets: (files: { name: string; dataUrl: string }[]) => void;
  removeAsset: (name: string) => void;

  loadProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: emptyProject("Без названия"),
  zoom: 1,
  selectedElementIds: [],
  view: "template",
  clipboard: [],
  pasteCount: 0,
  selectedPoint: null,
  setSelectedPoint: (p) => set(() => ({ selectedPoint: p })),

  copySelected: () =>
    set((state) => {
      const ids = new Set(state.selectedElementIds);
      const items = state.project.elements.filter((el) => ids.has(el.id));
      return items.length ? { clipboard: items.map((el) => ({ ...el })), pasteCount: 0 } : {};
    }),

  paste: () =>
    set((state) => {
      if (state.clipboard.length === 0) return {};
      const n = state.pasteCount + 1;
      const groupMap = new Map<string, string>();
      const copies = state.clipboard.map((el): CardElement => {
        let groupId = el.groupId;
        if (groupId) {
          if (!groupMap.has(groupId)) groupMap.set(groupId, generateId("group"));
          groupId = groupMap.get(groupId);
        }
        return { ...el, id: generateId("el"), x: el.x + 16 * n, y: el.y + 16 * n, groupId, locked: false };
      });
      const elements = resequence([...state.project.elements, ...copies]);
      return {
        project: { ...state.project, elements },
        selectedElementIds: copies.map((c) => c.id),
        pasteCount: n,
      };
    }),

  setLocked: (ids, locked) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        project: {
          ...state.project,
          elements: state.project.elements.map((el) => (idSet.has(el.id) ? { ...el, locked } : el)),
        },
      };
    }),

  groupSelected: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2) return {};
      const idSet = new Set(state.selectedElementIds);
      const groupId = generateId("group");
      return {
        project: {
          ...state.project,
          elements: state.project.elements.map((el) => (idSet.has(el.id) ? { ...el, groupId } : el)),
        },
      };
    }),

  ungroupSelected: () =>
    set((state) => {
      const idSet = new Set(state.selectedElementIds);
      return {
        project: {
          ...state.project,
          elements: state.project.elements.map((el) => (idSet.has(el.id) ? { ...el, groupId: undefined } : el)),
        },
      };
    }),

  moveLayers: (ids, direction) =>
    set((state) => ({
      project: {
        ...state.project,
        elements: resequence(moveMany(state.project.elements, new Set(ids), direction)),
      },
    })),

  createProject: (name, card) =>
    set(() => ({
      project: { ...emptyProject(name), card },
      zoom: 1,
      selectedElementIds: [],
      view: "template",
    })),

  renameProject: (name) =>
    set((state) => ({ project: { ...state.project, name } })),

  updateCard: (patch) =>
    set((state) => ({
      project: { ...state.project, card: { ...state.project.card, ...patch } },
    })),

  updateBackground: (patch) =>
    set((state) => ({
      project: {
        ...state.project,
        card: {
          ...state.project.card,
          background: { ...state.project.card.background, ...patch },
        },
      },
    })),

  updateBorder: (patch) =>
    set((state) => ({
      project: {
        ...state.project,
        card: {
          ...state.project.card,
          border: { ...state.project.card.border, ...patch },
        },
      },
    })),

  setOrientation: (orientation) =>
    set((state) => {
      const { width, height } = state.project.card;
      const isCurrentlyPortrait = height >= width;
      const shouldSwap =
        (orientation === "landscape" && isCurrentlyPortrait) ||
        (orientation === "portrait" && !isCurrentlyPortrait);
      return {
        project: {
          ...state.project,
          card: {
            ...state.project.card,
            orientation,
            width: shouldSwap ? height : width,
            height: shouldSwap ? width : height,
          },
        },
      };
    }),

  setZoom: (zoom) => set(() => ({ zoom: Math.min(3, Math.max(0.1, zoom)) })),

  addElement: (type) =>
    set((state) => {
      const el = createDefaultElement(type, state.project.card, state.project.elements.length + 1);
      const elements = resequence([...state.project.elements, el]);
      return {
        project: { ...state.project, elements },
        selectedElementIds: [el.id],
      };
    }),

  updateElement: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        elements: state.project.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as CardElement) : el)),
      },
    })),

  removeElement: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        elements: resequence(state.project.elements.filter((el) => el.id !== id)),
      },
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
    })),

  removeElements: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        project: {
          ...state.project,
          elements: resequence(state.project.elements.filter((el) => !idSet.has(el.id))),
        },
        selectedElementIds: state.selectedElementIds.filter((eid) => !idSet.has(eid)),
      };
    }),

  duplicateElement: (id) =>
    set((state) => {
      const source = state.project.elements.find((el) => el.id === id);
      if (!source) return {};
      const copy: CardElement = {
        ...source,
        id: generateId("el"),
        name: `${source.name} copy`,
        groupId: undefined,
        locked: false,
        x: source.x + 16,
        y: source.y + 16,
      };
      const elements = resequence([...state.project.elements, copy]);
      return { project: { ...state.project, elements }, selectedElementIds: [copy.id] };
    }),

  duplicateElements: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      const copies = state.project.elements
        .filter((el) => idSet.has(el.id))
        .map(
          (el): CardElement => ({
            ...el,
            id: generateId("el"),
            name: `${el.name} copy`,
            groupId: undefined,
            locked: false,
            x: el.x + 16,
            y: el.y + 16,
          })
        );
      if (copies.length === 0) return {};
      const elements = resequence([...state.project.elements, ...copies]);
      return { project: { ...state.project, elements }, selectedElementIds: copies.map((c) => c.id) };
    }),

  setElementPositions: (positions) =>
    set((state) => {
      const byId = new Map(positions.map((p) => [p.id, p]));
      return {
        project: {
          ...state.project,
          elements: state.project.elements.map((el) => {
            const p = byId.get(el.id);
            return p ? { ...el, x: p.x, y: p.y } : el;
          }),
        },
      };
    }),

  moveLayer: (id, direction) =>
    set((state) => {
      const elements = [...state.project.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) return {};

      let targetIndex = index;
      if (direction === "up") targetIndex = Math.min(elements.length - 1, index + 1);
      if (direction === "down") targetIndex = Math.max(0, index - 1);
      if (direction === "front") targetIndex = elements.length - 1;
      if (direction === "back") targetIndex = 0;

      if (targetIndex === index) return {};
      const [moved] = elements.splice(index, 1);
      elements.splice(targetIndex, 0, moved);

      return { project: { ...state.project, elements: resequence(elements) } };
    }),

  moveElementToIndex: (id, newIndex) =>
    set((state) => {
      const elements = [...state.project.elements];
      const oldIndex = elements.findIndex((el) => el.id === id);
      if (oldIndex === -1) return {};

      const clampedIndex = Math.max(0, Math.min(elements.length - 1, newIndex));
      if (clampedIndex === oldIndex) return {};

      const [moved] = elements.splice(oldIndex, 1);
      elements.splice(clampedIndex, 0, moved);

      return { project: { ...state.project, elements: resequence(elements) } };
    }),

  selectElement: (id) => set(() => ({ selectedElementIds: id ? [id] : [] })),

  selectElements: (ids) => set(() => ({ selectedElementIds: Array.from(new Set(ids)) })),

  toggleElementSelection: (id) =>
    set((state) => ({
      selectedElementIds: state.selectedElementIds.includes(id)
        ? state.selectedElementIds.filter((eid) => eid !== id)
        : [...state.selectedElementIds, id],
    })),

  setView: (view) => set(() => ({ view })),

  importData: (table) =>
    set((state) => ({
      project: { ...state.project, data: table },
    })),

  clearData: () =>
    set((state) => ({
      project: { ...state.project, data: { columns: [], rows: [] } },
    })),

  updateDataCell: (rowIndex, column, value) =>
    set((state) => {
      const rows = state.project.data.rows.map((row, i) => (i === rowIndex ? { ...row, [column]: value } : row));
      return { project: { ...state.project, data: { ...state.project.data, rows } } };
    }),

  addDataRow: () =>
    set((state) => {
      const blank: DataRow = {};
      state.project.data.columns.forEach((col) => {
        blank[col] = "";
      });
      return {
        project: {
          ...state.project,
          data: { ...state.project.data, rows: [...state.project.data.rows, blank] },
        },
      };
    }),

  deleteDataRow: (rowIndex) =>
    set((state) => ({
      project: {
        ...state.project,
        data: { ...state.project.data, rows: state.project.data.rows.filter((_, i) => i !== rowIndex) },
      },
    })),

  addDataColumn: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed || state.project.data.columns.includes(trimmed)) return {};
      const columns = [...state.project.data.columns, trimmed];
      const rows = state.project.data.rows.map((row) => ({ ...row, [trimmed]: "" }));
      return { project: { ...state.project, data: { columns, rows } } };
    }),

  removeDataColumn: (name) =>
    set((state) => {
      const columns = state.project.data.columns.filter((c) => c !== name);
      const rows = state.project.data.rows.map((row) => {
        const next = { ...row };
        delete next[name];
        return next;
      });
      return { project: { ...state.project, data: { columns, rows } } };
    }),

  renameDataColumn: (oldName, newName) =>
    set((state) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName || state.project.data.columns.includes(trimmed)) return {};
      const columns = state.project.data.columns.map((c) => (c === oldName ? trimmed : c));
      const rows = state.project.data.rows.map((row) => {
        const next = { ...row };
        const value = next[oldName] ?? "";
        delete next[oldName];
        next[trimmed] = value;
        return next;
      });
      return { project: { ...state.project, data: { columns, rows } } };
    }),

  uploadAssets: (files) =>
    set((state) => {
      const assets = { ...state.project.assets };
      for (const file of files) {
        assets[file.name] = file.dataUrl;
      }
      return { project: { ...state.project, assets } };
    }),

  removeAsset: (name) =>
    set((state) => {
      const assets = { ...state.project.assets };
      delete assets[name];
      return { project: { ...state.project, assets } };
    }),

  loadProject: (project) =>
    set(() => ({
      project,
      selectedElementIds: [],
      view: "template",
      zoom: 1,
    })),
}));

