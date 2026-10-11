import { generateId } from "../utils/id";
import { downloadBlob } from "../utils/downloadBlob";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import type { AssetLibrary, CardElement, CardSettings, DataTable, Project } from "../types";

const FILE_EXTENSION = ".cardforge";
const FORMAT_VERSION = 1;

export class ProjectFileError extends Error {}

interface UnknownRecord {
  [key: string]: unknown;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function projectFileName(project: Project): string {
  return `${sanitizeFilename(project.name)}${FILE_EXTENSION}`;
}

/** Triggers a browser download of the project as a single JSON file — images are already embedded as data URLs, so nothing else needs bundling. */
export function downloadProjectFile(project: Project): void {
  const payload = JSON.stringify({ formatVersion: FORMAT_VERSION, project }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  downloadBlob(blob, projectFileName(project));
}

/**
 * Parses a previously-exported project file. Performs light structural
 * validation (enough to avoid crashing on a corrupt or unrelated JSON file)
 * rather than deeply validating every element — consistent with the app's
 * general approach of degrading gracefully instead of blocking on edge cases.
 */
export function parseProjectFile(raw: string): Project {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProjectFileError("Это не корректный JSON-файл.");
  }

  const candidate: unknown = isRecord(parsed) && "project" in parsed ? parsed.project : parsed;

  if (!isRecord(candidate) || !isRecord(candidate.card) || !Array.isArray(candidate.elements)) {
    throw new ProjectFileError("Это не похоже на файл проекта Cardforge.");
  }

  const data: DataTable =
    isRecord(candidate.data) && Array.isArray(candidate.data.columns) && Array.isArray(candidate.data.rows)
      ? (candidate.data as unknown as DataTable)
      : { columns: [], rows: [] };

  // Older saved projects predate the asset library — default to empty rather than failing to load.
  const assets: AssetLibrary = isRecord(candidate.assets) ? (candidate.assets as unknown as AssetLibrary) : {};

  return {
    id: typeof candidate.id === "string" ? candidate.id : generateId("project"),
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name : "Импортированный проект",
    card: candidate.card as unknown as CardSettings,
    elements: candidate.elements as unknown as CardElement[],
    data,
    assets,
  };
}

/** Reads a File (from an <input type="file"> or drop event) as text and parses it as a project. */
export function readProjectFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseProjectFile(String(reader.result ?? "")));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new ProjectFileError("Не удалось прочитать файл."));
    reader.readAsText(file);
  });
}
