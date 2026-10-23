"use server";

import type { QuestionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { vnToUtc } from "@/lib/time";
import { readUploads } from "@/server/files/storage";
import {
  addAssignmentFiles,
  createAssignment,
  deleteAssignment,
  deleteAssignmentFile,
  deleteQuestion,
  deleteSubmission,
  deleteSubmissionFile,
  gradeSubmission,
  publishResults,
  remindUnsubmitted,
  returnSubmission,
  saveDraftAnswers,
  saveQuestion,
  setAssignmentStatus,
  submitAssignment,
  updateAssignment,
  uploadEssayPhotos,
  uploadSubmissionFiles,
  uploadSubmissionForStudent,
} from "./service";

const id = z.string().min(1).max(40);

const quarter = (v: number) => Math.abs(v * 4 - Math.round(v * 4)) < 1e-9;

const assignmentSchema = z
  .object({
    title: z.string().trim().min(3, "Nhập tên bài (ít nhất 3 ký tự).").max(200),
    instructions: z.string().trim().max(5000, "Tối đa 5000 ký tự."),
    dueAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Chọn hạn nộp.")
      .transform((v) => vnToUtc(v.slice(0, 10), v.slice(11, 16))),
    allowLate: z.boolean(),
    acceptsFiles: z.boolean(),
    isTest: z.boolean(),
    solution: z
      .string()
      .trim()
      .max(20000, "Tối đa 20000 ký tự.")
      .transform((v) => v || null),
    manualMaxScore: z.string().transform((v) => (v.trim() === "" ? null : Number(v.trim().replace(",", ".")))),
  })
  .superRefine((v, ctx) => {
    if (v.manualMaxScore !== null && (!Number.isFinite(v.manualMaxScore) || v.manualMaxScore < 1 || v.manualMaxScore > 100 || !quarter(v.manualMaxScore))) {
      ctx.addIssue({ code: "custom", path: ["manualMaxScore"], message: "Điểm tối đa từ 1 đến 100, bước 0,25." });
    }
  })
  // Bài nhận tệp mà chưa đặt điểm tối đa → thang 10 (dùng khi bài không có câu hỏi).
  .transform((v) => ({ ...v, manualMaxScore: v.acceptsFiles ? (v.manualMaxScore ?? 10) : v.manualMaxScore }));

function assignmentInput(formData: FormData) {
  const allowLate = formData.get("allowLate") === "on";
  const acceptsFiles = formData.get("acceptsFiles") === "on";
  const isTest = formData.get("isTest") === "on";
  // Checkbox trả lại dạng "on"/"" để ConfigForm giữ trạng thái khi lỗi.
  const fields = {
    ...formFields(formData, ["title", "instructions", "dueAt", "manualMaxScore", "solution"]),
    allowLate: allowLate ? "on" : "",
    acceptsFiles: acceptsFiles ? "on" : "",
    isTest: isTest ? "on" : "",
  };
  return { fields, data: { ...fields, allowLate, acceptsFiles, isTest } };
}

/** API-016 — FR-027, FR-040 (tệp đề bài tùy chọn). */
export async function createAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const classId = String(formData.get("classId") ?? "");
  if (!id.safeParse(classId).success) return { ok: false, message: "Lớp không hợp lệ." };
  const { fields, data } = assignmentInput(formData);
  const parsed = parseForm(assignmentSchema, data);
  if (!parsed.ok) return { ...parsed.state, values: fields };
  const result = await runAction(async () => createAssignment(actor, classId, parsed.data, await readUploads(formData, "files")), fields);
  if (!result.ok) return result.state;
  redirect(`/giao-vien/bai-tap/${result.value}?thongbao=tao-bai`);
}

export async function addAssignmentFilesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!id.safeParse(assignmentId).success) return { ok: false, message: "Bài tập không hợp lệ." };
  const result = await runAction(async () => addAssignmentFiles(actor, assignmentId, await readUploads(formData, "files")));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${assignmentId}`);
  return { ok: true, message: "Đã tải tệp lên." };
}

export async function deleteAssignmentFileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id, fileId: id }), formFields(formData, ["assignmentId", "fileId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteAssignmentFile(actor, parsed.data.assignmentId, parsed.data.fileId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}`);
  return { ok: true, message: "Đã xóa tệp." };
}

/** FR-041. */
export async function deleteAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id }), formFields(formData, ["assignmentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteAssignment(actor, parsed.data.assignmentId));
  if (!result.ok) return result.state;
  redirect(`/giao-vien/lop/${result.value}?thongbao=xoa-bai`);
}

export async function remindUnsubmittedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id }), formFields(formData, ["assignmentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => remindUnsubmitted(actor, parsed.data.assignmentId));
  if (!result.ok) return result.state;
  return { ok: true, message: `Đã gửi nhắc nhở cho ${result.value} học sinh chưa nộp (và phụ huynh).` };
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
  // Nút giao/đóng/mở lại đổi theo trạng thái mới (form cũ biến mất) → báo kết quả bằng Flash.
  redirect(`/giao-vien/bai-tap/${parsed.data.assignmentId}?thongbao=${parsed.data.status === "PUBLISHED" ? "giao-bai" : "dong-bai"}`);
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
  redirect(`/giao-vien/bai-tap/${parsed.data.assignmentId}?thongbao=cong-bo`);
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
  // FR-040: bài nộp tệp không có câu hỏi → một điểm tổng.
  const rawManual = String(formData.get("manualScore") ?? "").trim().replace(",", ".");
  values.manualScore = rawManual;
  const manualScore = rawManual === "" ? null : Number(rawManual);

  const result = await runAction(() => gradeSubmission(actor, submissionId, grades, comment || null, manualScore), values);
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

/** FR-040: học sinh tải ảnh/tệp bài làm (trước khi nộp). */
export async function uploadSubmissionFilesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("STUDENT");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!id.safeParse(assignmentId).success) return { ok: false, message: "Bài tập không hợp lệ." };
  const result = await runAction(async () => uploadSubmissionFiles(actor, assignmentId, await readUploads(formData, "files")));
  if (!result.ok) return result.state;
  revalidatePath(`/hoc-sinh/bai-tap/${assignmentId}`);
  return { ok: true, message: "Đã tải bài làm lên. Nhớ bấm \"Nộp bài\" khi hoàn thành." };
}

/** Ảnh bài làm cho một câu tự luận (chụp bằng điện thoại hoặc chọn từ máy) — gửi ngay, không cần lưu nháp. */
export async function uploadEssayPhotosAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("STUDENT");
  const parsed = parseForm(z.object({ assignmentId: id, questionId: id }), formFields(formData, ["assignmentId", "questionId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(async () => uploadEssayPhotos(actor, parsed.data.assignmentId, parsed.data.questionId, await readUploads(formData, "files")));
  if (!result.ok) return result.state;
  revalidatePath(`/hoc-sinh/bai-tap/${parsed.data.assignmentId}`);
  return { ok: true, message: "Đã gửi ảnh bài làm." };
}

export async function deleteSubmissionFileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("STUDENT");
  const parsed = parseForm(z.object({ assignmentId: id, fileId: id }), formFields(formData, ["assignmentId", "fileId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteSubmissionFile(actor, parsed.data.assignmentId, parsed.data.fileId));
  if (!result.ok) return result.state;
  revalidatePath(`/hoc-sinh/bai-tap/${parsed.data.assignmentId}`);
  return { ok: true, message: "Đã xóa tệp." };
}

const noteText = z
  .string()
  .trim()
  .max(500, "Tối đa 500 ký tự.")
  .transform((v) => v || null);

/** GV §8: yêu cầu học sinh nộp lại (bài trở về "đang làm"). */
export async function returnSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["submissionId", "note"]);
  const parsed = parseForm(z.object({ submissionId: id, note: noteText }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => returnSubmission(actor, parsed.data.submissionId, parsed.data.note), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${result.value}/bai-nop`);
  redirect(`/giao-vien/bai-tap/${result.value}/bai-nop?thongbao=tra-bai`);
}

/** GV §8: xóa bài làm của một học sinh. */
export async function deleteSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ submissionId: id }), formFields(formData, ["submissionId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteSubmission(actor, parsed.data.submissionId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${result.value}/bai-nop`);
  redirect(`/giao-vien/bai-tap/${result.value}/bai-nop?thongbao=xoa-bai-lam`);
}

/** GV §8: tải lên bài làm (ảnh bài trên giấy) thay học sinh. */
export async function uploadSubmissionForStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id, studentId: id }), formFields(formData, ["assignmentId", "studentId"]));
  if (!parsed.ok) return parsed.state;
  const { assignmentId, studentId } = parsed.data;
  const result = await runAction(async () => uploadSubmissionForStudent(actor, assignmentId, studentId, await readUploads(formData, "files")));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${assignmentId}/bai-nop`);
  revalidatePath(`/giao-vien/bai-nop/${result.value}`);
  return { ok: true, message: "Đã tải bài làm lên. Bài chuyển sang \"chờ chấm\"." };
}
