import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { binLocationToDbValue } from "../utils/binLocationDb.js";
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
    const [totalInStock, totalSold, binGroups] = await Promise.all([
      prisma.product.count({ where: { isSold: false } }),
      prisma.product.count({ where: { isSold: true } }),
      prisma.product.groupBy({
        by: ["binLocation"],
      }),
    ]);
    const totalItems = totalInStock + totalSold;
    const totalMissing = 0;
    const distinctBinCount = binGroups.length;

    res.json({
      success: true,
      data: {
        totalItems,
        totalInStock,
        totalMissing,
        totalSold,
        distinctBinCount,
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
        isSold: false,
        ...(query.binLocation !== undefined
          ? { binLocation: binLocationToDbValue(query.binLocation) }
          : {}),
        ...(query.styleCode !== undefined
          ? {
              styleCode: {
                contains: query.styleCode,
                mode: "insensitive",
              },
            }
          : {}),
        ...(query.sku !== undefined
          ? {
              sku: {
                equals: query.sku,
                mode: "insensitive",
              },
            }
          : {}),
        ...(query.itemName !== undefined
          ? {
              itemName: {
                contains: query.itemName,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: [{ sku: "asc" }, { barcode: "asc" }],
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

    const dbBin = binLocationToDbValue(body.binLocation);

    const expected = await prisma.product.findMany({
      where: {
        binLocation: dbBin,
        isSold: false,
      },
    });

    const expectedBarcodeSet = new Set(expected.map((p) => p.barcode));
    const scannedSet = new Set(body.scannedBarcodes);

    const foundItems = expected.filter((p) => scannedSet.has(p.barcode));
    const missingItems = expected.filter((p) => !scannedSet.has(p.barcode));

    const unknownItems: string[] = [];
    const seenUnknown = new Set<string>();
    for (const barcode of body.scannedBarcodes) {
      if (expectedBarcodeSet.has(barcode)) continue;
      if (seenUnknown.has(barcode)) continue;
      seenUnknown.add(barcode);
      unknownItems.push(barcode);
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

    if (body.barcodes.length === 0) {
      res.json({ success: true, data: { updatedCount: 0 } });
      return;
    }

    const result = await prisma.product.updateMany({
      where: { barcode: { in: body.barcodes } },
      data: { binLocation: binLocationToDbValue(body.newBinLocation) },
    });

    res.json({
      success: true,
      data: { updatedCount: result.count },
    });
  }),
);
