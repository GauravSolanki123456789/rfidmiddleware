import { ProductStatus } from "@prisma/client";
import { Router } from "express";
import { AppError } from "../errors/AppError.js";
import { HttpStatus } from "../errors/httpStatus.js";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { serializeProduct } from "../utils/productSerialization.js";
import {
  auditBodySchema,
  parseMasterListQuery,
  transferBodySchema,
} from "../validation/inventory.schemas.js";

export const inventoryRouter = Router();

inventoryRouter.get(
  "/inventory/summary",
  asyncHandler(async (_req, res) => {
    const [totalInStock, totalMissing, totalSold] = await Promise.all([
      prisma.product.count({ where: { status: ProductStatus.IN_STOCK } }),
      prisma.product.count({ where: { status: ProductStatus.MISSING } }),
      prisma.product.count({ where: { status: ProductStatus.SOLD } }),
    ]);
    const totalItems = totalInStock + totalMissing + totalSold;

    res.json({
      success: true,
      data: {
        totalItems,
        totalInStock,
        totalMissing,
        totalSold,
      },
    });
  }),
);

inventoryRouter.get(
  "/inventory/master-list",
  asyncHandler(async (req, res) => {
    const query = parseMasterListQuery(req.query);

    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.IN_STOCK,
        ...(query.locationId !== undefined ? { locationId: query.locationId } : {}),
        ...(query.designName !== undefined
          ? {
              designName: {
                contains: query.designName,
                mode: "insensitive",
              },
            }
          : {}),
        ...(query.skuCode !== undefined
          ? {
              skuCode: {
                equals: query.skuCode,
                mode: "insensitive",
              },
            }
          : {}),
      },
      include: { location: true },
      orderBy: [{ skuCode: "asc" }, { epcTagId: "asc" }],
    });

    res.json({
      success: true,
      data: {
        items: products.map(serializeProduct),
      },
    });
  }),
);

inventoryRouter.post(
  "/inventory/audit",
  asyncHandler(async (req, res) => {
    const body = auditBodySchema.parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id: body.locationId },
    });
    if (!location) {
      throw new AppError("Location not found", HttpStatus.NOT_FOUND);
    }

    const expected = await prisma.product.findMany({
      where: {
        locationId: body.locationId,
        status: ProductStatus.IN_STOCK,
      },
      include: { location: true },
    });

    const expectedEpcSet = new Set(expected.map((p) => p.epcTagId));
    const scannedSet = new Set(body.scannedEpcs);

    const foundItems = expected.filter((p) => scannedSet.has(p.epcTagId));
    const missingItems = expected.filter((p) => !scannedSet.has(p.epcTagId));

    const unknownItems: string[] = [];
    const seenUnknown = new Set<string>();
    for (const epc of body.scannedEpcs) {
      if (expectedEpcSet.has(epc)) continue;
      if (seenUnknown.has(epc)) continue;
      seenUnknown.add(epc);
      unknownItems.push(epc);
    }

    res.json({
      success: true,
      data: {
        found_items: foundItems.map(serializeProduct),
        missing_items: missingItems.map(serializeProduct),
        unknown_items: unknownItems,
      },
    });
  }),
);

inventoryRouter.put(
  "/inventory/transfer",
  asyncHandler(async (req, res) => {
    const body = transferBodySchema.parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id: body.newLocationId },
    });
    if (!location) {
      throw new AppError("Location not found", HttpStatus.NOT_FOUND);
    }

    if (body.epcTagIds.length === 0) {
      res.json({ success: true, data: { updatedCount: 0 } });
      return;
    }

    const result = await prisma.product.updateMany({
      where: { epcTagId: { in: body.epcTagIds } },
      data: { locationId: body.newLocationId },
    });

    res.json({
      success: true,
      data: { updatedCount: result.count },
    });
  }),
);
