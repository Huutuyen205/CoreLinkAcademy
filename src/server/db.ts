import { PrismaClient } from "@prisma/client";

// Một PrismaClient cho cả tiến trình; tránh tạo lại khi hot-reload ở dev (không tạo thêm pool, không đăng ký lại listener).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Ngưỡng cảnh báo query chậm (ms), đo thời gian thực thi phía DB. `DB_LOG_QUERIES=1` in mọi query kèm thời gian. */
const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS ?? 300);
const LOG_ALL = process.env.DB_LOG_QUERIES === "1";

function createClient(): PrismaClient {
  const client = new PrismaClient({ log: [{ emit: "event", level: "query" }, "error", "warn"] });
  client.$on("query", (e) => {
    if (LOG_ALL || e.duration >= SLOW_QUERY_MS) {
      console.warn(`[db] ${e.duration >= SLOW_QUERY_MS ? "CHẬM " : ""}${e.duration}ms ${e.query.replace(/\s+/g, " ").slice(0, 240)}`);
    }
  });
  return client;
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
