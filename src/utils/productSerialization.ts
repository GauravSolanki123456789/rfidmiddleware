import type { Decimal } from "@prisma/client/runtime/library";
import type { Product } from "@prisma/client";

/** JSON-safe strings for nullable ERP columns (matches mobile expectations). */
export const BIN_UNASSIGNED = "Unassigned";
export const FIELD_UNKNOWN = "Unknown";

/**
 * Jewelry ERPs often store display grams in `weight` or `avg_wt` while `gross_wt`
 * is unset. Prefer the first numeric value that looks meaningful (non-zero if any).
 */
function pickWeightGramsForApi(p: Product): Decimal | null {
  const candidates = [p.grossWt, p.weight, p.avgWt].filter(
    (x): x is Decimal => x != null,
  );

  if (candidates.length === 0) return null;

  const nums = candidates.map((d) => d.toNumber());
  const nonZeroIdx = nums.findIndex((n) => Number.isFinite(n) && n !== 0);
  if (nonZeroIdx >= 0) {
    const chosen = candidates[nonZeroIdx];
    return chosen ?? null;
  }

  const first = candidates[0];
  return first ?? null;
}

/**
 * Prisma returns `Decimal` for `Decimal` fields; JSON must never receive the raw
 * object (serialization can yield wrong values). Always emit a plain string.
 */
function decimalGramsToJsonString(v: Decimal | null): string {
  if (v == null) return "0";
  const n = v.toNumber();
  if (Number.isFinite(n)) {
    return String(n);
  }
  return v.toFixed();
}

function binLocationToJsonString(v: Product["binLocation"]): string {
  if (v == null) return BIN_UNASSIGNED;
  const t = String(v).trim();
  return t.length > 0 ? t : BIN_UNASSIGNED;
}

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    barcode: p.barcode,
    styleCode: p.styleCode ?? FIELD_UNKNOWN,
    sku: p.sku ?? FIELD_UNKNOWN,
    itemName: p.itemName ?? FIELD_UNKNOWN,
    grossWt: decimalGramsToJsonString(pickWeightGramsForApi(p)),
    isSold: p.isSold,
    binLocation: binLocationToJsonString(p.binLocation),
  };
}
