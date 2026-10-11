import type { CardElement, DataRow } from "../types";

const BINDING_PATTERN = /\$\{(\w+)\}/g;

/**
 * Resolves `${fieldName}` placeholders inside a text template against a data row.
 * Missing fields resolve to an empty string rather than throwing, so a single
 * bad binding never breaks the whole card (see error-handling requirements).
 */
export function resolveTemplate(template: string, row: DataRow | undefined): string {
  if (!row) return template;
  return template.replace(BINDING_PATTERN, (_match, field: string) => row[field] ?? "");
}

/** Resolves a plain field binding (used by value/image elements). */
export function resolveField(fieldName: string | undefined, row: DataRow | undefined): string {
  if (!fieldName || !row) return "";
  return row[fieldName] ?? "";
}

/** Returns the list of `${field}` names referenced by a template string. */
export function extractFieldNames(template: string): string[] {
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  const pattern = new RegExp(BINDING_PATTERN);
  while ((match = pattern.exec(template)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

/** Returns the field names a given element actually references, if any. */
export function fieldsReferencedBy(el: CardElement): string[] {
  if (el.type === "text") return extractFieldNames(el.content);
  if ((el.type === "value" || el.type === "image") && el.dataBinding) return [el.dataBinding];
  return [];
}

/**
 * Of the fields an element references, which ones don't exist among the
 * imported columns. Empty when no data has been imported yet (nothing to
 * validate against) or the element has no bindings.
 */
export function missingFieldsFor(el: CardElement, columns: string[]): string[] {
  if (columns.length === 0) return [];
  const columnSet = new Set(columns);
  return fieldsReferencedBy(el).filter((field) => !columnSet.has(field));
}

