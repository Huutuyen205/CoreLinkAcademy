// Phạm vi dữ liệu (docs/03 §3). Sai phạm vi → ForbiddenError → trang 404.
import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import type { Actor } from "./session";

const MANAGERS: Role[] = ["ADMIN", "STAFF"];

export function isManager(actor: { role: Role }): boolean {
  return MANAGERS.includes(actor.role);
}

/** TC-035: giáo viên chỉ truy cập lớp mình dạy (hoặc có buổi được phân công dạy thay). */
export function canTeacherAccessClass(teacherId: string, klass: { teacherId: string; sessionTeacherIds?: string[] }): boolean {
  return klass.teacherId === teacherId || (klass.sessionTeacherIds ?? []).includes(teacherId);
}

/** TC-034: phụ huynh chỉ xem học sinh có liên kết. */
export function canParentViewStudent(linkedStudentIds: string[], studentId: string): boolean {
  return linkedStudentIds.includes(studentId);
}

/** Lớp mà actor được XEM: quản lý → mọi lớp; GV → lớp mình; HS → lớp có ghi danh; PH → lớp của con. */
export async function assertCanViewClass(actor: Actor, classId: string): Promise<void> {
  if (isManager(actor)) return;
  if (actor.role === "TEACHER") {
    const klass = await db.class.findUnique({
      where: { id: classId },
      select: { teacherId: true, sessions: { where: { teacherId: actor.id }, select: { teacherId: true }, take: 1 } },
    });
    if (klass && canTeacherAccessClass(actor.id, { teacherId: klass.teacherId, sessionTeacherIds: klass.sessions.map((s) => s.teacherId) })) return;
    throw new ForbiddenError();
  }
  if (actor.role === "STUDENT") {
    const e = await db.enrollment.findUnique({ where: { classId_studentId: { classId, studentId: actor.id } }, select: { id: true } });
    if (e) return;
    throw new ForbiddenError();
  }
  const childIds = await linkedStudentIds(actor.id);
  const e = await db.enrollment.findFirst({ where: { classId, studentId: { in: childIds } }, select: { id: true } });
  if (!e) throw new ForbiddenError();
}

/** GV chỉ thao tác trên lớp có `classes.teacherId = me` (soạn bài, xem bảng điểm). */
export async function assertTeacherOwnsClass(actor: Actor, classId: string): Promise<void> {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const klass = await db.class.findUnique({ where: { id: classId }, select: { teacherId: true } });
  if (!klass || klass.teacherId !== actor.id) throw new ForbiddenError();
}

export async function linkedStudentIds(parentId: string): Promise<string[]> {
  const links = await db.guardianship.findMany({ where: { parentId }, select: { studentId: true } });
  return links.map((l) => l.studentId);
}

/** Học sinh mà actor được xem dữ liệu học tập: chính mình, con của mình, hoặc mọi học sinh với quản lý. */
export async function assertCanViewStudent(actor: Actor, studentId: string): Promise<void> {
  if (isManager(actor)) return;
  if (actor.role === "STUDENT" && actor.id === studentId) return;
  if (actor.role === "PARENT" && canParentViewStudent(await linkedStudentIds(actor.id), studentId)) return;
  if (actor.role === "TEACHER") {
    const e = await db.enrollment.findFirst({ where: { studentId, class: { teacherId: actor.id } }, select: { id: true } });
    if (e) return;
  }
  throw new ForbiddenError();
}
