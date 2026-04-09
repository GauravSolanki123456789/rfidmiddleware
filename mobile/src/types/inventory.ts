import { BIN_UNASSIGNED, FIELD_UNKNOWN } from "../constants/productLabels";

/**
 * Product row from the API. Nullable DB columns are normalized server-side to
 * string fallbacks (`FIELD_UNKNOWN`, `BIN_UNASSIGNED`, grossWt `"0"`).
 * Fields remain required here so the UI can rely on strings after fetch.
 */
export interface ProductDto {
  id: number;
  barcode: string;
  styleCode: string;
  sku: string;
  itemName: string;
  grossWt: string;
  isSold: boolean;
  binLocation: string;
}

/** Documented sentinel values (same as backend). */
export type ProductBinSentinel = typeof BIN_UNASSIGNED;
export type ProductFieldSentinel = typeof FIELD_UNKNOWN;

export interface InventorySummaryDto {
  totalItems: number;
  totalInStock: number;
  totalMissing: number;
  totalSold: number;
  distinctBinCount: number;
}

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
