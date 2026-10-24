"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import type { ActionState } from "@/server/errors";
import { fieldErrorsOf } from "@/server/validation";
import { normalizePhone } from "@/lib/phone";
import { hitRateLimit, pruneRateLimitBuckets } from "@/server/rate-limit/limiter";
import { LOGIN_LIMIT } from "@/server/rate-limit/rules";
import { clientIp } from "@/server/request";
import { requireActor } from "./guard";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { HOME_BY_ROLE } from "./policy";
import { afterFailedLogin, checkPasswordStrength, isLocked, LOCK_MINUTES, parseIdentifier } from "./rules";
import { createSession, destroyCurrentSession, revokeUserSessions } from "./session";

const INVALID_CREDENTIALS = "Thông tin đăng nhập không đúng.";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Nhập email hoặc số điện thoại.").max(191),
  password: z.string().min(1, "Nhập mật khẩu.").max(128),
});

/** API-005 — FR-010, FR-011. Khi lỗi trả lại ô email/SĐT (D13), không bao giờ trả mật khẩu. */
export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const rawIdentifier = formData.get("identifier");
  const values = { identifier: typeof rawIdentifier === "string" ? rawIdentifier.slice(0, 191) : "" };
  if (!(await hitRateLimit(`login:${await clientIp()}`, LOGIN_LIMIT))) {
    return { ok: false, message: "Quá nhiều lần đăng nhập từ thiết bị này. Vui lòng thử lại sau 10 phút.", values };
  }
  return { ...(await attemptLogin(formData)), values };
}

/** Đúng thông tin → tạo phiên và `redirect` (ném, không trả về); sai → ActionState lỗi. */
async function attemptLogin(formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  const { identifier, password } = parsed.data;

  const id = parseIdentifier(identifier);
  const phone = id.kind === "phone" ? normalizePhone(id.raw) : null;
  const user =
    id.kind === "email"
      ? await db.user.findUnique({ where: { email: id.value } })
      : phone
        ? await db.user.findUnique({ where: { phone } })
        : null;

  if (!user) {
    await burnPasswordCheck(password);
    return { ok: false, message: INVALID_CREDENTIALS };
  }

  const now = new Date();
  if (isLocked(user.lockedUntil, now)) {
    return { ok: false, message: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${LOCK_MINUTES} phút.` };
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    const next = afterFailedLogin(user.failedLoginCount, now);
    await db.user.update({ where: { id: user.id }, data: next });
    if (next.lockedUntil) {
      return { ok: false, message: `Bạn đã nhập sai 5 lần. Tài khoản tạm khóa ${LOCK_MINUTES} phút.` };
    }
    return { ok: false, message: INVALID_CREDENTIALS };
  }

  if (user.status !== "ACTIVE") return { ok: false, message: "Tài khoản đã bị khóa. Vui lòng liên hệ học viện." };
  // DECISION-D35: vai trò giáo vụ đã bỏ — tài khoản giáo vụ cũ không đăng nhập được.
  if (user.role === "STAFF") return { ok: false, message: "Vai trò giáo vụ đã ngừng sử dụng. Vui lòng liên hệ quản trị viên." };

  // Song song: đặt lại bộ đếm sai (chỉ khi cần), tạo phiên, dọn bucket rate limit cũ.
  await Promise.all([
    user.failedLoginCount > 0 || user.lockedUntil
      ? db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } })
      : null,
    createSession(user.id),
    pruneRateLimitBuckets(now),
  ]);
  redirect(user.mustChangePassword ? "/doi-mat-khau" : HOME_BY_ROLE[user.role]);
}

/** API-006. */
export async function logout(): Promise<void> {
  await destroyCurrentSession();
  redirect("/dang-nhap");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại.").max(128),
    newPassword: z.string().max(128),
    confirm: z.string().max(128),
  })
  .superRefine((value, ctx) => {
    const weak = checkPasswordStrength(value.newPassword);
    if (weak) ctx.addIssue({ code: "custom", path: ["newPassword"], message: weak });
    if (value.newPassword !== value.confirm) {
      ctx.addIssue({ code: "custom", path: ["confirm"], message: "Mật khẩu nhập lại không khớp." });
    }
    if (value.newPassword === value.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }
  });

/** API-007 — FR-012. */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor({ allowPasswordChange: true });
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };

  const user = await db.user.findUniqueOrThrow({ where: { id: actor.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
    return { ok: false, fieldErrors: { currentPassword: "Mật khẩu hiện tại không đúng." } };
  }

  await db.user.update({
    where: { id: actor.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false },
  });
  await revokeUserSessions(actor.id, true);
  redirect(`${HOME_BY_ROLE[actor.role]}?thongbao=doi-mat-khau`);
}
