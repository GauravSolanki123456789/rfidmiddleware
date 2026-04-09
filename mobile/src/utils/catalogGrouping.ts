import { FIELD_UNKNOWN } from "../constants/productLabels";
import type { ProductDto } from "../types/inventory";

export type SkuCountRow = { sku: string; count: number };

export type StyleGroupRow = {
  styleCode: string;
  skuRows: SkuCountRow[];
  totalCount: number;
};

/** Group available inventory by style_code, then aggregate counts per sku. */
export function buildCatalogOverview(items: ProductDto[]): StyleGroupRow[] {
  const byStyle = new Map<string, Map<string, number>>();
  for (const p of items) {
    const sc = (p.styleCode ?? "").trim() || FIELD_UNKNOWN;
    const sku = (p.sku ?? "").trim() || FIELD_UNKNOWN;
    if (!byStyle.has(sc)) byStyle.set(sc, new Map());
    const m = byStyle.get(sc)!;
    m.set(sku, (m.get(sku) ?? 0) + 1);
  }
  const out: StyleGroupRow[] = [];
  for (const [styleCode, skuMap] of byStyle) {
    let total = 0;
    const skuRows: SkuCountRow[] = [];
    for (const [sku, count] of skuMap) {
      skuRows.push({ sku, count });
      total += count;
    }
    skuRows.sort((a, b) => a.sku.localeCompare(b.sku));
    out.push({ styleCode, skuRows, totalCount: total });
  }
  out.sort((a, b) => a.styleCode.localeCompare(b.styleCode));
  return out;
}
