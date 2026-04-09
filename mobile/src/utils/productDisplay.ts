import { BIN_UNASSIGNED, FIELD_UNKNOWN } from "../constants/productLabels";
import type { ProductDto } from "../types/inventory";

/** Defensive display (e.g. if a row bypasses API serialization). */
export function displayStyleCode(p: Pick<ProductDto, "styleCode">): string {
  const s = p.styleCode?.trim();
  return s || FIELD_UNKNOWN;
}

export function displaySku(p: Pick<ProductDto, "sku">): string {
  const s = p.sku?.trim();
  return s || FIELD_UNKNOWN;
}

export function displayItemName(p: Pick<ProductDto, "itemName">): string {
  const s = p.itemName?.trim();
  return s || FIELD_UNKNOWN;
}

export function displayBin(p: Pick<ProductDto, "binLocation">): string {
  const s = p.binLocation?.trim();
  return s || BIN_UNASSIGNED;
}

export function displayGrossWt(p: Pick<ProductDto, "grossWt">): string {
  const s = p.grossWt?.trim();
  return s || "0";
}
