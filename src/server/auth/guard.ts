// Cổng kiểm tra phiên + vai trò cho layout, trang và Server Action nội bộ.
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { HOME_BY_ROLE } from "./policy";
import { getCurrentActor, type Actor } from "./session";

/** Bắt buộc đăng nhập. Mặc định chuyển về trang đổi mật khẩu khi còn mật khẩu tạm (FR-012). */
export async function requireActor(options: { allowPasswordChange?: boolean } = {}): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) redirect("/dang-nhap");
  if (actor.mustChangePassword && !options.allowPasswordChange) redirect("/doi-mat-khau");
  return actor;
}

/** Bắt buộc đúng vai trò; sai vai trò → về tổng quan của mình (docs/03 §3). */
export async function requireRole(...roles: Role[]): Promise<Actor> {
  const actor = await requireActor();
  if (!roles.includes(actor.role)) redirect(HOME_BY_ROLE[actor.role]);
  return actor;
}
