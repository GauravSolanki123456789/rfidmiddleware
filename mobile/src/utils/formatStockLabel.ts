/** Human-readable availability from ERP `isSold`. */
export function formatStockLabel(isSold: boolean): string {
  return isSold ? "Sold" : "Available";
}
