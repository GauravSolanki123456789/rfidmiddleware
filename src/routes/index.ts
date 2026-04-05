import type { Express } from "express";
import { Router } from "express";
import { healthRouter } from "./health.routes.js";

const apiRouter = Router();
apiRouter.use(healthRouter);

export function registerRoutes(app: Express) {
  app.use("/api", apiRouter);
}
