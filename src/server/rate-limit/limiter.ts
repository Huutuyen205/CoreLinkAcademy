import { db, type Tx } from "@/server/db";
import { TRIAL_LIMIT } from "./rules";

/**
 * Ghi nhận một lần gọi cho `key`; trả false khi vượt giới hạn (BR-002, BR-009).
 * Cùng quy tắc với `consume()` (rules.ts, có unit test) nhưng chạy trong MỘT câu `INSERT … ON CONFLICT` nguyên tử:
 * trước đây BEGIN + SELECT FOR UPDATE + upsert + COMMIT = 4 round-trip cho mỗi lần đăng nhập/gửi form.
 * ON CONFLICT khóa dòng nên hai request đồng thời không đếm thiếu, và không còn lỗi trùng khóa khi tạo bucket.
 */
export async function hitRateLimit(
  key: string,
  limit: { max: number; windowMs: number } = TRIAL_LIMIT,
  client: Tx = db,
  now = new Date(),
): Promise<boolean> {
  const resetAt = new Date(now.getTime() + limit.windowMs);
  const rows = await client.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
      "resetAt" = CASE WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN ${resetAt} ELSE "rate_limit_buckets"."resetAt" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? 1) <= limit.max;
}

/** Xóa bucket đã hết hạn quá 1 ngày (bảng không phình theo số IP). Gọi kèm, không chặn luồng chính. */
export async function pruneRateLimitBuckets(now = new Date()): Promise<void> {
  await db.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 24 * 3_600_000) } } });
}
