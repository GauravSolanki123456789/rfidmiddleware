import type { ProductDto } from "../types/inventory";
import type { TransferScanReport } from "./transferScan";

export type TransferListRow =
  | { key: string; kind: "header"; title: string }
  | {
      key: string;
      kind: "product";
      product: ProductDto;
      tone: "success" | "warning";
    }
  | {
      key: string;
      kind: "invalid";
      row: TransferScanReport["invalidTags"][number];
    }
  | { key: string; kind: "empty"; label: string };

export function transferReportToFlatListRows(
  r: TransferScanReport,
): TransferListRow[] {
  const rows: TransferListRow[] = [];

  rows.push({ key: "hdr-ready", kind: "header", title: "Ready to transfer" });
  if (r.ready.length === 0) {
    rows.push({ key: "empty-ready", kind: "empty", label: "None" });
  } else {
    for (const p of r.ready) {
      rows.push({
        key: `ready-${p.id}`,
        kind: "product",
        product: p,
        tone: "success",
      });
    }
  }

  rows.push({
    key: "hdr-missing",
    kind: "header",
    title: "Missing from filter",
  });
  if (r.missing.length === 0) {
    rows.push({ key: "empty-missing", kind: "empty", label: "None" });
  } else {
    for (const p of r.missing) {
      rows.push({
        key: `missing-${p.id}`,
        kind: "product",
        product: p,
        tone: "warning",
      });
    }
  }

  rows.push({ key: "hdr-invalid", kind: "header", title: "Invalid scan" });
  if (r.invalidTags.length === 0) {
    rows.push({ key: "empty-invalid", kind: "empty", label: "None" });
  } else {
    for (const row of r.invalidTags) {
      rows.push({
        key: `invalid-${row.barcode}`,
        kind: "invalid",
        row,
      });
    }
  }

  return rows;
}
