// Chi tiết một buổi học cho học sinh / phụ huynh (HS "Xem chi tiết buổi học", PH §2 — FR-039).
import { assertCanViewStudent } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { documentVisibilityWhere } from "@/server/documents/access";
import { ForbiddenError } from "@/server/errors";
import { fileMeta } from "@/server/files/storage";

export async function getSessionForLearner(actor: Actor, sessionId: string, studentId: string) {
  if (actor.role !== "STUDENT" && actor.role !== "PARENT") throw new ForbiddenError();
  if (actor.role === "STUDENT" && studentId !== actor.id) throw new ForbiddenError();
  await assertCanViewStudent(actor, studentId);
  const s = await db.classSession.findFirst({
    where: { id: sessionId, class: { enrollments: { some: { studentId, status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } } } } },
    select: {
      id: true,
      index: true,
      startsAt: true,
      endsAt: true,
      status: true,
      cancelReason: true,
      isMakeup: true,
      note: true,
      lessonContent: true,
      homework: true,
      classId: true,
      teacherId: true,
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
      class: { select: { code: true, teacherId: true, course: { select: { title: true } } } },
      attendances: { where: { studentId }, select: { status: true, note: true } },
      leaveRequests: { where: { studentId }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, reason: true, responseNote: true, createdAt: true } },
    },
  });
  if (!s) throw new ForbiddenError();
  const documents = await db.document.findMany({
    where: { AND: [documentVisibilityWhere(actor), { OR: [{ shares: { some: { classId: s.classId } } }, { sessionId }] }] },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, kind: true, url: true, files: { select: fileMeta } },
  });
  return { ...s, attendance: s.attendances[0] ?? null, documents };
}

/** Lớp con đang học (Phụ huynh §1 "Xem thông tin lớp con đang học"; HS xem lớp của mình). */
export async function listStudentClasses(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  return db.enrollment.findMany({
    where: { studentId, status: { in: ["ACTIVE", "PAUSED"] } },
    orderBy: { enrolledAt: "asc" },
    select: {
      status: true,
      class: {
        select: {
          id: true,
          code: true,
          weekdays: true,
          startTime: true,
          endTime: true,
          startDate: true,
          course: { select: { title: true } },
          teacher: { select: { id: true, fullName: true } },
          room: { select: { name: true } },
        },
      },
    },
  });
}
