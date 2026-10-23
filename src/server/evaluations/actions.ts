"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { optionalText } from "@/server/users/schemas";
import { deleteEvaluation, saveEvaluation, sendEvaluation } from "./service";

const id = z.string().min(1).max(40);

const evaluationSchema = z.object({
  classId: id,
  studentId: id,
  period: z.string().trim().min(2, "Nhập kỳ đánh giá (vd. Tháng 10/2026).").max(40),
  content: z.string().trim().min(10, "Nhận xét chung tối thiểu 10 ký tự.").max(5000),
  strengths: optionalText(2000),
  improvements: optionalText(2000),
});

/** FR-049: lưu nháp đánh giá định kỳ. */
export async function saveEvaluationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["classId", "studentId", "period", "content", "strengths", "improvements"]);
  const parsed = parseForm(evaluationSchema, fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => saveEvaluation(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/lop/${parsed.data.classId}/danh-gia`);
  return { ok: true, message: "Đã lưu đánh giá. Bản nháp: bấm \"Gửi\" để học sinh, phụ huynh xem; bản đã gửi: học sinh, phụ huynh đã được báo cập nhật." };
}

export async function sendEvaluationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ evaluationId: id }), formFields(formData, ["evaluationId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => sendEvaluation(actor, parsed.data.evaluationId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/lop/${result.value}/danh-gia`);
  return { ok: true, message: "Đã gửi đánh giá cho học sinh và phụ huynh." };
}

export async function deleteEvaluationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ evaluationId: id }), formFields(formData, ["evaluationId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteEvaluation(actor, parsed.data.evaluationId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/lop/${result.value}/danh-gia`);
  return { ok: true, message: "Đã xóa bản nháp." };
}
