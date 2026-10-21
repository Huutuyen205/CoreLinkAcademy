import { assertCan } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";

export const AUDIT_PAGE_SIZE = 50;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "lead.convert": "Chuyển lead thành học viên",
  "user.create": "Tạo tài khoản",
  "user.role_change": "Đổi vai trò",
  "user.disable": "Khóa tài khoản",
  "user.enable": "Mở khóa tài khoản",
  "user.reset_password": "Đặt lại mật khẩu",
  "attendance.override": "Sửa điểm danh ngoài khung",
  "grade.update_after_publish": "Sửa điểm sau công bố",
  "session.reschedule": "Dời buổi học",
  "session.cancel": "Hủy buổi học",
};

/** FR-035: chỉ ADMIN xem; không có thao tác xóa. */
export async function listAuditLogs(actor: Actor, filter: { action?: string; page: number }) {
  assertCan(actor, "audit.read");
  const where = filter.action ? { action: filter.action } : {};
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { fullName: true } } },
    }),
  ]);
  return { total, rows };
}
