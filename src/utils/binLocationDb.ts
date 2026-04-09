import { BIN_UNASSIGNED } from "./productSerialization.js";

/**
 * Map API/UI "Unassigned" to DB null for filters and writes.
 */
export function binLocationToDbValue(value: string): string | null {
  const t = value.trim();
  if (t === "" || t === BIN_UNASSIGNED) return null;
  return t;
}
