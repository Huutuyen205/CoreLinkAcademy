// Bài tập và chấm điểm (UC-008..UC-010). Đáp án không bao giờ rời server trước khi công bố (T-06).
import { Prisma, type AssignmentStatus, type QuestionType } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCanViewStudent, assertTeacherOwnsClass } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { fileMeta, storeFiles, type PreparedFile } from "@/server/files/storage";
import { notifyUsers } from "@/server/notifications/service";
import { formatDateTime } from "@/lib/time";
import {
  assignmentMaxScore,
  autoGrade,
  checkAssignmentTransition,
  checkSubmit,
  checkSubmitContent,
  checkTeacherPoints,
  jsonStrings,
  resultsVisible,
  round2,
  statusAfterSubmit,
  submissionResultVisible,
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

export type AssignmentInput = {
  title: string;
  instructions: string;
  dueAt: Date;
  allowLate: boolean;
  acceptsFiles: boolean;
  manualMaxScore: number | null;
  isTest: boolean;
  solution: string | null;
};

/** Học sinh đang học (tài khoản mở) của lớp + phụ huynh của các em — người nhận thông báo bài tập. */
async function learnersOf(tx: Prisma.TransactionClient, classId: string, onlyStudentIds?: string[]) {
  const rows = await tx.enrollment.findMany({
    where: { classId, status: "ACTIVE", student: { status: "ACTIVE" }, ...(onlyStudentIds ? { studentId: { in: onlyStudentIds } } : {}) },
    select: { studentId: true, student: { select: { parentLinks: { where: { parent: { status: "ACTIVE" } }, select: { parentId: true } } } } },
  });
  return { students: rows.map((r) => r.studentId), parents: rows.flatMap((r) => r.student.parentLinks.map((l) => l.parentId)) };
}

/** API-016 — FR-027, FR-040: kèm tệp đề bài (tùy chọn). */
export async function createAssignment(actor: Actor, classId: string, input: AssignmentInput, files: PreparedFile[] = []): Promise<string> {
  await assertTeacherOwnsClass(actor, classId);
  return db.$transaction(async (tx) => {
    const a = await tx.assignment.create({ data: { ...input, classId, createdById: actor.id }, select: { id: true } });
    await storeFiles(tx, files, { assignmentId: a.id }, actor.id);
    return a.id;
  });
}

const MAX_ASSIGNMENT_FILES = 10;

/** FR-040: thêm tệp đề bài / tài liệu kèm bài (mọi trạng thái). */
export async function addAssignmentFiles(actor: Actor, assignmentId: string, files: PreparedFile[]): Promise<void> {
  await ownedAssignment(actor, assignmentId);
  if (files.length === 0) throw new DomainError("NO_FILE", "Chọn ít nhất một tệp.", { files: "Chọn tệp." });
  const count = await db.storedFile.count({ where: { assignmentId } });
  if (count + files.length > MAX_ASSIGNMENT_FILES) throw new DomainError("TOO_MANY_FILES", `Mỗi bài tập đính kèm tối đa ${MAX_ASSIGNMENT_FILES} tệp.`);
  await db.$transaction((tx) => storeFiles(tx, files, { assignmentId }, actor.id));
}

export async function deleteAssignmentFile(actor: Actor, assignmentId: string, fileId: string): Promise<void> {
  await ownedAssignment(actor, assignmentId);
  const { count } = await db.storedFile.deleteMany({ where: { id: fileId, assignmentId } });
  if (count === 0) throw new ForbiddenError();
}

/** FR-041: xóa bài khi chưa có học sinh nộp (bài nộp đang làm dở bị xóa theo). Đã có bài nộp → đóng bài thay vì xóa. */
export async function deleteAssignment(actor: Actor, assignmentId: string): Promise<string> {
  const a = await ownedAssignment(actor, assignmentId);
  const submitted = await db.submission.count({ where: { assignmentId, status: { not: "IN_PROGRESS" } } });
  if (submitted > 0) throw new DomainError("HAS_SUBMISSIONS", "Đã có học sinh nộp bài nên không xóa được. Hãy đóng bài thay vì xóa.");
  await db.assignment.delete({ where: { id: assignmentId } });
  return a.classId;
}

/** Nhắc nộp bài (Giáo viên §8): thông báo cho học sinh đang học chưa nộp và phụ huynh của các em. */
export async function remindUnsubmitted(actor: Actor, assignmentId: string): Promise<number> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status !== "PUBLISHED") throw new DomainError("NOT_PUBLISHED", "Chỉ nhắc được khi bài đang giao.");
  const pending = await db.enrollment.findMany({
    where: { classId: a.classId, status: "ACTIVE", student: { status: "ACTIVE", submissions: { none: { assignmentId, status: { not: "IN_PROGRESS" } } } } },
    select: { studentId: true, student: { select: { parentLinks: { select: { parentId: true } } } } },
  });
  if (pending.length === 0) throw new DomainError("ALL_SUBMITTED", "Tất cả học sinh đang học đã nộp bài.");
  const due = formatDateTime(a.dueAt);
  await db.$transaction(async (tx) => {
    await notifyUsers(tx, pending.map((p) => p.studentId), {
      kind: "reminder",
      title: `Nhắc nộp bài: ${a.title}`,
      body: `Lớp ${a.class.code} · hạn nộp ${due}. Em chưa nộp bài này.`,
      link: `/hoc-sinh/bai-tap/${assignmentId}`,
    });
    await notifyUsers(tx, pending.flatMap((p) => p.student.parentLinks.map((l) => l.parentId)), {
      kind: "reminder",
      title: `Con chưa nộp bài: ${a.title}`,
      body: `Lớp ${a.class.code} · hạn nộp ${due}.`,
      link: "/phu-huynh/bai-tap",
    });
  });
  return pending.length;
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
  const error = checkAssignmentTransition(a.status, to, { questionCount, acceptsFiles: a.acceptsFiles, dueAt: a.dueAt, now: new Date() });
  const messages = {
    INVALID_TRANSITION: "Không thể chuyển bài sang trạng thái này.",
    NO_QUESTIONS: "Bài cần ít nhất một câu hỏi (hoặc bật \"Nhận bài nộp dạng tệp/ảnh\") trước khi giao.",
    DUE_IN_PAST: "Hạn nộp đã qua. Hãy sửa hạn nộp trước khi giao bài.",
  } as const;
  if (error) throw new DomainError(error, messages[error]);
  await db.$transaction(async (tx) => {
    await tx.assignment.update({ where: { id: assignmentId }, data: { status: to } });
    // Giao lần đầu (nháp → giao): báo HS + PH "bài tập mới" hoặc "lịch kiểm tra". Mở lại bài đã đóng thì không báo.
    if (a.status === "DRAFT" && to === "PUBLISHED") {
      const { students, parents } = await learnersOf(tx, a.classId);
      const due = formatDateTime(a.dueAt);
      const kind = a.isTest ? "test" : "assignment";
      await notifyUsers(tx, students, {
        kind,
        title: a.isTest ? `Lịch kiểm tra: ${a.title}` : `Bài tập mới: ${a.title}`,
        body: `Lớp ${a.class.code} · ${a.isTest ? "làm và nộp trước" : "hạn nộp"} ${due}.`,
        link: `/hoc-sinh/bai-tap/${assignmentId}`,
      });
      await notifyUsers(tx, parents, {
        kind,
        title: a.isTest ? `Con có bài kiểm tra: ${a.title}` : `Con có bài tập mới: ${a.title}`,
        body: `Lớp ${a.class.code} · hạn ${due}.`,
        link: "/phu-huynh/bai-tap",
      });
    }
  });
}

/** API-020 — FR-032. */
export async function publishResults(actor: Actor, assignmentId: string): Promise<void> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status === "DRAFT") throw new DomainError("NOT_PUBLISHED", "Bài chưa được giao nên chưa thể công bố kết quả.");
  if (a.resultsPublishedAt) return;
  const graded = await db.submission.findMany({
    where: { assignmentId, status: "GRADED" },
    select: { studentId: true, student: { select: { parentLinks: { select: { parentId: true } } } } },
  });
  await db.$transaction(async (tx) => {
    await tx.assignment.update({ where: { id: assignmentId }, data: { resultsPublishedAt: new Date() } });
    await notifyUsers(tx, graded.map((g) => g.studentId), {
      kind: "results",
      title: `Bài đã được chấm: ${a.title}`,
      body: `Lớp ${a.class.code}. Xem điểm, nhận xét${a.solution ? " và bài chữa" : ""} của giáo viên.`,
      link: `/hoc-sinh/bai-tap/${assignmentId}`,
    });
    await notifyUsers(tx, graded.flatMap((g) => g.student.parentLinks.map((l) => l.parentId)), {
      kind: "results",
      title: `Đã có kết quả bài: ${a.title}`,
      body: `Lớp ${a.class.code}.`,
      link: "/phu-huynh/bai-tap",
    });
    // Bài chữa / đáp án: báo mọi HS đang học (cả em chưa nộp hoặc chưa được chấm vẫn xem được bài chữa).
    const hasKey = a.solution || (await tx.question.count({ where: { assignmentId, type: { in: ["MCQ", "SHORT"] } } })) > 0;
    if (hasKey) {
      const gradedIds = new Set(graded.map((g) => g.studentId));
      const { students } = await learnersOf(tx, a.classId);
      await notifyUsers(tx, students.filter((s) => !gradedIds.has(s)), {
        kind: "solution",
        title: `Đã có ${a.solution ? "bài chữa" : "đáp án"}: ${a.title}`,
        body: `Lớp ${a.class.code}.`,
        link: `/hoc-sinh/bai-tap/${assignmentId}`,
      });
    }
  });
}

/**
 * GV §8 "Yêu cầu nộp lại": bài nộp trở về "đang làm" (giữ câu trả lời và tệp), xóa điểm.
 * HS được nộp lại kể cả khi đã quá hạn (`returnedAt`). Báo HS + PH.
 */
export async function returnSubmission(actor: Actor, submissionId: string, note: string | null): Promise<string> {
  const s = await db.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true, studentId: true, assignment: { select: { id: true, title: true, status: true, classId: true, class: { select: { code: true, teacherId: true } } } } },
  });
  if (!s || actor.role !== "TEACHER" || s.assignment.class.teacherId !== actor.id) throw new ForbiddenError();
  if (s.status === "IN_PROGRESS") throw new DomainError("NOT_SUBMITTED", "Học sinh chưa nộp bài nên không cần yêu cầu nộp lại.");
  if (s.assignment.status !== "PUBLISHED") throw new DomainError("CLOSED", "Bài đã đóng. Mở lại bài trước khi yêu cầu nộp lại.");
  await db.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: "IN_PROGRESS", submittedAt: null, isLate: false, score: null, gradedAt: null, gradedById: null, returnedAt: new Date(), returnNote: note },
    });
    await tx.answer.updateMany({ where: { submissionId }, data: { autoPoints: null, teacherPoints: null } });
    const { students, parents } = await learnersOf(tx, s.assignment.classId, [s.studentId]);
    await notifyUsers(tx, students, {
      kind: "resubmit",
      title: `Giáo viên yêu cầu nộp lại: ${s.assignment.title}`,
      body: `Lớp ${s.assignment.class.code}.${note ? ` Lời nhắn: ${note}` : ""}`,
      link: `/hoc-sinh/bai-tap/${s.assignment.id}`,
    });
    await notifyUsers(tx, parents, { kind: "resubmit", title: `Con cần nộp lại bài: ${s.assignment.title}`, body: `Lớp ${s.assignment.class.code}.`, link: "/phu-huynh/bai-tap" });
    await writeAudit({ actorId: actor.id, action: "submission.return", entity: "Submission", entityId: submissionId, detail: { note } }, tx);
  });
  return s.assignment.id;
}

/** GV §8 "Xóa bài làm": xóa hẳn bài nộp (câu trả lời, ảnh, tệp) — HS làm lại từ đầu nếu bài còn mở. Ghi audit. */
export async function deleteSubmission(actor: Actor, submissionId: string): Promise<string> {
  const s = await db.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, studentId: true, score: true, status: true, assignment: { select: { id: true, class: { select: { teacherId: true } } } } },
  });
  if (!s || actor.role !== "TEACHER" || s.assignment.class.teacherId !== actor.id) throw new ForbiddenError();
  await db.$transaction(async (tx) => {
    await tx.submission.delete({ where: { id: submissionId } });
    await writeAudit({ actorId: actor.id, action: "submission.delete", entity: "Submission", entityId: submissionId, detail: { studentId: s.studentId, status: s.status, score: s.score } }, tx);
  });
  return s.assignment.id;
}

/**
 * GV §8 "Tải lên / cập nhật bài làm": GV chụp bài làm trên giấy của HS và nộp thay.
 * Chưa có bài nộp → tạo bài "đã nộp" (chờ chấm); đã có → thêm tệp. Tính nộp muộn theo hạn.
 */
export async function uploadSubmissionForStudent(actor: Actor, assignmentId: string, studentId: string, files: PreparedFile[]): Promise<string> {
  const a = await ownedAssignment(actor, assignmentId);
  if (a.status === "DRAFT") throw new DomainError("NOT_PUBLISHED", "Bài chưa giao.");
  if (files.length === 0) throw new DomainError("NO_FILE", "Chọn ảnh hoặc tệp bài làm.", { files: "Chọn tệp." });
  const enrolled = await db.enrollment.findUnique({ where: { classId_studentId: { classId: a.classId, studentId } }, select: { status: true } });
  if (!enrolled) throw new ForbiddenError();
  const now = new Date();
  return db.$transaction(async (tx) => {
    const existing = await tx.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId } }, select: { id: true, status: true } });
    const sub = existing
      ? existing.status === "IN_PROGRESS"
        ? await tx.submission.update({ where: { id: existing.id }, data: { status: "SUBMITTED", submittedAt: now, isLate: now > a.dueAt }, select: { id: true } })
        : existing
      : await tx.submission.create({ data: { assignmentId, studentId, status: "SUBMITTED", submittedAt: now, isLate: now > a.dueAt }, select: { id: true } });
    const count = await tx.storedFile.count({ where: { submissionId: sub.id, questionId: null } });
    if (count + files.length > MAX_SUBMISSION_FILES) throw new DomainError("TOO_MANY_FILES", `Mỗi bài nộp tối đa ${MAX_SUBMISSION_FILES} tệp.`);
    await storeFiles(tx, files, { submissionId: sub.id }, actor.id);
    return sub.id;
  });
}

/** GV §7 "Xem danh sách / tìm kiếm bài tập": mọi bài của các lớp mình phụ trách, lọc theo tên, lớp, trạng thái. */
export async function listTeacherAssignments(actor: Actor, filter: { q?: string; classId?: string; status?: AssignmentStatus }) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  return db.assignment.findMany({
    where: {
      class: { teacherId: actor.id },
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.q ? { title: { contains: filter.q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { dueAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      status: true,
      isTest: true,
      dueAt: true,
      resultsPublishedAt: true,
      class: { select: { id: true, code: true } },
      _count: { select: { questions: true, submissions: { where: { status: { not: "IN_PROGRESS" } } } } },
    },
  });
}

export async function getAssignmentForTeacher(actor: Actor, assignmentId: string) {
  await ownedAssignment(actor, assignmentId);
  const a = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      class: { select: { id: true, code: true, course: { select: { title: true } } } },
      questions: { orderBy: { order: "asc" } },
      files: { select: fileMeta, orderBy: { createdAt: "asc" } },
      _count: { select: { submissions: { where: { status: { not: "IN_PROGRESS" } } } } },
    },
  });
  // FR-032 / DECISION-D15: báo số bài chưa chấm trước khi công bố.
  const ungradedCount = await db.submission.count({ where: { assignmentId, status: "SUBMITTED" } });
  return { ...a, questions: a.questions.map(toQuestionData), ungradedCount };
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
    db.submission.findMany({
      where: { assignmentId },
      select: { id: true, studentId: true, status: true, submittedAt: true, isLate: true, score: true, returnedAt: true, _count: { select: { files: true } } },
    }),
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
      files: { select: { ...fileMeta, questionId: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!s || actor.role !== "TEACHER" || s.assignment.class.teacherId !== actor.id) throw new ForbiddenError();
  const answers = new Map(s.answers.map((a) => [a.questionId, a]));
  return {
    // `files`: tệp bài làm chung; ảnh câu tự luận nằm ở `items[].photos`.
    submission: { ...s, files: s.files.filter((f) => !f.questionId) },
    maxScore: assignmentMaxScore(s.assignment),
    items: s.assignment.questions.map((q) => ({ question: toQuestionData(q), answer: answers.get(q.id) ?? null, photos: s.files.filter((f) => f.questionId === q.id) })),
  };
}

/**
 * API-019 — FR-031: chấm tự luận/sửa điểm câu tự chấm + nhận xét. Sửa sau công bố → audit (FR-033).
 * FR-040: bài không có câu hỏi (nộp tệp/ảnh) → giáo viên nhập một điểm tổng `manualScore`.
 */
export async function gradeSubmission(
  actor: Actor,
  submissionId: string,
  grades: { answerId: string; teacherPoints: number | null; feedback: string | null }[],
  comment: string | null,
  manualScore: number | null = null,
): Promise<string> {
  const { submission, items, maxScore } = await getSubmissionForGrading(actor, submissionId);
  if (submission.status === "IN_PROGRESS") throw new DomainError("NOT_SUBMITTED", "Học sinh chưa nộp bài.");
  const byAnswer = new Map(items.filter((i) => i.answer).map((i) => [i.answer!.id, i]));
  const manualOnly = items.length === 0;
  if (manualOnly) {
    const err = manualScore === null ? "Nhập điểm bài làm." : checkTeacherPoints(manualScore, maxScore);
    if (err) throw new DomainError("POINTS_OUT_OF_RANGE", "Vui lòng kiểm tra lại điểm.", { manualScore: err });
  }

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
    const score = manualOnly ? round2(manualScore!) : totalScore(answers);
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
      // Kết quả đã công bố → HS/PH thấy ngay: báo "đã được chấm" (lần đầu) hoặc "điểm được cập nhật" (chấm lại).
      const regrade = submission.status === "GRADED";
      const a = submission.assignment;
      const { students, parents } = await learnersOf(tx, a.classId, [submission.studentId]);
      const title = regrade ? `Điểm được cập nhật: ${a.title}` : `Bài đã được chấm: ${a.title}`;
      await notifyUsers(tx, students, { kind: regrade ? "grade_update" : "results", title, body: `Lớp ${a.class.code} · ${score} điểm.`, link: `/hoc-sinh/bai-tap/${a.id}` });
      await notifyUsers(tx, parents, { kind: regrade ? "grade_update" : "results", title: `${regrade ? "Điểm của con được cập nhật" : "Bài của con đã được chấm"}: ${a.title}`, body: `Lớp ${a.class.code}.`, link: "/phu-huynh/bai-tap" });
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
      select: {
        id: true,
        title: true,
        resultsPublishedAt: true,
        manualMaxScore: true,
        questions: { select: { points: true } },
        submissions: { select: { studentId: true, status: true, score: true } },
      },
    }),
    db.enrollment.findMany({ where: { classId }, orderBy: { student: { fullName: "asc" } }, select: { status: true, student: { select: { id: true, fullName: true } } } }),
  ]);
  return {
    assignments: assignments.map((a) => ({ id: a.id, title: a.title, published: Boolean(a.resultsPublishedAt), maxScore: assignmentMaxScore(a) })),
    rows: enrollments.map((e) => ({
      student: e.student,
      enrollmentStatus: e.status,
      cells: assignments.map((a) => a.submissions.find((s) => s.studentId === e.student.id) ?? null),
    })),
  };
}

/** FR-034: tổng số bài chờ chấm + 20 bài cũ nhất (GAP-11). */
export async function countPendingGrading(actor: Actor) {
  if (actor.role !== "TEACHER") throw new ForbiddenError();
  const where = { status: "SUBMITTED" as const, assignment: { class: { teacherId: actor.id } } };
  const [total, items] = await Promise.all([db.submission.count({ where }), db.submission.findMany({
    where,
    orderBy: { submittedAt: "asc" },
    take: 20,
    select: { id: true, submittedAt: true, student: { select: { fullName: true } }, assignment: { select: { title: true, class: { select: { code: true } } } } },
  })]);
  return { total, items };
}

/* ───────────── Học sinh ───────────── */

async function activeEnrollment(studentId: string, classId: string) {
  const e = await db.enrollment.findUnique({ where: { classId_studentId: { classId, studentId } }, select: { status: true } });
  return e;
}

/** Bài được giao cho học sinh (PUBLISHED/CLOSED của lớp có ghi danh). */
async function assignmentsForStudent(studentId: string) {
  const rows = await db.assignment.findMany({
    where: { status: { in: ["PUBLISHED", "CLOSED"] }, class: { enrollments: { some: { studentId } } } },
    orderBy: { dueAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      allowLate: true,
      acceptsFiles: true,
      isTest: true,
      solution: true,
      manualMaxScore: true,
      resultsPublishedAt: true,
      questions: { select: { points: true } },
      class: { select: { code: true, course: { select: { title: true } }, enrollments: { where: { studentId }, select: { status: true } } } },
      submissions: { where: { studentId }, select: { status: true, score: true, isLate: true, submittedAt: true, teacherComment: true, returnedAt: true } },
    },
  });
  return rows.map(({ submissions, resultsPublishedAt, class: c, questions, manualMaxScore, solution, ...a }) => {
    const sub = submissions[0] ?? null;
    const visible = submissionResultVisible({ resultsPublishedAt }, sub?.status ?? null);
    return {
      ...a,
      classCode: c.code,
      courseTitle: c.course.title,
      enrollmentStatus: c.enrollments[0]?.status ?? null,
      submissionStatus: sub?.status ?? null,
      submittedAt: sub?.submittedAt ?? null,
      isLate: sub?.isLate ?? false,
      returned: Boolean(sub?.returnedAt) && sub?.status === "IN_PROGRESS",
      resultsPublished: visible,
      awaitingGrade: resultsVisible({ resultsPublishedAt }) && sub?.status === "SUBMITTED",
      maxScore: assignmentMaxScore({ questions, manualMaxScore }),
      // BR-046, BR-047: điểm/nhận xét chỉ trả khi đã công bố và bài đã chấm.
      score: visible ? (sub?.score ?? null) : null,
      teacherComment: visible ? (sub?.teacherComment ?? null) : null,
      // Bài chữa: sau khi công bố kết quả.
      solution: resultsVisible({ resultsPublishedAt }) ? solution : null,
    };
  });
}

export async function listMyAssignments(actor: Actor) {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  return assignmentsForStudent(actor.id);
}

/** Phụ huynh (§4): danh sách bài tập của con — hạn nộp, trạng thái nộp, điểm/nhận xét đã công bố. Chỉ xem. */
export async function listAssignmentsOfStudent(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  return assignmentsForStudent(studentId);
}

/**
 * UC-009: mở bài để làm/xem. Tạo submission IN_PROGRESS khi được làm.
 * Chỉ trả đáp án đúng, điểm, nhận xét khi kết quả đã công bố.
 */
export async function openAssignmentForStudent(actor: Actor, assignmentId: string) {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      class: { select: { code: true, course: { select: { title: true } } } },
      questions: { orderBy: { order: "asc" } },
      files: { select: fileMeta, orderBy: { createdAt: "asc" } },
    },
  });
  if (!a || a.status === "DRAFT") throw new ForbiddenError();
  const enrollment = await activeEnrollment(actor.id, a.classId);
  if (!enrollment) throw new ForbiddenError();

  const withAnswers = { answers: true, files: { select: { ...fileMeta, questionId: true }, orderBy: { createdAt: "asc" as const } } } as const;
  let submission = await db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId: actor.id } }, include: withAnswers });
  const now = new Date();
  // Bài GV yêu cầu nộp lại (`returnedAt`) vẫn nộp được sau hạn.
  const pastDueBlocked = now > a.dueAt && !a.allowLate && !submission?.returnedAt;
  const canWork = enrollment.status === "ACTIVE" && a.status === "PUBLISHED" && (!submission || submission.status === "IN_PROGRESS") && !pastDueBlocked;
  if (!submission && canWork) {
    submission = await db.submission
      .create({ data: { assignmentId, studentId: actor.id }, include: withAnswers })
      .catch(async () => db.submission.findUniqueOrThrow({ where: { assignmentId_studentId: { assignmentId, studentId: actor.id } }, include: withAnswers }));
  }

  // BR-047: đã công bố nhưng bài nộp chưa chấm → chưa trả điểm/đáp án.
  const visible = submissionResultVisible(a, submission?.status ?? null);
  const questions = a.questions.map(toQuestionData);
  const answers = new Map((submission?.answers ?? []).map((x) => [x.questionId, x]));
  return {
    assignment: {
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      dueAt: a.dueAt,
      allowLate: a.allowLate,
      acceptsFiles: a.acceptsFiles,
      isTest: a.isTest,
      maxScore: assignmentMaxScore(a),
      status: a.status,
      // Bài chữa hiện khi kết quả đã công bố (cả HS chưa nộp).
      solution: resultsVisible(a) ? a.solution : null,
      classCode: a.class.code,
      courseTitle: a.class.course.title,
      files: a.files,
    },
    submission: submission
      ? {
          status: submission.status,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate,
          score: visible ? submission.score : null,
          teacherComment: visible ? submission.teacherComment : null,
          returnNote: submission.status === "IN_PROGRESS" && submission.returnedAt ? (submission.returnNote ?? "") : null,
          files: submission.files.filter((f) => !f.questionId),
        }
      : null,
    canWork,
    pastDueBlocked,
    resultsPublished: visible,
    awaitingGrade: resultsVisible(a) && submission?.status === "SUBMITTED",
    items: questions.map((q) => {
      const ans = answers.get(q.id);
      return {
        question: toStudentQuestion(q),
        response: ans?.response ?? null,
        photos: (submission?.files ?? []).filter((f) => f.questionId === q.id),
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
  const check = checkSubmit({ submissionStatus: submission.status, dueAt: assignment.dueAt, allowLate: assignment.allowLate || Boolean(submission.returnedAt), now: new Date() });
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

const MAX_SUBMISSION_FILES = 10;
const MAX_ESSAY_PHOTOS = 6;

/** Bài đang mở, chưa nộp, chưa quá hạn (hoặc nhận nộp muộn) và có tệp được chọn. */
async function fileTarget(actor: Actor, assignmentId: string, files: PreparedFile[]) {
  const { assignment, submission } = await workableSubmission(actor, assignmentId);
  const check = checkSubmit({ submissionStatus: submission.status, dueAt: assignment.dueAt, allowLate: assignment.allowLate || Boolean(submission.returnedAt), now: new Date() });
  if (check.error === "ALREADY_SUBMITTED") throw new DomainError(check.error, "Bạn đã nộp bài này nên không thêm tệp được.");
  if (check.error === "PAST_DUE") throw new DomainError(check.error, "Đã quá hạn nộp.");
  if (files.length === 0) throw new DomainError("NO_FILE", "Chọn ảnh hoặc tệp bài làm.", { files: "Chọn tệp." });
  return { assignment, submission };
}

/** FR-040: học sinh tải ảnh/tệp bài làm (cả bài) khi bài đang mở và chưa nộp. */
export async function uploadSubmissionFiles(actor: Actor, assignmentId: string, files: PreparedFile[]): Promise<void> {
  const { assignment, submission } = await fileTarget(actor, assignmentId, files);
  if (!assignment.acceptsFiles) throw new DomainError("NO_FILES_ALLOWED", "Bài này không nhận nộp tệp.");
  const count = await db.storedFile.count({ where: { submissionId: submission.id, questionId: null } });
  if (count + files.length > MAX_SUBMISSION_FILES) throw new DomainError("TOO_MANY_FILES", `Mỗi bài nộp tối đa ${MAX_SUBMISSION_FILES} tệp.`);
  await db.$transaction((tx) => storeFiles(tx, files, { submissionId: submission.id }, actor.id));
}

/**
 * Câu tự luận: học sinh chụp ảnh bài làm trên giấy gửi kèm (thay hoặc bổ sung cho phần gõ chữ).
 * Ảnh thuộc bài nộp (quyền xem như bài nộp) và gắn với câu hỏi để giáo viên chấm đúng câu.
 */
export async function uploadEssayPhotos(actor: Actor, assignmentId: string, questionId: string, files: PreparedFile[]): Promise<void> {
  const { assignment, submission } = await fileTarget(actor, assignmentId, files);
  const question = assignment.questions.find((q) => q.id === questionId);
  if (!question || question.type !== "ESSAY") throw new ForbiddenError();
  if (files.some((f) => !f.mimeType.startsWith("image/") && f.mimeType !== "application/pdf")) {
    throw new DomainError("INVALID_FILE", "Câu tự luận chỉ nhận ảnh chụp bài làm hoặc PDF.");
  }
  const count = await db.storedFile.count({ where: { submissionId: submission.id, questionId } });
  if (count + files.length > MAX_ESSAY_PHOTOS) throw new DomainError("TOO_MANY_FILES", `Mỗi câu tự luận tối đa ${MAX_ESSAY_PHOTOS} ảnh.`);
  await db.$transaction((tx) => storeFiles(tx, files, { submissionId: submission.id, questionId }, actor.id));
}

export async function deleteSubmissionFile(actor: Actor, assignmentId: string, fileId: string): Promise<void> {
  if (actor.role !== "STUDENT") throw new ForbiddenError();
  const submission = await db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId: actor.id } }, select: { id: true, status: true } });
  if (!submission) throw new ForbiddenError();
  if (submission.status !== "IN_PROGRESS") throw new DomainError("ALREADY_SUBMITTED", "Bài đã nộp nên không xóa tệp được.");
  const { count } = await db.storedFile.deleteMany({ where: { id: fileId, submissionId: submission.id } });
  if (count === 0) throw new ForbiddenError();
}

/** API-018 — FR-029, FR-030: nộp đúng một lần, tự chấm câu khách quan. */
export async function submitAssignment(actor: Actor, assignmentId: string, raw: Record<string, string>): Promise<{ graded: boolean; isLate: boolean }> {
  const { assignment, submission } = await workableSubmission(actor, assignmentId);
  const now = new Date();
  const check = checkSubmit({ submissionStatus: submission.status, dueAt: assignment.dueAt, allowLate: assignment.allowLate || Boolean(submission.returnedAt), now });
  if (check.error !== null) {
    throw new DomainError(check.error, check.error === "PAST_DUE" ? "Đã quá hạn nộp và bài không nhận nộp muộn." : "Bạn đã nộp bài này.");
  }
  const isLate = check.isLate;
  const fileCount = await db.storedFile.count({ where: { submissionId: submission.id } });
  if (checkSubmitContent(assignment.questions.length, fileCount)) {
    throw new DomainError("NO_FILES", "Bài này cần nộp ảnh hoặc tệp bài làm. Hãy tải tệp lên trước khi nộp.");
  }

  const questions = assignment.questions.map(toQuestionData);
  const responses = cleanResponses(assignment.questions, raw);
  const status = statusAfterSubmit(questions, fileCount > 0);

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
    } else {
      // Cần chấm tay (tự luận / ảnh / tệp) → báo giáo viên phụ trách lớp.
      const klass = await tx.class.findUniqueOrThrow({ where: { id: assignment.classId }, select: { teacherId: true, code: true } });
      await notifyUsers(tx, [klass.teacherId], {
        kind: "submission",
        title: `${actor.fullName} đã nộp "${assignment.title}"`,
        body: `Lớp ${klass.code}${isLate ? " · nộp muộn" : ""}. Bài có phần tự luận/ảnh cần chấm.`,
        link: `/giao-vien/bai-nop/${submission.id}`,
      });
    }
  });
  return { graded: status === "GRADED", isLate };
}

/* ───────────── Kết quả đã công bố (HS/PH/quản lý) ───────────── */

/** FR-033: điểm đã công bố của một học sinh (chỉ bài đã chấm — BR-047). */
export async function listPublishedResults(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  const subs = await db.submission.findMany({
    where: {
      studentId,
      assignment: { resultsPublishedAt: { not: null }, ...(actor.role === "TEACHER" ? { class: { teacherId: actor.id } } : {}) },
      status: "GRADED", // BR-047
    },
    orderBy: { assignment: { resultsPublishedAt: "desc" } },
    select: {
      id: true,
      score: true,
      isLate: true,
      teacherComment: true,
      assignment: {
        select: {
          id: true,
          title: true,
          dueAt: true,
          isTest: true,
          resultsPublishedAt: true,
          manualMaxScore: true,
          class: { select: { id: true, code: true, course: { select: { subject: { select: { name: true } } } } } },
          questions: { select: { points: true } },
        },
      },
    },
  });
  return subs.map((s) => ({
    id: s.id,
    assignmentId: s.assignment.id,
    title: s.assignment.title,
    classCode: s.assignment.class.code,
    classId: s.assignment.class.id,
    subjectName: s.assignment.class.course.subject.name,
    isTest: s.assignment.isTest,
    publishedAt: s.assignment.resultsPublishedAt!,
    score: s.score,
    maxScore: assignmentMaxScore(s.assignment),
    isLate: s.isLate,
    teacherComment: s.teacherComment,
  }));
}

