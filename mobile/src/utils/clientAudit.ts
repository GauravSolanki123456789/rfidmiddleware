import type { ProductDto } from "../types/inventory";

/** Empty string means “All bins”. */
export type AuditScopeFilters = {
  binLocation: string;
  /**
   * SKUs selected in Advanced Filter. Empty = no SKU restriction (full catalog).
   * Non-empty = expected items must have `sku` in this list.
   */
  selectedSkus: readonly string[];
};

export function computeAuditView(
  catalog: ProductDto[],
  scannedBarcodes: string[],
  filters: AuditScopeFilters,
) {
  const scannedSet = new Set(scannedBarcodes);
  const skuScope =
    filters.selectedSkus.length > 0 ? new Set(filters.selectedSkus) : null;

  const expected = catalog.filter((p) => {
    if (filters.binLocation && p.binLocation !== filters.binLocation)
      return false;
    if (skuScope && !skuScope.has(p.sku)) return false;
    return true;
  });

  const expectedBarcodes = new Set(expected.map((p) => p.barcode));

  const found: ProductDto[] = [];
  const missing: ProductDto[] = [];
  for (const p of expected) {
    if (scannedSet.has(p.barcode)) found.push(p);
    else missing.push(p);
  }

  const unknown: string[] = [];
  for (const b of scannedSet) {
    if (!expectedBarcodes.has(b)) unknown.push(b);
  }
  unknown.sort((a, b) => a.localeCompare(b));

  return {
    found,
    missing,
    unknown,
    expectedCount: expected.length,
  };
}

export function uniqueValues(
  items: ProductDto[],
  field: keyof Pick<ProductDto, "styleCode" | "sku" | "binLocation">,
): string[] {
  const s = new Set<string>();
  for (const p of items) {
    const v = String(p[field] ?? "").trim();
    if (v) s.add(v);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Search across catalog fields + gross weight string. */
export function productMatchesSearch(p: ProductDto, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const hay = [
    p.itemName,
    p.sku,
    p.styleCode,
    p.barcode,
    p.binLocation,
    p.grossWt,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(t);
}
