/** Mirrors backend JSON field names (camelCase). */

export type ProductStatus = "IN_STOCK" | "SOLD" | "MISSING";

export type ProductItemType = "RING" | "NECKLACE" | "BANGLE";

export interface LocationDto {
  id: string;
  name: string;
  floorLabel: string;
}

export interface ProductDto {
  id: string;
  epcTagId: string;
  skuCode: string;
  designName: string;
  itemType: ProductItemType;
  grossWeightGrams: string;
  netWeightGrams: string;
  locationId: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  location: LocationDto;
}

export interface InventorySummaryDto {
  totalItems: number;
  totalInStock: number;
  totalMissing: number;
  totalSold: number;
}

export interface AuditResultDto {
  found_items: ProductDto[];
  missing_items: ProductDto[];
  unknown_items: string[];
}

/** PUT /inventory/transfer — matches backend `transferBodySchema`. */
export interface TransferResultDto {
  updatedCount: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: { message: string; details?: unknown };
}
