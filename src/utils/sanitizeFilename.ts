/**
 * Strips characters that are invalid in filenames on Windows/macOS/Linux
 * (`< > : " / \ | ? *` and control characters), collapses whitespace, and
 * trims trailing dots/spaces (also invalid on Windows). Deliberately does
 * NOT strip non-ASCII characters — card data (and filenames) are very
 * commonly non-English, and modern filesystems handle Unicode fine.
 */
export function sanitizeFilename(input: string): string {
  const cleaned = input
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/, "");
  return cleaned || "card";
}
