// BR-002: cửa sổ cố định theo khóa. Hàm quyết định thuần để unit test.

export type Bucket = { count: number; resetAt: Date };

export const TRIAL_LIMIT = { max: 5, windowMs: 10 * 60_000 };

/** BR-009: đăng nhập tối đa 20 lần/10 phút/IP (ngoài khóa theo tài khoản BR-005). */
export const LOGIN_LIMIT = { max: 20, windowMs: 10 * 60_000 };

/** Trạng thái bucket sau một lần gọi và lần gọi này có được phép không. */
export function consume(bucket: Bucket | null, now: Date, limit = TRIAL_LIMIT): { allowed: boolean; next: Bucket } {
  if (!bucket || bucket.resetAt.getTime() <= now.getTime()) {
    return { allowed: true, next: { count: 1, resetAt: new Date(now.getTime() + limit.windowMs) } };
  }
  const count = bucket.count + 1;
  return { allowed: count <= limit.max, next: { count, resetAt: bucket.resetAt } };
}
