import type { ProductDto } from "../types/inventory";
import { displaySku, displayStyleCode } from "./productDisplay";

export type StyleSkuTreeNode = {
  styleCode: string;
  skus: { sku: string; count: number }[];
};

/** Group catalog by display style → distinct SKUs with row counts. */
export function buildStyleSkuTree(items: ProductDto[]): StyleSkuTreeNode[] {
  const map = new Map<string, Map<string, number>>();
  for (const p of items) {
    const style = displayStyleCode(p);
    const sku = displaySku(p);
    if (!map.has(style)) map.set(style, new Map());
    const m = map.get(style)!;
    m.set(sku, (m.get(sku) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([styleCode, skuMap]) => ({
      styleCode,
      skus: [...skuMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([sku, count]) => ({ sku, count })),
    }));
}
