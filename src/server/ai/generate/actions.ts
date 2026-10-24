"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { composeFlashCode, composeKindOf } from "@/lib/ai-compose";
import { formFields, runAction, stringValues } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { fieldErrorsOf } from "@/server/validation";
import { aiStatus } from "@/server/ai/client";
import { composeAndSave, generateContent, saveGenerated, type GenerateResult } from "./service";
import { GENERATE_KINDS } from "./schemas";

const composeSchema = z.object({
  sessionId: z.string().min(1, "Chọn buổi học.").max(40),
  kind: z.enum(GENERATE_KINDS, { errorMap: () => ({ message: "Loại nội dung không hợp lệ." }) }),
  studentId: z.string().max(40).transform((v) => v || null),
  topic: z.string().trim().max(300, "Tối đa 300 ký tự."),
  count: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 1 && v <= 30), "Số câu từ 1 đến 30."),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  notes: z.string().trim().max(1000, "Tối đa 1000 ký tự."),
});

export type ComposeState = ActionState & { result?: GenerateResult };

const invalid = (raw: Record<string, string>, fieldErrors: Record<string, string>): ComposeState => ({
  ok: false,
  message: "Vui lòng kiểm tra lại các ô được đánh dấu.",
  fieldErrors,
  values: stringValues(raw),
});

/**
 * Form soạn bài của từng loại (`/giao-vien/soan-bai/<loại>`): AI soạn → tự lưu NHÁP → chuyển tới trang chi tiết.
 * Riêng slide: chỉ soạn và trả về để xem trước như PowerPoint, lưu bằng `saveSlidesAction`.
 * Chỉ giáo viên của buổi học đó (phụ trách hoặc dạy thay); sai buổi → 404.
 */
export async function composeWithAiAction(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const actor = await requireRole("TEACHER");
  const raw = formFields(formData, ["sessionId", "kind", "forStudent", "studentId", "topic", "count", "difficulty", "notes"]);
  if (raw.difficulty === "") raw.difficulty = "mixed";
  const parsed = composeSchema.safeParse(raw);
  if (!parsed.success) return invalid(raw, fieldErrorsOf(parsed.error));
  const { studentId, ...input } = parsed.data;
  const spec = composeKindOf(input.kind)!;
  if (spec.count && input.count !== null && input.count > spec.count.max) return invalid(raw, { count: `Tối đa ${spec.count.max} câu.` });
  // Form "Đề bổ sung cá nhân" bắt buộc chọn học sinh (không được lặng lẽ lưu thành bài tập cả lớp).
  if (raw.forStudent === "1" && !studentId) return invalid(raw, { studentId: "Chọn học sinh nhận đề." });
  if (studentId && input.kind !== "exercises" && input.kind !== "quiz") return invalid(raw, { studentId: "Loại này không giao riêng cho học sinh." });

  if (spec.preview) {
    const result = await runAction(() => generateContent(actor, input), raw);
    if (!result.ok) return result.state;
    return { ok: true, result: result.value, values: stringValues(raw) };
  }

  const result = await runAction(() => composeAndSave(actor, { ...input, studentId }), raw);
  if (!result.ok) return result.state;
  const { mode, id, kind, mock } = result.value;
  const code = composeFlashCode(kind, mock, mode === "practice");
  redirect(mode === "assignment" ? `/giao-vien/bai-tap/${id}?thongbao=${code}` : mode === "practice" ? `/on-luyen/${id}?thongbao=${code}` : `/tai-lieu/${id}?thongbao=${code}`);
}

const saveSchema = z.object({
  sessionId: z.string().min(1).max(40),
  kind: z.enum(["slides"]),
  payload: z.string().min(2).max(300_000),
});

/** Lưu bộ slide đã xem trước thành tệp PowerPoint riêng của giáo viên rồi mở trang chi tiết tài liệu. Nội dung được kiểm tra lại phía server. */
export async function saveSlidesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = saveSchema.safeParse(formFields(formData, ["sessionId", "kind", "payload"]));
  if (!parsed.success) return { ok: false, message: "Không đọc được nội dung cần lưu. Vui lòng soạn lại." };
  let data: unknown;
  try {
    data = JSON.parse(parsed.data.payload);
  } catch {
    return { ok: false, message: "Nội dung không hợp lệ. Vui lòng soạn lại." };
  }
  const result = await runAction(() => saveGenerated(actor, { sessionId: parsed.data.sessionId, kind: parsed.data.kind, data, mode: "document" }));
  if (!result.ok) return result.state;
  redirect(`/tai-lieu/${result.value.id}?thongbao=${composeFlashCode("slides", aiStatus().mock)}`);
}
