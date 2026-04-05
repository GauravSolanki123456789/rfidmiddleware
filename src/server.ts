import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./db/prisma.js";

const app = createApp();
const server = createServer(app);

async function shutdown(signal: string) {
  console.info(`${signal} received, shutting down…`);
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

server.listen(env.PORT, () => {
  console.info(`HTTP server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
