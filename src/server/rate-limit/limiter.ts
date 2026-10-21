import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/users/credentials";
import { consume, TRIAL_LIMIT } from "./rules";

async function hitOnce(key: string, limit: { max: number; windowMs: number }): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ count: number; resetAt: Date }[]>`
      SELECT count, resetAt FROM rate_limit_buckets WHERE \`key\` = ${key} FOR UPDATE`;
    const current = rows[0] ? { count: Number(rows[0].count), resetAt: new Date(rows[0].resetAt) } : null;
    const { allowed, next } = consume(current, new Date(), limit);
    await tx.rateLimitBucket.upsert({ where: { key }, update: next, create: { key, ...next } });
    return allowed;
  });
}

/** Ghi nhận một lần gọi cho `key`; trả false khi vượt giới hạn (BR-002, BR-009). */
export async function hitRateLimit(key: string, limit: { max: number; windowMs: number } = TRIAL_LIMIT): Promise<boolean> {
  try {
    return await hitOnce(key, limit);
  } catch (error) {
    // Hai request đầu tiên cùng tạo bucket: request thua chạy lại và đọc được dòng đã có.
    if (isUniqueViolation(error)) return hitOnce(key, limit);
    throw error;
  }
}
