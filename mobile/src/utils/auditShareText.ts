import type { ProductDto } from "../types/inventory";
import {
  displayGrossWt,
  displayItemName,
} from "./productDisplay";
import type { AuditScopeFilters } from "./clientAudit";

function filterLabel(filters: AuditScopeFilters): string {
  const parts: string[] = [];
  if (filters.selectedSkus.length > 0) {
    parts.push(
      `${filters.selectedSkus.length} SKU${
        filters.selectedSkus.length === 1 ? "" : "s"
      } selected`,
    );
  }
  if (filters.binLocation) parts.push(`Bin ${filters.binLocation}`);
  if (parts.length === 0) return "All SKUs · All bins";
  return parts.join(" · ");
}

function productShareLine(p: ProductDto): string {
  const wt = displayGrossWt(p);
  const name = displayItemName(p);
  return `- ${p.barcode} (${name}, ${wt}g)`;
}

function lookup(
  catalog: ProductDto[],
  barcode: string,
): ProductDto | undefined {
  return catalog.find((p) => p.barcode === barcode);
}

export type AuditShareInput = {
  filters: AuditScopeFilters;
  catalog: ProductDto[];
  found: ProductDto[];
  missingForList: ProductDto[];
  missingTotalCount: number;
  unknownBarcodes: string[];
  missingSearchQuery: string;
  expectedCount: number;
};

/**
 * Plain-text audit summary for Share sheet (WhatsApp, Email, etc.).
 */
export function buildAuditShareText(input: AuditShareInput): string {
  const lines: string[] = [];
  const title = "Audit Report";
  lines.push(title);
  lines.push(`Filter: ${filterLabel(input.filters)}`);
  if (input.missingSearchQuery.trim()) {
    lines.push(`Missing search: "${input.missingSearchQuery.trim()}"`);
  }
  lines.push("");
  lines.push(
    `Expected in scope: ${input.expectedCount} | Found: ${input.found.length} | Missing: ${input.missingTotalCount} | Unknown scans: ${input.unknownBarcodes.length}`,
  );
  lines.push("");

  lines.push("Found:");
  if (input.found.length === 0) {
    lines.push("- (none)");
  } else {
    for (const p of input.found) {
      lines.push(productShareLine(p));
    }
  }
  lines.push("");

  lines.push(
    input.missingSearchQuery.trim()
      ? `Missing (list matches search; total missing in scope: ${input.missingTotalCount}):`
      : "Missing:",
  );
  if (input.missingForList.length === 0) {
    lines.push("- (none)");
  } else {
    for (const p of input.missingForList) {
      lines.push(productShareLine(p));
    }
  }
  lines.push("");

  lines.push("Unknown / out-of-scope scans:");
  if (input.unknownBarcodes.length === 0) {
    lines.push("- (none)");
  } else {
    for (const b of input.unknownBarcodes) {
      const p = lookup(input.catalog, b);
      if (p) {
        lines.push(
          `- ${b} (${displayItemName(p)}, ${displayGrossWt(p)}g) — outside current filter`,
        );
      } else {
        lines.push(`- ${b} (not in catalog)`);
      }
    }
  }

  lines.push("");
  lines.push(`Generated ${new Date().toISOString()}`);

  return lines.join("\n");
}
