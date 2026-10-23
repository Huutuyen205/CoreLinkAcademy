"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { runAction, stringValues } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { fieldErrorsOf } from "@/server/validation";
import { generateContent, saveGenerated, type GenerateResult } from "./service";
import { GENERATE_KINDS } from "./schemas";

const id = z.string().min(1).max(40);

const generateSchema = z.object({
  sessionId: id,
  kind: z.enum(GENERATE_KINDS, { errorMap: () => ({ message: "Chọn loại nội dung." }) }),
  topic: z.string().trim().max(300, "Tối đa 300 ký tự."),
  count: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 1 && v <= 30), "Số câu từ 1 đến 30."),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  notes: z.string().trim().max(1000, "Tối đa 1000 ký tự."),
});

export type GenerateState = ActionState & { result?: GenerateResult };

/** Bước 1: AI soạn nội dung (chưa lưu gì). Chỉ giáo viên của buổi học đó; sai buổi → 404. */
export async function generateContentAction(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const actor = await requireRole("TEACHER");
  const raw: Record<string, string> = {};
  for (const name of ["sessionId", "kind", "topic", "count", "difficulty", "notes"]) {
    const v = formData.get(name);
    raw[name] = typeof v === "string" ? v : "";
  }
  const parsed = generateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Vui lòng kiểm tra lại các ô được đánh dấu.", fieldErrors: fieldErrorsOf(parsed.error), values: stringValues(raw) };
  const result = await runAction(() => generateContent(actor, parsed.data), raw);
  if (!result.ok) return result.state;
  return { ok: true, result: result.value, values: stringValues(raw) };
}

const saveSchema = z.object({
  sessionId: id,
  kind: z.enum(GENERATE_KINDS),
  mode: z.enum(["assignment", "document"]),
  payload: z.string().min(2).max(300_000),
});

/** Bước 2: lưu thành bài tập NHÁP hoặc tài liệu Word/PowerPoint riêng của giáo viên. Nội dung được kiểm tra lại phía server. */
export async function saveGeneratedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = saveSchema.safeParse({
    sessionId: formData.get("sessionId"),
    kind: formData.get("kind"),
    mode: formData.get("mode"),
    payload: formData.get("payload"),
  });
  if (!parsed.success) return { ok: false, message: "Không đọc được nội dung cần lưu. Vui lòng tạo lại." };
  let data: unknown;
  try {
    data = JSON.parse(parsed.data.payload);
  } catch {
    return { ok: false, message: "Nội dung không hợp lệ. Vui lòng tạo lại." };
  }
  const result = await runAction(() => saveGenerated(actor, { sessionId: parsed.data.sessionId, kind: parsed.data.kind, data, mode: parsed.data.mode }));
  if (!result.ok) return result.state;
  redirect(result.value.mode === "assignment" ? `/giao-vien/bai-tap/${result.value.id}?thongbao=tao-bai-ai` : `/tai-lieu/${result.value.id}`);
}
