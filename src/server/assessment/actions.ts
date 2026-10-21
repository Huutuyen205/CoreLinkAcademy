"use server";

import type { QuestionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { vnToUtc } from "@/lib/time";
import {
  createAssignment,
  deleteQuestion,
  gradeSubmission,
  publishResults,
  saveDraftAnswers,
  saveQuestion,
  setAssignmentStatus,
  submitAssignment,
  updateAssignment,
} from "./service";

const id = z.string().min(1).max(40);

const assignmentSchema = z.object({
  title: z.string().trim().min(3, "Nhập tên bài (ít nhất 3 ký tự).").max(200),
  instructions: z.string().trim().max(5000, "Tối đa 5000 ký tự."),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Chọn hạn nộp.")
    .transform((v) => vnToUtc(v.slice(0, 10), v.slice(11, 16))),
  allowLate: z.boolean(),
});

function assignmentInput(formData: FormData) {
  const allowLate = formData.get("allowLate") === "on";
  // allowLate trả lại dạng "on"/"" để ConfigForm giữ trạng thái checkbox khi lỗi.
  const fields = { ...formFields(formData, ["title", "instructions", "dueAt"]), allowLate: allowLate ? "on" : "" };
  return { fields, data: { ...fields, allowLate } };
}

/** API-016 — FR-027. */
export async function createAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const classId = String(formData.get("classId") ?? "");
  if (!id.safeParse(classId).success) return { ok: false, message: "Lớp không hợp lệ." };
  const { fields, data } = assignmentInput(formData);
  const parsed = parseForm(assignmentSchema, data);
  if (!parsed.ok) return { ...parsed.state, values: fields };
  const result = await runAction(() => createAssignment(actor, classId, parsed.data), fields);
  if (!result.ok) return result.state;
  redirect(`/giao-vien/bai-tap/${result.value}?thongbao=tao-bai`);
}

export async function updateAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!id.safeParse(assignmentId).success) return { ok: false, message: "Bài tập không hợp lệ." };
  const { fields, data } = assignmentInput(formData);
  const parsed = parseForm(assignmentSchema, data);
  if (!parsed.ok) return { ...parsed.state, values: fields };
  const result = await runAction(() => updateAssignment(actor, assignmentId, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${assignmentId}`);
  return { ok: true, message: "Đã lưu thông tin bài." };
}

const QUESTION_TYPES = ["MCQ", "SHORT", "ESSAY"] as const;

const lines = (v: string) =>
  v
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const questionSchema = z.object({
  assignmentId: id,
  questionId: z.string().max(40),
  type: z.enum(QUESTION_TYPES, { errorMap: () => ({ message: "Chọn dạng câu hỏi." }) }),
  prompt: z.string().trim().min(1, "Nhập nội dung câu hỏi.").max(5000),
  points: z.coerce.number({ invalid_type_error: "Nhập điểm." }),
  options: z.string().max(3000),
  correctOption: z.string().max(3),
  acceptedAnswers: z.string().max(2000),
});

/** API-016: thêm/sửa câu hỏi. Lựa chọn và đáp án ngắn nhập mỗi dòng một giá trị. */
export async function saveQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["assignmentId", "questionId", "type", "prompt", "points", "options", "correctOption", "acceptedAnswers"]);
  const parsed = parseForm(questionSchema, fields);
  if (!parsed.ok) return parsed.state;
  const q = parsed.data;
  const correct = q.correctOption === "" ? null : Number(q.correctOption) - 1;
  const result = await runAction(
    () =>
      saveQuestion(actor, q.assignmentId, q.questionId || null, {
        type: q.type as QuestionType,
        prompt: q.prompt,
        points: q.points,
        options: q.type === "MCQ" ? lines(q.options) : null,
        correctOption: q.type === "MCQ" && Number.isInteger(correct) ? correct : null,
        acceptedAnswers: q.type === "SHORT" ? lines(q.acceptedAnswers) : null,
      }),
    fields,
  );
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${q.assignmentId}`);
  return { ok: true, message: q.questionId ? "Đã lưu câu hỏi." : "Đã thêm câu hỏi." };
}

export async function deleteQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id, questionId: id }), formFields(formData, ["assignmentId", "questionId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteQuestion(actor, parsed.data.assignmentId, parsed.data.questionId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}`);
  return { ok: true, message: "Đã xóa câu hỏi." };
}

/** API-017 — FR-028. */
export async function setAssignmentStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id, status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]) }), formFields(formData, ["assignmentId", "status"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setAssignmentStatus(actor, parsed.data.assignmentId, parsed.data.status));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}`);
  return { ok: true, message: parsed.data.status === "PUBLISHED" ? "Đã giao bài cho lớp." : "Đã đóng bài." };
}

/** API-020 — FR-032. */
export async function publishResultsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id }), formFields(formData, ["assignmentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => publishResults(actor, parsed.data.assignmentId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}`);
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}/bai-nop`);
  return { ok: true, message: "Đã công bố kết quả. Học sinh và phụ huynh đã xem được điểm." };
}

/** API-019 — FR-031. Form gửi `points:<answerId>`, `feedback:<answerId>` và `answerIds`. */
export async function gradeSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!id.safeParse(submissionId).success) return { ok: false, message: "Bài nộp không hợp lệ." };
  const values: Record<string, string> = {};
  const grades: { answerId: string; teacherPoints: number | null; feedback: string | null }[] = [];
  const answerIds = formData.getAll("answerIds").map(String).filter((a) => a.length > 0 && a.length <= 40).slice(0, 200);
  for (const answerId of answerIds) {
    const rawPoints = String(formData.get(`points:${answerId}`) ?? "").trim().replace(",", ".");
    const feedback = String(formData.get(`feedback:${answerId}`) ?? "").trim().slice(0, 2000);
    values[`points:${answerId}`] = rawPoints;
    values[`feedback:${answerId}`] = feedback;
    grades.push({ answerId, teacherPoints: rawPoints === "" ? null : Number(rawPoints), feedback: feedback || null });
  }
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 5000);
  values.comment = comment;

  const result = await runAction(() => gradeSubmission(actor, submissionId, grades, comment || null), values);
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-nop/${submissionId}`);
  revalidatePath(`/giao-vien/bai-tap/${result.value}/bai-nop`);
  return { ok: true, message: "Đã lưu điểm." };
}

function answersFrom(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer:") && typeof value === "string" && key.length <= 50) out[key.slice(7)] = value;
  }
  return out;
}

/** API-018: lưu nháp hoặc nộp, tùy nút bấm (`intent`). */
export async function studentAnswerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("STUDENT");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!id.safeParse(assignmentId).success) return { ok: false, message: "Bài tập không hợp lệ." };
  const answers = answersFrom(formData);
  const values = Object.fromEntries(Object.entries(answers).map(([k, v]) => [`answer:${k}`, v]));

  if (formData.get("intent") === "submit") {
    const result = await runAction(() => submitAssignment(actor, assignmentId, answers), values);
    if (!result.ok) return result.state;
    revalidatePath(`/hoc-sinh/bai-tap/${assignmentId}`);
    revalidatePath("/hoc-sinh/bai-tap");
    return { ok: true, message: result.value.isLate ? "Đã nộp bài (nộp muộn)." : "Đã nộp bài. Điểm sẽ hiển thị khi giáo viên công bố kết quả." };
  }
  const result = await runAction(() => saveDraftAnswers(actor, assignmentId, answers), values);
  if (!result.ok) return result.state;
  return { ok: true, message: "Đã lưu nháp.", values };
}
