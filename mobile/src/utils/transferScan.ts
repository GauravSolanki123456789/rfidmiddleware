import type { ProductDto } from "../types/inventory";

/**
 * Client-side filter aligned with GET /inventory/master-list semantics:
 * source location + optional design contains + optional SKU equals (case-insensitive).
 */
export function filterExpectedTransferItems(
  items: ProductDto[],
  sourceLocationId: string,
  designNameTrim: string | undefined,
  skuCodeTrim: string | undefined,
): ProductDto[] {
  return items.filter((p) => {
    if (p.locationId !== sourceLocationId) return false;
    if (designNameTrim) {
      if (!p.designName.toLowerCase().includes(designNameTrim.toLowerCase())) {
        return false;
      }
    }
    if (skuCodeTrim) {
      if (p.skuCode.toLowerCase() !== skuCodeTrim.toLowerCase()) {
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
    epc: string;
    knownProduct: ProductDto | null;
    reason: string;
  }[];
}

export function buildTransferScanReport(
  sourceLocationId: string,
  expectedProducts: ProductDto[],
  scannedEpcs: string[],
  masterItems: ProductDto[],
): TransferScanReport {
  const expectedEpcSet = new Set(expectedProducts.map((p) => p.epcTagId));
  const scannedUnique = [
    ...new Set(
      scannedEpcs.map((s) => s.trim()).filter((s) => s.length > 0),
    ),
  ];

  const ready: ProductDto[] = [];
  const seenReady = new Set<string>();
  for (const epc of scannedUnique) {
    if (!expectedEpcSet.has(epc)) continue;
    const p = expectedProducts.find((x) => x.epcTagId === epc);
    if (p && !seenReady.has(epc)) {
      seenReady.add(epc);
      ready.push(p);
    }
  }

  const scannedSet = new Set(scannedUnique);
  const missing = expectedProducts.filter((p) => !scannedSet.has(p.epcTagId));

  const byEpc = new Map(masterItems.map((p) => [p.epcTagId, p]));
  const invalidTags: TransferScanReport["invalidTags"] = [];

  for (const epc of scannedUnique) {
    if (expectedEpcSet.has(epc)) continue;
    const known = byEpc.get(epc) ?? null;
    let reason: string;
    if (!known) {
      reason = "Not in inventory catalog";
    } else if (known.locationId !== sourceLocationId) {
      reason = `Tag is at ${known.location.name} (${known.location.floorLabel})`;
    } else {
      reason = "Does not match design / SKU filter";
    }
    invalidTags.push({ epc, knownProduct: known, reason });
  }

  return { ready, missing, invalidTags };
}

/**
 * Simulates an RFID read: mostly tags from the expected set, plus noise
 * (another location and/or unknown EPC) so Review can demonstrate all buckets.
 */
export function generateMockTransferEpcs(
  sourceLocationId: string,
  expected: ProductDto[],
  masterItems: ProductDto[],
): string[] {
  const out: string[] = [];
  const expectedEpcs = expected.map((p) => p.epcTagId);

  if (expected.length > 0) {
    const take = Math.max(
      1,
      Math.min(4, Math.ceil(expected.length * 0.55)),
    );
    for (let i = 0; i < Math.min(take, expected.length); i++) {
      out.push(expectedEpcs[i]);
    }
  }

  const wrongLocation = masterItems.find(
    (p) =>
      p.locationId !== sourceLocationId &&
      !expected.some((e) => e.epcTagId === p.epcTagId),
  );
  if (wrongLocation) {
    out.push(wrongLocation.epcTagId);
  }

  out.push("DEADBEEF0000000000000001");

  return [...new Set(out)];
}
