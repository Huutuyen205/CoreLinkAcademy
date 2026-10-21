// Bài tập và chấm điểm (UC-008..UC-010). Đáp án không bao giờ rời server trước khi công bố (T-06).
import { Prisma, type AssignmentStatus, type QuestionType } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCanViewStudent, assertTeacherOwnsClass } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import {
  autoGrade,
  checkAssignmentTransition,
  checkSubmit,
  checkTeacherPoints,
  jsonStrings,
  resultsVisible,
  round2,
  statusAfterSubmit,
  toStudentQuestion,
  totalScore,
  validateQuestion,
  type QuestionData,
} from "@/lib/grading";

function toQuestionData(q: {
  id: string;
  order: number;
  type: QuestionType;
  prompt: string;
  options: Prisma.JsonValue;
  correctOption: number | null;
  acceptedAnswers: Prisma.JsonValue;
  points: number;
}): QuestionData {
  return { ...q, options: jsonStrings(q.options), acceptedAnswers: jsonStrings(q.acceptedAnswers) };
}

/* ───────────── Giáo viên ───────────── */

async function ownedAssignment(actor: Actor, assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId }, include: { class: { select: { id: true, code: true, teacherId: true } } } });
  if (!a || actor.role !== "TEACHER" || a.class.teacherId !== actor.id) throw new ForbiddenError();
  return a;
}

export type AssignmentInput = { title: string; instructions: string; dueAt: Date; allowLate: boolean };

/** API-016 — FR-027. */
export async function createAssignment(actor: Actor, classId: string, input: AssignmentInput): Promise<string> {
  await assertTeacherOwnsClass(actor, classId);
  const a = await db.assignment.create({ data: { ...input, classId, createdById: actor.id } });
  return a.id;
}

export async function updateAssignment(actor: Actor, assignmentId: string, input: AssignmentInput): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status === "DRAFT" || input.dueAt.getTime() === a.dueAt.getTime() || input.dueAt > new Date()) {
    await db.assignment.update({ where: { id: assignmentId }, data: input });
    return;
  }
  throw new DomainError("DUE_IN_PAST", "Hạn nộp mới phải ở tương lai.", { dueAt: "Chọn thời điểm trong tương lai." });
}

export type QuestionInput = Omit<QuestionData, "id" | "order">;

/** API-016: thêm/sửa câu hỏi, chỉ khi DRAFT (FR-028). */
export async function saveQuestion(actor: Actor, assignmentId: string, questionId: string | null, input: QuestionInput): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status !== "DRAFT") throw new DomainError("NOT_DRAFT", "Chỉ sửa câu hỏi khi bài còn ở trạng thái nháp.");
  const errors = validateQuestion(input);
  if (errors) throw new DomainError("INVALID_QUESTION", "Câu hỏi chưa hợp lệ.", errors);

  const data = {
    type: input.type,
    prompt: input.prompt.trim(),
    points: input.points,
    options: input.type === "MCQ" ? (input.options ?? []).map((o) => o.trim()) : Prisma.DbNull,
    correctOption: input.type === "MCQ" ? input.correctOption : null,
    acceptedAnswers: input.type === "SHORT" ? (input.acceptedAnswers ?? []).map((a) => a.trim()).filter(Boolean) : Prisma.DbNull,
  };
  if (questionId) {
    const q = await db.question.findFirst({ where: { id: questionId, assignmentId }, select: { id: true } });
    if (!q) throw new ForbiddenError();
    await db.question.update({ where: { id: questionId }, data });
  } else {
    const count = await db.question.count({ where: { assignmentId } });
    await db.question.create({ data: { ...data, assignmentId, order: count + 1 } });
  }
}

export async function deleteQuestion(actor: Actor, assignmentId: string, questionId: string): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status !== "DRAFT") throw new DomainError("NOT_DRAFT", "Chỉ xóa câu hỏi khi bài còn ở trạng thái nháp.");
  await db.$transaction(async (tx) => {
    const { count } = await tx.question.deleteMany({ where: { id: questionId, assignmentId } });
    if (count === 0) throw new ForbiddenError();
    const rest = await tx.question.findMany({ where: { assignmentId }, orderBy: { order: "asc" }, select: { id: true } });
    for (const [i, q] of rest.entries()) await tx.question.update({ where: { id: q.id }, data: { order: i + 1 } });
  });
}

/** API-017 — FR-028. */
export async function setAssignmentStatus(actor: Actor, assignmentId: string, to: AssignmentStatus): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  const questionCount = await db.question.count({ where: { assignmentId } });
  const error = checkAssignmentTransition(a.status, to, { questionCount, dueAt: a.dueAt, now: new Date() });
  const messages = {
    INVALID_TRANSITION: "Không thể chuyển bài sang trạng thái này.",
    NO_QUESTIONS: "Bài cần ít nhất một câu hỏi trước khi giao.",
    DUE_IN_PAST: "Hạn nộp đã qua. Hãy sửa hạn nộp trước khi giao bài.",
  } as const;
  if (error) throw new DomainError(error, messages[error]);
  await db.assignment.update({ where: { id: assignmentId }, data: { status: to } });
}

/** API-020 — FR-032. */
export async function publishResults(actor: Actor, assignmentId: string): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status === "DRAFT") throw new DomainError("NOT_PUBLISHED", "Bài chưa được giao nên chưa thể công bố kết quả.");
  if (a.resultsPublishedAt) return;
  await db.assignment.update({ where: { id: assignmentId }, data: { resultsPublishedAt: new Date() } });
}

export async function getAssignmentForTeacher(actor: Actor, assignmentId: string) {
  await ownedAssignment(actor, assignmentId);
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      class: { select: { id: true, code: true, course: { select: { title: true } } } },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { submissions: { where: { status: { not: "IN_PROGRESS" } } } } },
    },
  });
  return { ...a, questions: a.questions.map(toQuestionData) };
}

export async function listClassAssignments(actor: Actor, classId: string) {
  await assertTeacherOwnsClass(actor, classId);
  return db.assignment.findMany({
    where: { classId },
    orderBy: { dueAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      resultsPublishedAt: true,
      _count: { select: { questions: true, submissions: { where: { status: "SUBMITTED" } } } },
    },
  });
}

/** Bài nộp của một bài tập, kèm học sinh đang học chưa nộp. */
export async function listSubmissions(actor: Actor, assignmentId: string) {
  const a = await ownedAssignment(actor, assignmentId);
  const [enrolled, submissions] = await Promise.all([
    db.enrollment.findMany({
      where: { classId: a.classId, status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } },
      orderBy: { student: { fullName: "asc" } },
      select: { student: { select: { id: true, fullName: true, studentCode: true } } },
    }),
    db.submission.findMany({ where: { assignmentId }, select: { id: true, studentId: true, status: true, submittedAt: true, isLate: true, score: true } }),
  ]);
  const byStudent = new Map(submissions.map((s) => [s.studentId, s]));
  return { assignment: a, rows: enrolled.map((e) => ({ student: e.student, submission: byStudent.get(e.student.id) ?? null })) };
}

export async function getSubmissionForGrading(actor: Actor, submissionId: string) {
  const s = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: { select: { fullName: true, studentCode: true } },
      assignment: { include: { class: { select: { id: true, code: true, teacherId: true } }, questions: { orderBy: { order: "asc" } } } },
      answers: true,
    },
  });
  if (!s || actor.role !== "TEACHER" || s.assignment.class.teacherId !== actor.id) throw new ForbiddenError();
  const answers = new Map(s.answers.map((a) => [a.questionId, a]));
  return {
    submission: s,
    items: s.assignment.questions.map((q) => ({ question: toQuestionData(q), answer: answers.get(q.id) ?? null })),
  };
}

/** API-019 — FR-031: chấm tự luận/sửa điểm câu tự chấm + nhận xét. Sửa sau công bố → audit (FR-033). */
export async function gradeSubmission(
  actor: Actor,
  submissionId: string,
  grades: { answerId: string; teacherPoints: number | null; feedback: string | null }[],
  comment: string | null,
): Promise<string> {
  const { submission, items } = await getSubmissionForGrading(actor, submissionId);
  if (submission.status === "IN_PROGRESS") throw new DomainError("NOT_SUBMITTED", "Học sinh chưa nộp bài.");
  const byAnswer = new Map(items.filter((i) => i.answer).map((i) => [i.answer!.id, i]));

  const fieldErrors: Record<string, string> = {};
  for (const g of grades) {
    const item = byAnswer.get(g.answerId);
    if (!item) throw new ForbiddenError();
    if (item.question.type === "ESSAY" && g.teacherPoints === null) fieldErrors[`points:${g.answerId}`] = "Nhập điểm câu tự luận.";
    if (g.teacherPoints !== null) {
      const err = checkTeacherPoints(g.teacherPoints, item.question.points);
      if (err) fieldErrors[`points:${g.answerId}`] = err;
    }
  }
  const essayIds = items.filter((i) => i.question.type === "ESSAY" && i.answer).map((i) => i.answer!.id);
  for (const id of essayIds) if (!grades.some((g) => g.answerId === id)) fieldErrors[`points:${id}`] = "Nhập điểm câu tự luận.";
  if (Object.keys(fieldErrors).length > 0) throw new DomainError("POINTS_OUT_OF_RANGE", "Vui lòng kiểm tra lại điểm.", fieldErrors);

  const before = { score: submission.score, answers: submission.answers.map((a) => ({ id: a.id, teacherPoints: a.teacherPoints })) };
  await db.$transaction(async (tx) => {
    for (const g of grades) {
      await tx.answer.update({ where: { id: g.answerId }, data: { teacherPoints: g.teacherPoints, feedback: g.feedback } });
    }
    const answers = await tx.answer.findMany({ where: { submissionId }, select: { autoPoints: true, teacherPoints: true } });
    const score = totalScore(answers);
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: "GRADED", score, teacherComment: comment, gradedAt: new Date(), gradedById: actor.id },
    });
    if (submission.assignment.resultsPublishedAt) {
      await writeAudit(
        {
          actorId: actor.id,
          action: "grade.update_after_publish",
          entity: "Submission",
          entityId: submissionId,
          detail: { before, after: { score, grades } } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );
    }
  });
  return submission.assignmentId;
}

/** FR-033: bảng điểm lớp cho giáo viên. */
export async function getGradebook(actor: Actor, classId: string) {
  await assertTeacherOwnsClass(actor, classId);
  const [assignments, enrollments] = await Promise.all([
    db.assignment.findMany({
      where: { classId, status: { not: "DRAFT" } },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true, resultsPublishedAt: true, questions: { select: { points: true } }, submissions: { select: { studentId: true, status: true, score: true } } },
    }),
    db.enrollment.findMany({ where: { classId }, orderBy: { student: { fullName: "asc" } }, select: { status: true, student: { select: { id: true, fullName: true } } } }),
  ]);
  return {
    assignments: assignments.map((a) => ({ id: a.id, title: a.title, published: Boolean(a.resultsPublishedAt), maxScore: round2(a.questions.reduce((s, q) => s + q.points, 0)) })),
    rows: enrollments.map((e) => ({
      student: e.student,
      enrollmentStatus: e.status,
      cells: assignments.map((a) => a.submissions.find((s) => s.studentId === e.student.id) ?? null),
    })),
  };
}

export async function countPendingGrading(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  return db.submission.findMany({
    where: { status: "SUBMITTED", assignment: { class: { teacherId: actor.id } } },
    orderBy: { submittedAt: "asc" },
    take: 20,
    select: { id: true, submittedAt: true, student: { select: { fullName: true } }, assignment: { select: { title: true, class: { select: { code: true } } } } },
  });
}

/* ───────────── Học sinh ───────────── */

async function activeEnrollment(studentId: string, classId: string) {
  const e = await db.enrollment.findUnique({ where: { classId_studentId: { classId, studentId } }, select: { status: true } });
  return e;
}

/** Bài được giao cho học sinh (PUBLISHED/CLOSED của lớp có ghi danh). */
export async function listMyAssignments(actor: Actor) {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  const rows = await db.assignment.findMany({
    where: { status: { in: ["PUBLISHED", "CLOSED"] }, class: { enrollments: { some: { studentId: actor.id } } } },
    orderBy: { dueAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      allowLate: true,
      resultsPublishedAt: true,
      class: { select: { code: true, course: { select: { title: true } }, enrollments: { where: { studentId: actor.id }, select: { status: true } } } },
      submissions: { where: { studentId: actor.id }, select: { status: true, score: true, isLate: true } },
    },
  });
  return rows.map(({ submissions, resultsPublishedAt, class: c, ...a }) => {
    const sub = submissions[0] ?? null;
    const visible = resultsVisible({ resultsPublishedAt });
    return {
      ...a,
      classCode: c.code,
      courseTitle: c.course.title,
      enrollmentStatus: c.enrollments[0]?.status ?? null,
      submissionStatus: sub?.status ?? null,
      isLate: sub?.isLate ?? false,
      resultsPublished: visible,
      // BR-046: điểm chỉ trả khi đã công bố.
      score: visible ? (sub?.score ?? null) : null,
    };
  });
}

/**
 * UC-009: mở bài để làm/xem. Tạo submission IN_PROGRESS khi được làm.
 * Chỉ trả đáp án đúng, điểm, nhận xét khi kết quả đã công bố.
 */
export async function openAssignmentForStudent(actor: Actor, assignmentId: string) {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: { select: { code: true, course: { select: { title: true } } } }, questions: { orderBy: { order: "asc" } } },
  });
  if (!a || a.status === "DRAFT") throw new ForbiddenError();
  const enrollment = await activeEnrollment(actor.id, a.classId);
  if (!enrollment) throw new ForbiddenError();

  let submission = await db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId: actor.id } }, include: { answers: true } });
  const now = new Date();
  const pastDueBlocked = now > a.dueAt && !a.allowLate;
  const canWork = enrollment.status === "ACTIVE" && a.status === "PUBLISHED" && (!submission || submission.status === "IN_PROGRESS") && !pastDueBlocked;
  if (!submission && canWork) {
    submission = await db.submission
      .create({ data: { assignmentId, studentId: actor.id }, include: { answers: true } })
      .catch(async () => db.submission.findUniqueOrThrow({ where: { assignmentId_studentId: { assignmentId, studentId: actor.id } }, include: { answers: true } }));
  }

  const visible = resultsVisible(a);
  const questions = a.questions.map(toQuestionData);
  const answers = new Map((submission?.answers ?? []).map((x) => [x.questionId, x]));
  return {
    assignment: { id: a.id, title: a.title, instructions: a.instructions, dueAt: a.dueAt, allowLate: a.allowLate, status: a.status, classCode: a.class.code, courseTitle: a.class.course.title },
    submission: submission
      ? { status: submission.status, submittedAt: submission.submittedAt, isLate: submission.isLate, score: visible ? submission.score : null, teacherComment: visible ? submission.teacherComment : null }
      : null,
    canWork,
    pastDueBlocked,
    resultsPublished: visible,
    items: questions.map((q) => {
      const ans = answers.get(q.id);
      return {
        question: toStudentQuestion(q),
        response: ans?.response ?? null,
        result: visible
          ? {
              points: ans ? (ans.teacherPoints ?? ans.autoPoints ?? 0) : 0,
              feedback: ans?.feedback ?? null,
              correctOption: q.correctOption,
              acceptedAnswers: q.acceptedAnswers,
            }
          : null,
      };
    }),
  };
}

async function workableSubmission(actor: Actor, assignmentId: string) {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  const a = await db.assignment.findUnique({ where: { id: assignmentId }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!a || a.status === "DRAFT") throw new ForbiddenError();
  const enrollment = await activeEnrollment(actor.id, a.classId);
  if (!enrollment) throw new ForbiddenError();
  if (enrollment.status !== "ACTIVE") throw new DomainError("NOT_ACTIVE", "Bạn không còn đang học lớp này nên không làm bài được.");
  if (a.status !== "PUBLISHED") throw new DomainError("CLOSED", "Bài đã đóng.");
  const submission = await db.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: actor.id } },
    update: {},
    create: { assignmentId, studentId: actor.id },
  });
  return { assignment: a, submission };
}

function cleanResponses(questions: { id: string; type: QuestionType; options: Prisma.JsonValue }[], raw: Record<string, string>) {
  const out: { questionId: string; response: string | null }[] = [];
  for (const q of questions) {
    let value = (raw[q.id] ?? "").slice(0, q.type === "ESSAY" ? 20_000 : 500).trim();
    if (q.type === "MCQ" && value !== "") {
      const n = Number(value);
      const count = jsonStrings(q.options)?.length ?? 0;
      if (!Number.isInteger(n) || n < 0 || n >= count) value = "";
    }
    out.push({ questionId: q.id, response: value || null });
  }
  return out;
}

/** API-018: lưu nháp. */
export async function saveDraftAnswers(actor: Actor, assignmentId: string, raw: Record<string, string>): Promise<void> {
  const { assignment, submission } = await workableSubmission(actor, assignmentId);
  const check = checkSubmit({ submissionStatus: submission.status, dueAt: assignment.dueAt, allowLate: assignment.allowLate, now: new Date() });
  if (check.error === "ALREADY_SUBMITTED") throw new DomainError(check.error, "Bạn đã nộp bài này.");
  if (check.error === "PAST_DUE") throw new DomainError(check.error, "Đã quá hạn nộp.");
  await db.$transaction(async (tx) => {
    for (const r of cleanResponses(assignment.questions, raw)) {
      await tx.answer.upsert({
        where: { submissionId_questionId: { submissionId: submission.id, questionId: r.questionId } },
        update: { response: r.response },
        create: { submissionId: submission.id, questionId: r.questionId, response: r.response },
      });
    }
  });
}

/** API-018 — FR-029, FR-030: nộp đúng một lần, tự chấm câu khách quan. */
export async function submitAssignment(actor: Actor, assignmentId: string, raw: Record<string, string>): Promise<{ graded: boolean; isLate: boolean }> {
  const { assignment, submission } = await workableSubmission(actor, assignmentId);
  const now = new Date();
  const check = checkSubmit({ submissionStatus: submission.status, dueAt: assignment.dueAt, allowLate: assignment.allowLate, now });
  if (check.error !== null) {
    throw new DomainError(check.error, check.error === "PAST_DUE" ? "Đã quá hạn nộp và bài không nhận nộp muộn." : "Bạn đã nộp bài này.");
  }
  const isLate = check.isLate;

  const questions = assignment.questions.map(toQuestionData);
  const responses = cleanResponses(assignment.questions, raw);
  const status = statusAfterSubmit(questions);

  await db.$transaction(async (tx) => {
    // Chỉ một request thắng (docs/06 §3).
    const { count } = await tx.submission.updateMany({
      where: { id: submission.id, status: "IN_PROGRESS" },
      data: { status, submittedAt: now, isLate },
    });
    if (count === 0) throw new DomainError("ALREADY_SUBMITTED", "Bạn đã nộp bài này.");
    const graded: { autoPoints: number | null; teacherPoints: number | null }[] = [];
    for (const q of questions) {
      const response = responses.find((r) => r.questionId === q.id)?.response ?? null;
      const autoPoints = autoGrade(q, response);
      graded.push({ autoPoints, teacherPoints: null });
      await tx.answer.upsert({
        where: { submissionId_questionId: { submissionId: submission.id, questionId: q.id } },
        update: { response, autoPoints },
        create: { submissionId: submission.id, questionId: q.id, response, autoPoints },
      });
    }
    if (status === "GRADED") {
      await tx.submission.update({ where: { id: submission.id }, data: { score: totalScore(graded), gradedAt: now } });
    }
  });
  return { graded: status === "GRADED", isLate };
}

/* ───────────── Kết quả đã công bố (HS/PH/quản lý) ───────────── */

/** FR-033: điểm đã công bố của một học sinh. */
export async function listPublishedResults(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  const subs = await db.submission.findMany({
    where: {
      studentId,
      assignment: { resultsPublishedAt: { not: null }, ...(actor.role === "TEACHER" ? { class: { teacherId: actor.id } } : {}) },
      status: { not: "IN_PROGRESS" },
    },
    orderBy: { assignment: { resultsPublishedAt: "desc" } },
    select: {
      id: true,
      score: true,
      isLate: true,
      teacherComment: true,
      assignment: { select: { id: true, title: true, dueAt: true, resultsPublishedAt: true, class: { select: { code: true } }, questions: { select: { points: true } } } },
    },
  });
  return subs.map((s) => ({
    id: s.id,
    assignmentId: s.assignment.id,
    title: s.assignment.title,
    classCode: s.assignment.class.code,
    publishedAt: s.assignment.resultsPublishedAt!,
    score: s.score,
    maxScore: round2(s.assignment.questions.reduce((sum, q) => sum + q.points, 0)),
    isLate: s.isLate,
    teacherComment: s.teacherComment,
  }));
}

