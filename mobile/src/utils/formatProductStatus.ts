import type { ProductStatus } from "../types/inventory";

const LABELS: Record<ProductStatus, string> = {
  IN_STOCK: "In stock",
  MISSING: "Missing",
  SOLD: "Sold",
};

/** Human-readable status aligned with backend `ProductStatus` enum. */
export function formatProductStatus(status: ProductStatus): string {
  return LABELS[status] ?? status;
}
