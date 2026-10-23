// Nhật ký buổi học (FEAT-B2, DECISION-D32): nội dung đã học + bài tập về nhà của từng buổi.
import { canTeacherAccessClass, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { notifyUsers } from "@/server/notifications/service";
import { formatDate } from "@/lib/time";

export type LessonLogInput = { lessonContent: string | null; homework: string | null };

/**
 * GV phụ trách lớp, GV dạy thay buổi đó, hoặc quản lý ghi nhật ký. Buổi đã hủy không ghi được.
 * Lần ghi đầu tiên → báo HS đang học/bảo lưu và PH của các em (kèm thông báo đẩy); sửa sau đó không báo lại.
 */
export async function saveLessonLog(actor: Actor, sessionId: string, input: LessonLogInput): Promise<string> {
  const s = await db.classSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, startsAt: true, teacherId: true, lessonLoggedAt: true, classId: true, class: { select: { code: true, teacherId: true } } },
  });
  if (!s) throw new ForbiddenError();
  const allowed = isManager(actor) || (actor.role === "TEACHER" && canTeacherAccessClass(actor.id, { teacherId: s.class.teacherId, sessionTeacherIds: [s.teacherId] }));
  if (!allowed) throw new ForbiddenError();
  if (s.status === "CANCELLED") throw new DomainError("SESSION_CANCELLED", "Buổi học đã hủy, không ghi nhật ký được.");
  if (!input.lessonContent && !input.homework) throw new DomainError("EMPTY", "Nhập nội dung buổi học hoặc bài tập về nhà.", { lessonContent: "Nhập nội dung." });

  const first = s.lessonLoggedAt === null;
  await db.$transaction(async (tx) => {
    await tx.classSession.update({ where: { id: sessionId }, data: { ...input, ...(first ? { lessonLoggedAt: new Date() } : {}) } });
    if (!first) return;
    const enrollments = await tx.enrollment.findMany({
      where: { classId: s.classId, status: { in: ["ACTIVE", "PAUSED"] }, student: { status: "ACTIVE" } },
      select: { studentId: true, student: { select: { parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
    });
    const title = `Nhật ký buổi học ${s.class.code} · ${formatDate(s.startsAt)}`;
    const body = [input.lessonContent && `Nội dung: ${input.lessonContent}`, input.homework && `Bài về nhà: ${input.homework}`].filter(Boolean).join("\n");
    await notifyUsers(tx, enrollments.map((e) => e.studentId), { kind: "lesson", title, body, link: `/hoc-sinh/buoi/${sessionId}` });
    // Liên kết mở đúng trang của con; PH có 2 con cùng lớp chỉ nhận một thông báo.
    const childOf = new Map<string, string>();
    for (const e of enrollments) for (const l of e.student.parentLinks) if (!childOf.has(l.parentId)) childOf.set(l.parentId, e.studentId);
    for (const [parentId, studentId] of childOf) {
      await notifyUsers(tx, [parentId], { kind: "lesson", title, body, link: `/phu-huynh/buoi/${sessionId}?con=${studentId}` });
    }
  });
  return s.classId;
}
