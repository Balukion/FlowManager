import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const SLOW_QUERY_THRESHOLD_MS = 50;

function createPrismaClient(): PrismaClient {
  if (process.env["NODE_ENV"] !== "production") {
    const client = new PrismaClient({
      log: [{ emit: "event", level: "query" }, "error", "warn"],
    });
    client.$on("query", (e) => {
      if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
        const sql =
          e.query.length > 120 ? `${e.query.slice(0, 120)}...` : e.query;
        console.warn(`[Prisma] Slow query (${e.duration}ms): ${sql}`);
      }
    });
    return client;
  }

  return new PrismaClient({ log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
