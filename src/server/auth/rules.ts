// Logic thuần của xác thực (không truy cập DB) để unit test được.

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const SESSION_DAYS = 7;

/** BR-006: tối thiểu 8 ký tự, có chữ và số. Trả về thông báo lỗi hoặc null. */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
  if (password.length > 128) return "Mật khẩu tối đa 128 ký tự.";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}

export function isLocked(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

/** BR-005: trạng thái mới sau một lần sai mật khẩu. Lần sai thứ 5 khóa 15 phút và đặt lại bộ đếm. */
export function afterFailedLogin(failedLoginCount: number, now: Date): { failedLoginCount: number; lockedUntil: Date | null } {
  const count = failedLoginCount + 1;
  if (count >= MAX_FAILED_LOGINS) {
    return { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedLoginCount: count, lockedUntil: null };
}

/** Đăng nhập bằng email hoặc SĐT: email viết thường, còn lại coi là SĐT. */
export function parseIdentifier(raw: string): { kind: "email"; value: string } | { kind: "phone"; raw: string } {
  const value = raw.trim();
  return value.includes("@") ? { kind: "email", value: value.toLowerCase() } : { kind: "phone", raw: value };
}
