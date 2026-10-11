import { useSyncExternalStore } from "react";
import { useProjectStore } from "./projectStore";
import type { Project } from "../types";

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

let past: Project[] = [];
let future: Project[] = [];
let lastCommitted: Project | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let suppressNext = false;
let listeners: Array<() => void> = [];
let status = { canUndo: false, canRedo: false };

function updateStatus() {
  status = { canUndo: past.length > 0, canRedo: future.length > 0 };
  listeners.forEach((l) => l());
}

function commit(snapshot: Project) {
  past.push(snapshot);
  if (past.length > MAX_HISTORY) past.shift();
  future = [];
  updateStatus();
}

/**
 * Starts watching the project store. Rapid-fire changes (dragging a
 * handle, typing in a field) are coalesced into a single undo step once
 * they pause for `DEBOUNCE_MS`, rather than one step per pixel/keystroke.
 */
export function attachHistory(): () => void {
  lastCommitted = useProjectStore.getState().project;
  return useProjectStore.subscribe((state) => {
    if (suppressNext) {
      suppressNext = false;
      lastCommitted = state.project;
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const current = useProjectStore.getState().project;
      if (lastCommitted && lastCommitted !== current) {
        commit(lastCommitted);
        lastCommitted = current;
      }
    }, DEBOUNCE_MS);
  });
}

export function undo(): void {
  const current = useProjectStore.getState().project;

  // An edit is still "in flight" (debounce hasn't committed it yet) — undo
  // that first by snapping back to the last committed snapshot, without
  // touching the past stack.
  if (debounceTimer && lastCommitted && lastCommitted !== current) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    future.push(current);
    if (future.length > MAX_HISTORY) future.shift();
    suppressNext = true;
    useProjectStore.setState({ project: lastCommitted });
    updateStatus();
    return;
  }

  const previous = past.pop();
  if (!previous) return;
  future.push(current);
  if (future.length > MAX_HISTORY) future.shift();
  suppressNext = true;
  lastCommitted = previous;
  useProjectStore.setState({ project: previous });
  updateStatus();
}

export function redo(): void {
  if (debounceTimer) return; // don't redo over an in-flight edit
  const next = future.pop();
  if (!next) return;
  const current = useProjectStore.getState().project;
  past.push(current);
  if (past.length > MAX_HISTORY) past.shift();
  suppressNext = true;
  lastCommitted = next;
  useProjectStore.setState({ project: next });
  updateStatus();
}

/** Clears history — call after loading a different project or starting a new one. */
export function resetHistory(): void {
  past = [];
  future = [];
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  lastCommitted = useProjectStore.getState().project;
  updateStatus();
}

function subscribeStatus(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getStatus() {
  return status;
}

export function useHistoryStatus() {
  return useSyncExternalStore(subscribeStatus, getStatus, getStatus);
}
