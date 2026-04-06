import type { Location, Product } from "@prisma/client";

export type ProductWithLocation = Product & { location: Location };

export function serializeProduct(p: ProductWithLocation) {
  return {
    id: p.id,
    epcTagId: p.epcTagId,
    skuCode: p.skuCode,
    designName: p.designName,
    itemType: p.itemType,
    grossWeightGrams: p.grossWeightGrams.toString(),
    netWeightGrams: p.netWeightGrams.toString(),
    locationId: p.locationId,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    location: {
      id: p.location.id,
      name: p.location.name,
      floorLabel: p.location.floorLabel,
    },
  };
}
