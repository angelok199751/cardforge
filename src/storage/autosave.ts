import { idbDelete, idbGet, idbSet } from "./db";
import { useProjectStore } from "../state/projectStore";
import type { Project } from "../types";

const AUTOSAVE_KEY = "autosave-project";
const DEBOUNCE_MS = 1200;

export async function loadAutosavedProject(): Promise<Project | null> {
  try {
    const project = await idbGet<Project>(AUTOSAVE_KEY);
    if (!project) return null;
    // Sessions saved before the asset library existed won't have this field.
    return { ...project, assets: project.assets ?? {} };
  } catch {
    // IndexedDB unavailable (private browsing, old browser, etc.) — autosave
    // is a convenience, never a hard requirement.
    return null;
  }
}

export async function clearAutosavedProject(): Promise<void> {
  try {
    await idbDelete(AUTOSAVE_KEY);
  } catch {
    // best-effort
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(project: Project) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    idbSet(AUTOSAVE_KEY, project).catch(() => {
      // best-effort; a failed autosave should never interrupt the person's work
    });
  }, DEBOUNCE_MS);
}

/** Subscribes to the project store and debounce-persists every change. Returns an unsubscribe function. */
export function attachAutosave(): () => void {
  return useProjectStore.subscribe((state) => scheduleAutosave(state.project));
}
