import type { Request } from "express";
import { z } from "zod";

function getQueryParam(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first !== "string") return undefined;
    const t = first.trim();
    return t === "" ? undefined : t;
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t === "" ? undefined : t;
  }
  return undefined;
}

export const masterListQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  designName: z.string().min(1).optional(),
  skuCode: z.string().min(1).optional(),
});

export type MasterListQuery = z.infer<typeof masterListQuerySchema>;

export function parseMasterListQuery(query: Request["query"]): MasterListQuery {
  return masterListQuerySchema.parse({
    locationId: getQueryParam(query.locationId),
    designName: getQueryParam(query.designName),
    skuCode: getQueryParam(query.skuCode),
  });
}

export const auditBodySchema = z.object({
  scannedEpcs: z
    .array(z.string().min(1))
    .max(10_000)
    .transform((arr) => arr.map((s) => s.trim())),
  locationId: z.string().uuid(),
});

export type AuditBody = z.infer<typeof auditBodySchema>;

export const transferBodySchema = z.object({
  epcTagIds: z
    .array(z.string().min(1))
    .max(10_000)
    .transform((arr) => arr.map((s) => s.trim())),
  newLocationId: z.string().uuid(),
});

export type TransferBody = z.infer<typeof transferBodySchema>;
