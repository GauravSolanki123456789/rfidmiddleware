import type { ProductDto } from "../types/inventory";
import {
  displayBin,
  displayItemName,
  displaySku,
  displayStyleCode,
} from "./productDisplay";

/**
 * Client-side filter aligned with GET /inventory/master-list:
 * source bin + optional item name contains + optional style code contains + optional SKU equals (case-insensitive).
 */
export function filterExpectedTransferItems(
  items: ProductDto[],
  sourceBinLocation: string,
  opts: {
    itemNameTrim?: string;
    styleCodeTrim?: string;
    skuTrim?: string;
  },
): ProductDto[] {
  const { itemNameTrim, styleCodeTrim, skuTrim } = opts;
  return items.filter((p) => {
    if (displayBin(p) !== sourceBinLocation) return false;
    if (itemNameTrim) {
      if (
        !displayItemName(p)
          .toLowerCase()
          .includes(itemNameTrim.toLowerCase())
      ) {
        return false;
      }
    }
    if (styleCodeTrim) {
      if (
        !displayStyleCode(p)
          .toLowerCase()
          .includes(styleCodeTrim.toLowerCase())
      ) {
        return false;
      }
    }
    if (skuTrim) {
      if (displaySku(p).toLowerCase() !== skuTrim.toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

export interface TransferScanReport {
  ready: ProductDto[];
  missing: ProductDto[];
  invalidTags: {
    barcode: string;
    knownProduct: ProductDto | null;
    reason: string;
  }[];
}

export function buildTransferScanReport(
  sourceBinLocation: string,
  expectedProducts: ProductDto[],
  scannedBarcodes: string[],
  masterItems: ProductDto[],
): TransferScanReport {
  const expectedBarcodeSet = new Set(
    expectedProducts.map((p) => p.barcode),
  );
  const scannedUnique = [
    ...new Set(
      scannedBarcodes.map((s) => s.trim()).filter((s) => /^\d{8}$/.test(s)),
    ),
  ];

  const ready: ProductDto[] = [];
  const seenReady = new Set<string>();
  for (const barcode of scannedUnique) {
    if (!expectedBarcodeSet.has(barcode)) continue;
    const p = expectedProducts.find((x) => x.barcode === barcode);
    if (p && !seenReady.has(barcode)) {
      seenReady.add(barcode);
      ready.push(p);
    }
  }

  const scannedSet = new Set(scannedUnique);
  const missing = expectedProducts.filter((p) => !scannedSet.has(p.barcode));

  const byBarcode = new Map(masterItems.map((p) => [p.barcode, p]));
  const invalidTags: TransferScanReport["invalidTags"] = [];

  for (const barcode of scannedUnique) {
    if (expectedBarcodeSet.has(barcode)) continue;
    const known = byBarcode.get(barcode) ?? null;
    let reason: string;
    if (!known) {
      reason = "Not in inventory catalog";
    } else if (displayBin(known) !== sourceBinLocation) {
      reason = `Item is in bin “${displayBin(known)}”`;
    } else {
      reason = "Does not match style / item / SKU filter";
    }
    invalidTags.push({ barcode, knownProduct: known, reason });
  }

  return { ready, missing, invalidTags };
}
