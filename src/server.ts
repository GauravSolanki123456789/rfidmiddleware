import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./db/prisma.js";

const LISTEN_HOST = "0.0.0.0";

/** Non-loopback IPv4 addresses (typical LAN / Wi‑Fi for phones on the same network). */
function getLanIPv4Addresses(): string[] {
  const out: string[] = [];
  const nets = networkInterfaces();
  for (const addrs of Object.values(nets)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      const fam = addr.family as string | number;
      const isV4 = fam === "IPv4" || fam === 4;
      if (isV4 && !addr.internal) {
        out.push(addr.address);
      }
    }
  }
  return out;
}

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

server.listen(env.PORT, LISTEN_HOST, () => {
  const ips = getLanIPv4Addresses();
  console.info(
    `HTTP server listening on ${LISTEN_HOST}:${env.PORT} (${env.NODE_ENV})`,
  );
  if (ips.length > 0) {
    console.info(`  LAN / Wi‑Fi: http://${ips[0]}:${env.PORT}`);
    if (ips.length > 1) {
      for (const ip of ips.slice(1)) {
        console.info(`  Also: http://${ip}:${env.PORT}`);
      }
    }
    console.info(`  Status page: http://${ips[0]}:${env.PORT}/status`);
  } else {
    console.info(
      `  No non-loopback IPv4 found — on this machine use http://127.0.0.1:${env.PORT}`,
    );
    console.info(`  Status page: http://127.0.0.1:${env.PORT}/status`);
  }
});
