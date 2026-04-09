import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";
import { registerStatusPage } from "./routes/statusPage.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.NODE_ENV === "development" ? true : undefined,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  registerStatusPage(app);
  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
