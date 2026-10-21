// Chấm điểm và quy tắc bài tập thuần (FR-027..FR-032, BR-040..BR-046).
import type { AssignmentStatus, QuestionType, SubmissionStatus } from "@prisma/client";

export type QuestionData = {
  id: string;
  order: number;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctOption: number | null;
  acceptedAnswers: string[] | null;
  points: number;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

const isQuarterStep = (n: number) => Math.abs(n * 4 - Math.round(n * 4)) < 1e-9;

/** TC-025: kiểm tra một câu hỏi trước khi lưu. Trả `{ field: message }` hoặc null. */
export function validateQuestion(q: Omit<QuestionData, "id" | "order">): Record<string, string> | null {
  const errors: Record<string, string> = {};
  if (!q.prompt.trim()) errors.prompt = "Nhập nội dung câu hỏi.";
  if (!(q.points > 0) || q.points > 100 || !isQuarterStep(q.points)) errors.points = "Điểm từ 0,25 đến 100, bước 0,25.";
  if (q.type === "MCQ") {
    const options = (q.options ?? []).map((o) => o.trim());
    if (options.length < 2 || options.length > 6 || options.some((o) => !o)) errors.options = "Trắc nghiệm cần 2–6 lựa chọn, không để trống.";
    else if (q.correctOption === null || q.correctOption < 0 || q.correctOption >= options.length) errors.correctOption = "Chọn đáp án đúng.";
  }
  if (q.type === "SHORT" && (q.acceptedAnswers ?? []).filter((a) => a.trim()).length === 0) {
    errors.acceptedAnswers = "Nhập ít nhất một đáp án được chấp nhận.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/** BR-041: trim, gộp khoảng trắng, chữ thường, Unicode NFC. */
export function normalizeAnswer(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

/** BR-040, BR-041: điểm tự chấm; null với tự luận. */
export function autoGrade(q: QuestionData, response: string | null): number | null {
  if (q.type === "ESSAY") return null;
  if (response === null || response.trim() === "") return 0;
  if (q.type === "MCQ") return Number(response) === q.correctOption ? q.points : 0;
  const accepted = new Set((q.acceptedAnswers ?? []).map(normalizeAnswer));
  return accepted.has(normalizeAnswer(response)) ? q.points : 0;
}

/** BR-043: tổng (teacherPoints ?? autoPoints ?? 0), làm tròn 2 chữ số. */
export function totalScore(answers: { autoPoints: number | null; teacherPoints: number | null }[]): number {
  return round2(answers.reduce((sum, a) => sum + (a.teacherPoints ?? a.autoPoints ?? 0), 0));
}

/** BR-042, TC-030: điểm giáo viên nhập phải trong [0, max] và bước 0,25. */
export function checkTeacherPoints(points: number, max: number): string | null {
  if (!Number.isFinite(points) || points < 0 || points > max) return `Điểm phải từ 0 đến ${max}.`;
  if (!isQuarterStep(points)) return "Điểm theo bước 0,25.";
  return null;
}

export type AssignmentTransitionError = "INVALID_TRANSITION" | "NO_QUESTIONS" | "DUE_IN_PAST";

/** FR-028, TC-023, TC-024. */
export function checkAssignmentTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
  ctx: { questionCount: number; dueAt: Date; now: Date },
): AssignmentTransitionError | null {
  const allowed: Record<AssignmentStatus, AssignmentStatus[]> = { DRAFT: ["PUBLISHED"], PUBLISHED: ["CLOSED"], CLOSED: ["PUBLISHED"] };
  if (!allowed[from].includes(to)) return "INVALID_TRANSITION";
  if (from === "DRAFT" && to === "PUBLISHED") {
    if (ctx.questionCount < 1) return "NO_QUESTIONS";
    if (ctx.dueAt <= ctx.now) return "DUE_IN_PAST";
  }
  return null;
}

/** BR-044, BR-045, TC-028: được nộp không, có muộn không. */
export function checkSubmit(ctx: { submissionStatus: SubmissionStatus; dueAt: Date; allowLate: boolean; now: Date }):
  | { error: "ALREADY_SUBMITTED" | "PAST_DUE" }
  | { error: null; isLate: boolean } {
  if (ctx.submissionStatus !== "IN_PROGRESS") return { error: "ALREADY_SUBMITTED" };
  const late = ctx.now > ctx.dueAt;
  if (late && !ctx.allowLate) return { error: "PAST_DUE" };
  return { error: null, isLate: late };
}

/** TC-029: bài chỉ có câu khách quan → GRADED ngay khi nộp. */
export function statusAfterSubmit(questions: { type: QuestionType }[]): SubmissionStatus {
  return questions.some((q) => q.type === "ESSAY") ? "SUBMITTED" : "GRADED";
}

/** BR-046, TC-033. */
export function resultsVisible(assignment: { resultsPublishedAt: Date | null }): boolean {
  return assignment.resultsPublishedAt !== null;
}

/**
 * BR-047, TC-042: điểm/đáp án của MỘT bài nộp chỉ hiện cho HS/PH khi bài đã công bố VÀ bài nộp đã chấm.
 * Bài còn SUBMITTED (tự luận chưa chấm) hiện "Đang chờ chấm" thay vì điểm 0 (DECISION-D15).
 */
export function submissionResultVisible(assignment: { resultsPublishedAt: Date | null }, submissionStatus: SubmissionStatus | null): boolean {
  return resultsVisible(assignment) && submissionStatus === "GRADED";
}

export type StudentQuestion =Pick<QuestionData, "id" | "order" | "type" | "prompt" | "options" | "points">;

/** T-06, TC-032: bỏ mọi trường đáp án trước khi gửi cho học sinh. */
export function toStudentQuestion(q: QuestionData): StudentQuestion {
  return { id: q.id, order: q.order, type: q.type, prompt: q.prompt, options: q.options, points: q.points };
}

/** Đọc JSON mảng chuỗi từ DB. */
export function jsonStrings(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : null;
}
