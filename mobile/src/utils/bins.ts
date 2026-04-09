import type { ProductDto } from "../types/inventory";

/** Distinct non-empty bin codes from the master list, sorted for pickers. */
export function uniqueBinLocationsFromProducts(
  items: ProductDto[],
): string[] {
  const set = new Set<string>();
  for (const p of items) {
    const b = p.binLocation?.trim();
    if (b) set.add(b);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
