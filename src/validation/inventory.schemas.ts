import type { Request } from "express";
import { z } from "zod";

const barcode8 = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "Must be exactly 8 digits (0–9)");

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
  binLocation: z.string().min(1).optional(),
  styleCode: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  itemName: z.string().min(1).optional(),
});

export type MasterListQuery = z.infer<typeof masterListQuerySchema>;

export function parseMasterListQuery(query: Request["query"]): MasterListQuery {
  return masterListQuerySchema.parse({
    binLocation: getQueryParam(query.binLocation),
    styleCode: getQueryParam(query.styleCode),
    sku: getQueryParam(query.sku),
    itemName: getQueryParam(query.itemName),
  });
}

export const auditBodySchema = z.object({
  binLocation: z.string().min(1).trim(),
  scannedBarcodes: z
    .array(barcode8)
    .max(10_000)
    .transform((arr) => arr.map((s) => s.trim())),
});

export type AuditBody = z.infer<typeof auditBodySchema>;

export const transferBodySchema = z.object({
  barcodes: z
    .array(barcode8)
    .max(10_000)
    .transform((arr) => arr.map((s) => s.trim())),
  newBinLocation: z.string().min(1).trim(),
});

export type TransferBody = z.infer<typeof transferBodySchema>;
