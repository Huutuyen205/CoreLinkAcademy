// Phân quyền theo vai trò (docs/03 §2). Hàm thuần, không truy cập DB.
// Phạm vi dữ liệu (lớp của GV, con của PH…) được kiểm tra trong service từng nghiệp vụ.
import type { Role } from "@prisma/client";
import { ForbiddenError } from "@/server/errors";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Giáo vụ / Tư vấn",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
  PARENT: "Phụ huynh",
};

export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/quan-ly",
  STAFF: "/quan-ly",
  TEACHER: "/giao-vien",
  STUDENT: "/hoc-sinh",
  PARENT: "/phu-huynh",
};

const PERMISSIONS = {
  "catalog.manage": ["ADMIN"],
  "room.manage": ["ADMIN"],
  "lead.manage": ["ADMIN", "STAFF"],
  "user.manage": ["ADMIN"],
  "user.createLearner": ["ADMIN", "STAFF"],
  "guardian.manage": ["ADMIN", "STAFF"],
  "class.manage": ["ADMIN", "STAFF"],
  "enrollment.manage": ["ADMIN", "STAFF"],
  "attendance.override": ["ADMIN", "STAFF"],
  "assignment.author": ["TEACHER"],
  "submission.work": ["STUDENT"],
  "audit.read": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function assertCan(actor: { role: Role }, permission: Permission): void {
  if (!can(actor.role, permission)) throw new ForbiddenError();
}

/** STAFF chỉ được tạo tài khoản học sinh/phụ huynh (ASSUMPTION-A04). */
export function canCreateUserWithRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "ADMIN") return true;
  return actorRole === "STAFF" && (targetRole === "STUDENT" || targetRole === "PARENT");
}

/** Admin không tự khóa hoặc tự đổi vai trò của chính mình (T-10). */
export function canChangeRoleOrStatus(actor: { id: string; role: Role }, targetUserId: string): boolean {
  return actor.role === "ADMIN" && actor.id !== targetUserId;
}
