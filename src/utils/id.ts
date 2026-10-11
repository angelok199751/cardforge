let counter = 0;

/** Simple, dependency-free unique id generator (no need for uuid at this scale). */
export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}
