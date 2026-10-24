"use server";

import type { QuestionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import { auditParentActing, requireLearner } from "@/server/auth/learner";
import type { ActionState } from "@/server/errors";
import {
  createPracticeSet,
  deletePracticeQuestion,
  deletePracticeSet,
  savePracticeQuestion,
  setPracticeActive,
  submitPracticeAttempt,
  updatePracticeSet,
} from "./service";

const id = z.string().min(1).max(40);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự.`)
    .transform((v) => v || null);

const setSchema = z.object({
  title: z.string().trim().min(3, "Nhập tên đề (ít nhất 3 ký tự).").max(200),
  description: optional(3000),
  topic: z.string().trim().min(1, "Nhập chuyên đề.").max(100),
  format: z.string().trim().min(1, "Nhập dạng bài.").max(60),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"], { errorMap: () => ({ message: "Chọn mức độ." }) }),
  subjectId: z.string().max(40).transform((v) => v || null),
  levelId: z.string().max(40).transform((v) => v || null),
});
const SET_FIELDS = ["title", "description", "topic", "format", "difficulty", "subjectId", "levelId"];

export async function createPracticeSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const fields = formFields(formData, SET_FIELDS);
  const parsed = parseForm(setSchema, fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => createPracticeSet(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  redirect(`/on-luyen/${result.value}?thongbao=tao-de`);
}

const supplementalSchema = z.object({
  title: z.string().trim().min(3, "Nhập tên bài (ít nhất 3 ký tự).").max(200),
  description: optional(3000),
  topic: z.string().trim().max(100, "Tối đa 100 ký tự."),
  format: z.string().trim().min(1, "Nhập dạng bài.").max(60),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"], { errorMap: () => ({ message: "Chọn mức độ." }) }),
  classId: id,
  studentId: id,
  subjectId: z.string().max(40).transform((v) => v || null),
});

/** Đề bổ sung cho một học sinh của lớp (nháp; thêm câu hỏi ở trang đề rồi mở cho học sinh). */
export async function createSupplementalSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const fields = formFields(formData, ["title", "description", "topic", "format", "difficulty", "classId", "studentId", "subjectId"]);
  const parsed = parseForm(supplementalSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { studentId, topic, ...rest } = parsed.data;
  // Chuyên đề bỏ trống → lấy theo tên bài (chuyên đề chỉ để phân loại đề luyện tập).
  const result = await runAction(() => createPracticeSet(actor, { ...rest, topic: topic || rest.title.slice(0, 100), levelId: null, forStudentId: studentId }), fields);
  if (!result.ok) return result.state;
  redirect(`/on-luyen/${result.value}?thongbao=tao-de`);
}

export async function updatePracticeSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const fields = formFields(formData, ["setId", ...SET_FIELDS]);
  const parsed = parseForm(setSchema.extend({ setId: id }), fields);
  if (!parsed.ok) return parsed.state;
  const { setId, ...input } = parsed.data;
  const result = await runAction(() => updatePracticeSet(actor, setId, input), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/on-luyen/${setId}`);
  return { ok: true, message: "Đã lưu thông tin đề." };
}

export async function setPracticeActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const parsed = parseForm(z.object({ setId: id, active: z.enum(["0", "1"]) }), formFields(formData, ["setId", "active"]));
  if (!parsed.ok) return parsed.state;
  const active = parsed.data.active === "1";
  const result = await runAction(() => setPracticeActive(actor, parsed.data.setId, active));
  if (!result.ok) return result.state;
  revalidatePath(`/on-luyen/${parsed.data.setId}`);
  revalidatePath("/on-luyen");
  return { ok: true, message: active ? "Đã mở đề cho học sinh." : "Đã chuyển đề về nháp (học sinh không thấy)." };
}

export async function deletePracticeSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const parsed = parseForm(z.object({ setId: id }), formFields(formData, ["setId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deletePracticeSet(actor, parsed.data.setId));
  if (!result.ok) return result.state;
  redirect("/on-luyen?thongbao=xoa-de");
}

const lines = (v: string) =>
  v
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const questionSchema = z.object({
  setId: id,
  questionId: z.string().max(40),
  type: z.enum(["MCQ", "SHORT"], { errorMap: () => ({ message: "Chọn trắc nghiệm hoặc trả lời ngắn." }) }),
  prompt: z.string().trim().min(1, "Nhập nội dung câu hỏi.").max(5000),
  points: z.coerce.number({ invalid_type_error: "Nhập điểm." }),
  options: z.string().max(3000),
  correctOption: z.string().max(3),
  acceptedAnswers: z.string().max(2000),
  explanation: optional(5000),
});

/** Thêm/sửa câu hỏi đề luyện (cùng cách nhập như bài tập + ô lời giải). */
export async function savePracticeQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const fields = formFields(formData, ["setId", "questionId", "type", "prompt", "points", "options", "correctOption", "acceptedAnswers", "explanation"]);
  const parsed = parseForm(questionSchema, fields);
  if (!parsed.ok) return parsed.state;
  const q = parsed.data;
  const correct = q.correctOption === "" ? null : Number(q.correctOption) - 1;
  const result = await runAction(
    () =>
      savePracticeQuestion(actor, q.setId, q.questionId || null, {
        type: q.type as QuestionType,
        prompt: q.prompt,
        points: q.points,
        options: q.type === "MCQ" ? lines(q.options) : null,
        correctOption: q.type === "MCQ" && Number.isInteger(correct) ? correct : null,
        acceptedAnswers: q.type === "SHORT" ? lines(q.acceptedAnswers) : null,
        explanation: q.explanation,
      }),
    fields,
  );
  if (!result.ok) return result.state;
  revalidatePath(`/on-luyen/${q.setId}`);
  return { ok: true, message: q.questionId ? "Đã lưu câu hỏi." : "Đã thêm câu hỏi." };
}

export async function deletePracticeQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const parsed = parseForm(z.object({ setId: id, questionId: id }), formFields(formData, ["setId", "questionId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deletePracticeQuestion(actor, parsed.data.setId, parsed.data.questionId));
  if (!result.ok) return result.state;
  revalidatePath(`/on-luyen/${parsed.data.setId}`);
  return { ok: true, message: "Đã xóa câu hỏi." };
}

/** HS nộp lượt làm (ô `answer:<questionId>`), chuyển sang trang kết quả. */
export async function submitPracticeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const learner = await requireLearner();
  const actor = learner.student;
  const setId = String(formData.get("setId") ?? "");
  if (!id.safeParse(setId).success) return { ok: false, message: "Đề không hợp lệ." };
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer:") && typeof value === "string" && key.length <= 50) answers[key.slice(7)] = value;
  }
  const result = await runAction(() => submitPracticeAttempt(actor, setId, answers));
  if (!result.ok) return result.state;
  await auditParentActing(learner, "practice.parent_submit", "PracticeAttempt", result.value);
  redirect(`/on-luyen/ket-qua/${result.value}`);
}
