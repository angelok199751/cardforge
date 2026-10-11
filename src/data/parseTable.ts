import type { DataRow, DataTable } from "../types";

/** Picks tab if present on the first non-empty line (typical of a spreadsheet paste), else comma. */
function detectDelimiter(raw: string): string {
  const firstLine = raw.split(/\r?\n/).find((line) => line.length > 0) ?? "";
  return firstLine.includes("\t") ? "\t" : ",";
}

/** Minimal RFC4180-ish tokenizer: supports quoted fields, escaped quotes, and either delimiter. */
function tokenizeRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-blank trailing rows produced by a trailing newline.
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Parses pasted or uploaded tabular text (CSV or tab-separated) into a DataTable. */
export function parseDelimitedText(raw: string): DataTable {
  const trimmed = raw.trim();
  if (!trimmed) return { columns: [], rows: [] };

  const delimiter = detectDelimiter(trimmed);
  const rawRows = tokenizeRows(trimmed, delimiter);
  if (rawRows.length === 0) return { columns: [], rows: [] };

  const [headerRow, ...bodyRows] = rawRows;
  const columns = headerRow.map((h, i) => h.trim() || `column_${i + 1}`);

  const rows: DataRow[] = bodyRows
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r) => {
      const row: DataRow = {};
      columns.forEach((col, i) => {
        row[col] = (r[i] ?? "").trim();
      });
      return row;
    });

  return { columns, rows };
}
