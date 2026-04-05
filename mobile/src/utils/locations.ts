import type { LocationDto, ProductDto } from "../types/inventory";

export function uniqueLocationsFromProducts(
  items: ProductDto[],
): LocationDto[] {
  const map = new Map<string, LocationDto>();
  for (const p of items) {
    map.set(p.location.id, p.location);
  }
  return Array.from(map.values()).sort((a, b) => {
    const f = a.floorLabel.localeCompare(b.floorLabel);
    if (f !== 0) return f;
    return a.name.localeCompare(b.name);
  });
}
