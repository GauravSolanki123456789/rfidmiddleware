import type { Express } from "express";
import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { inventoryRouter } from "./inventory.routes.js";

const apiRouter = Router();
apiRouter.use(healthRouter);
apiRouter.use(inventoryRouter);

export function registerRoutes(app: Express) {
  app.use("/api", apiRouter);
}
