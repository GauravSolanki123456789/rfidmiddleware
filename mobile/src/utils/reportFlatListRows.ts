import type { AuditResultDto, ProductDto } from "../types/inventory";
import type { TransferScanReport } from "./transferScan";

export type AuditListRow =
  | { key: string; kind: "header"; title: string }
  | {
      key: string;
      kind: "product";
      product: ProductDto;
      tone: "success" | "danger";
    }
  | { key: string; kind: "epc"; epc: string }
  | { key: string; kind: "empty"; label: string };

export function auditResultToFlatListRows(r: AuditResultDto): AuditListRow[] {
  const rows: AuditListRow[] = [];

  rows.push({ key: "hdr-found", kind: "header", title: "Found" });
  if (r.found_items.length === 0) {
    rows.push({ key: "empty-found", kind: "empty", label: "None" });
  } else {
    for (const p of r.found_items) {
      rows.push({
        key: `found-${p.id}`,
        kind: "product",
        product: p,
        tone: "success",
      });
    }
  }

  rows.push({ key: "hdr-missing", kind: "header", title: "Missing" });
  if (r.missing_items.length === 0) {
    rows.push({ key: "empty-missing", kind: "empty", label: "None" });
  } else {
    for (const p of r.missing_items) {
      rows.push({
        key: `missing-${p.id}`,
        kind: "product",
        product: p,
        tone: "danger",
      });
    }
  }

  rows.push({ key: "hdr-unknown", kind: "header", title: "Unknown tags" });
  if (r.unknown_items.length === 0) {
    rows.push({ key: "empty-unknown", kind: "empty", label: "None" });
  } else {
    for (const epc of r.unknown_items) {
      rows.push({ key: `unknown-${epc}`, kind: "epc", epc });
    }
  }

  return rows;
}

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
        key: `invalid-${row.epc}`,
        kind: "invalid",
        row,
      });
    }
  }

  return rows;
}
