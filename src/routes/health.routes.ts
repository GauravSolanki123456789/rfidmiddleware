import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: "ok", database: "connected" } });
  }),
);
