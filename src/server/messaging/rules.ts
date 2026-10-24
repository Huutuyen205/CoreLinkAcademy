// Quy tắc nhắn riêng 1-1 (FR-050, DECISION-D30): hàm thuần, không truy cập DB.
import type { Role } from "@prisma/client";

type Person = { id: string; role: Role };

const isManagerRole = (role: Role) => role === "ADMIN";

/**
 * Cần kiểm tra gì để hai người được nhắn riêng:
 * - "always": một bên là trung tâm (Admin) — ai cũng liên hệ được trung tâm.
 * - "guardian": học sinh ↔ phụ huynh — chỉ khi là phụ huynh của chính em (không nhắn riêng với phụ huynh nhà khác).
 * - "shared-class": còn lại (HS ↔ HS, HS ↔ GV, GV ↔ PH, PH ↔ PH, GV ↔ GV) — phải cùng một lớp đang học.
 * - "never": tự nhắn cho mình.
 */
export function directMessageRequirement(actor: Person, target: Person): "always" | "guardian" | "shared-class" | "never" {
  if (actor.id === target.id) return "never";
  if (isManagerRole(actor.role) || isManagerRole(target.role)) return "always";
  const roles = new Set([actor.role, target.role]);
  if (roles.has("STUDENT") && roles.has("PARENT")) return "guardian";
  return "shared-class";
}

/** Trong cùng một lớp (đã biết chung lớp): người này có được nhắn riêng thành viên kia không. */
export function canDirectMessageClassmate(actor: Person, target: Person, isOwnGuardianPair: boolean): boolean {
  const need = directMessageRequirement(actor, target);
  if (need === "never") return false;
  if (need === "guardian") return isOwnGuardianPair;
  return true;
}
