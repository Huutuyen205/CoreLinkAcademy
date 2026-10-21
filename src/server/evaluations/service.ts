// Đánh giá định kỳ (Giáo viên §9, Phụ huynh §5 — FR-049). Nháp chỉ giáo viên viết thấy; bản đã gửi hiện cho HS/PH/quản lý.
import type { Prisma } from "@prisma/client";
import { assertCanViewStudent, assertTeacherOwnsClass } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { notifyUsers } from "@/server/notifications/service";

export type EvaluationInput = { classId: string; studentId: string; period: string; content: string; strengths: string | null; improvements: string | null };

/** Bảng đánh giá của một lớp cho giáo viên phụ trách: mọi học sinh đang/đã học + đánh giá theo kỳ. */
export async function listClassEvaluations(actor: Actor, classId: string) {
  await assertTeacherOwnsClass(actor, classId);
  const [enrollments, evaluations] = await Promise.all([
    db.enrollment.findMany({
      where: { classId, status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } },
      orderBy: { student: { fullName: "asc" } },
      select: { student: { select: { id: true, fullName: true, studentCode: true } } },
    }),
    db.evaluation.findMany({ where: { classId }, orderBy: [{ createdAt: "desc" }] }),
  ]);
  return enrollments.map((e) => ({ student: e.student, evaluations: evaluations.filter((ev) => ev.studentId === e.student.id) }));
}

/** Tạo hoặc sửa bản nháp (duy nhất theo lớp + học sinh + kỳ). Bản đã gửi không sửa được. */
export async function saveEvaluation(actor: Actor, input: EvaluationInput): Promise<void> {
  await assertTeacherOwnsClass(actor, input.classId);
  const enrolled = await db.enrollment.findUnique({ where: { classId_studentId: { classId: input.classId, studentId: input.studentId } }, select: { id: true } });
  if (!enrolled) throw new ForbiddenError();
  const existing = await db.evaluation.findUnique({
    where: { classId_studentId_period: { classId: input.classId, studentId: input.studentId, period: input.period } },
    select: { id: true, status: true },
  });
  if (existing?.status === "SENT") throw new DomainError("ALREADY_SENT", "Đánh giá kỳ này đã gửi nên không sửa được.", { period: "Kỳ này đã gửi." });
  const data = { content: input.content, strengths: input.strengths, improvements: input.improvements };
  if (existing) await db.evaluation.update({ where: { id: existing.id }, data });
  else await db.evaluation.create({ data: { ...input, teacherId: actor.id } });
}

async function ownedDraft(actor: Actor, evaluationId: string) {
  const ev = await db.evaluation.findUnique({ where: { id: evaluationId }, select: { id: true, status: true, classId: true, studentId: true, period: true, class: { select: { teacherId: true, code: true } } } });
  if (!ev || actor.role !== "TEACHER" || ev.class.teacherId !== actor.id) throw new ForbiddenError();
  if (ev.status !== "DRAFT") throw new DomainError("ALREADY_SENT", "Đánh giá đã gửi.");
  return ev;
}

/** Gửi đánh giá tới học sinh và phụ huynh (thông báo). */
export async function sendEvaluation(actor: Actor, evaluationId: string): Promise<string> {
  const ev = await ownedDraft(actor, evaluationId);
  const parents = await db.guardianship.findMany({ where: { studentId: ev.studentId }, select: { parentId: true } });
  await db.$transaction(async (tx) => {
    const { count } = await tx.evaluation.updateMany({ where: { id: evaluationId, status: "DRAFT" }, data: { status: "SENT", sentAt: new Date() } });
    if (count === 0) throw new DomainError("ALREADY_SENT", "Đánh giá đã gửi.");
    await notifyUsers(tx, [ev.studentId], { kind: "evaluation", title: `Đánh giá ${ev.period} — lớp ${ev.class.code}`, body: "Giáo viên đã gửi đánh giá định kỳ.", link: "/hoc-sinh/ket-qua" });
    await notifyUsers(tx, parents.map((p) => p.parentId), { kind: "evaluation", title: `Đánh giá ${ev.period} — lớp ${ev.class.code}`, body: "Giáo viên đã gửi đánh giá định kỳ của con.", link: "/phu-huynh" });
  });
  return ev.classId;
}

export async function deleteEvaluation(actor: Actor, evaluationId: string): Promise<string> {
  const ev = await ownedDraft(actor, evaluationId);
  await db.evaluation.delete({ where: { id: evaluationId } });
  return ev.classId;
}

/** Lịch sử đánh giá của một học sinh. HS/PH/quản lý: chỉ bản đã gửi; GV: bản của mình (kể cả nháp). */
export async function listEvaluationsOfStudent(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  const where: Prisma.EvaluationWhereInput = actor.role === "TEACHER" ? { studentId, teacherId: actor.id } : { studentId, status: "SENT" };
  return db.evaluation.findMany({
    where,
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      period: true,
      content: true,
      strengths: true,
      improvements: true,
      status: true,
      sentAt: true,
      class: { select: { code: true, course: { select: { title: true } } } },
      teacher: { select: { fullName: true } },
    },
  });
}

/**
 * Tổng hợp kết quả học tập theo lớp (GV §9 "Xem tổng hợp kết quả học tập"): tỷ lệ chuyên cần (BR-032)
 * và điểm trung bình (%) các bài đã chấm của từng học sinh — căn cứ viết đánh giá.
 */
export async function classLearningSummary(actor: Actor, classId: string) {
  await assertTeacherOwnsClass(actor, classId);
  const [attendances, submissions] = await Promise.all([
    db.attendance.findMany({ where: { session: { classId, status: { not: "CANCELLED" } } }, select: { studentId: true, status: true } }),
    db.submission.findMany({
      where: { assignment: { classId }, status: "GRADED" },
      select: { studentId: true, score: true, assignment: { select: { manualMaxScore: true, questions: { select: { points: true } } } } },
    }),
  ]);
  const out = new Map<string, { attended: number; marked: number; scorePctSum: number; graded: number }>();
  const row = (id: string) => out.get(id) ?? out.set(id, { attended: 0, marked: 0, scorePctSum: 0, graded: 0 }).get(id)!;
  for (const a of attendances) {
    const r = row(a.studentId);
    r.marked++;
    if (a.status === "PRESENT" || a.status === "LATE") r.attended++;
  }
  for (const s of submissions) {
    const max = s.assignment.questions.length ? s.assignment.questions.reduce((t, q) => t + q.points, 0) : (s.assignment.manualMaxScore ?? 0);
    if (max <= 0 || s.score === null) continue;
    const r = row(s.studentId);
    r.graded++;
    r.scorePctSum += (s.score / max) * 100;
  }
  return new Map(
    [...out.entries()].map(([id, r]) => [
      id,
      { attendanceRate: r.marked ? Math.round((r.attended / r.marked) * 100) : null, marked: r.marked, averagePct: r.graded ? Math.round(r.scorePctSum / r.graded) : null, graded: r.graded },
    ]),
  );
}
