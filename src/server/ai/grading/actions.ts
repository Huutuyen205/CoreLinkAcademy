"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/guard";
import { formFields, parseForm, runAction } from "@/server/action";
import { DomainError, type ActionState } from "@/server/errors";
import { readUploads } from "@/server/files/storage";
import { gradeUngradedWithAi, readAnswerSheet, saveSheetResult, suggestEssayGrades, type SheetReadResult, type SuggestResult } from "./service";

const id = z.string().min(1).max(40);

export type SuggestState = { ok: true; result: SuggestResult } | { ok: false; message: string };

/** Nhờ AI gợi ý điểm tự luận. Không ghi gì vào CSDL — giáo viên xem rồi tự bấm "Lưu điểm" ở form chấm. */
export async function suggestGradesAction(input: { submissionId: string; rubric?: string }): Promise<SuggestState> {
  const actor = await requireRole("TEACHER");
  const parsed = z.object({ submissionId: id, rubric: z.string().max(4000).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Yêu cầu không hợp lệ." };
  const result = await runAction(() => suggestEssayGrades(actor, parsed.data.submissionId, parsed.data.rubric ?? ""));
  return result.ok ? { ok: true, result: result.value } : { ok: false, message: result.state.message ?? "Không gợi ý được." };
}

export type SheetReadState = { ok: true; read: SheetReadResult } | { ok: false; message: string };

/** Bước 1 chấm phiếu giấy: tải ảnh phiếu, AI đọc đáp án (chưa lưu). */
export async function readSheetAction(formData: FormData): Promise<SheetReadState> {
  const actor = await requireRole("TEACHER");
  const assignmentId = id.safeParse(formData.get("assignmentId"));
  if (!assignmentId.success) return { ok: false, message: "Bài tập không hợp lệ." };
  const result = await runAction(async () => {
    const [photo] = await readUploads(formData, "photo", 1);
    if (!photo) throw new DomainError("NO_FILE", "Chọn ảnh phiếu trả lời.", { photo: "Chọn ảnh." });
    return readAnswerSheet(actor, assignmentId.data, photo);
  });
  return result.ok ? { ok: true, read: result.value } : { ok: false, message: result.state.fieldErrors?.photo ?? result.state.message ?? "Không đọc được phiếu." };
}

export type SheetSaveState = { ok: true; message: string } | { ok: false; message: string };

/** Bước 2: giáo viên đã xem/sửa đáp án → lưu bài nộp đã chấm. */
export async function saveSheetAction(formData: FormData): Promise<SheetSaveState> {
  const actor = await requireRole("TEACHER");
  const assignmentId = id.safeParse(formData.get("assignmentId"));
  const studentId = id.safeParse(formData.get("studentId"));
  if (!assignmentId.success || !studentId.success) return { ok: false, message: "Chọn học sinh." };

  const answers: Record<string, number | null> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("ans:") || typeof value !== "string") continue;
    const questionId = key.slice(4);
    if (!id.safeParse(questionId).success) continue;
    answers[questionId] = value === "" ? null : Number(value);
  }
  let aiRead: Record<string, number | null> | null = null;
  try {
    const raw = formData.get("aiRead");
    aiRead = typeof raw === "string" && raw ? (z.record(z.string().max(40), z.number().int().nullable()).parse(JSON.parse(raw)) as Record<string, number | null>) : null;
  } catch {
    aiRead = null;
  }

  const result = await runAction(async () => {
    const [photo] = await readUploads(formData, "photo", 1);
    return saveSheetResult(actor, { assignmentId: assignmentId.data, studentId: studentId.data, answers, photo: photo ?? null, aiRead });
  });
  if (!result.ok) return { ok: false, message: result.state.message ?? "Không lưu được." };
  revalidatePath(`/giao-vien/bai-tap/${assignmentId.data}`, "layout");
  const score = result.value.score.toString().replace(".", ",");
  return { ok: true, message: `Đã chấm xong: ${score} điểm. Kết quả hiện cho học sinh sau khi bạn công bố điểm.` };
}

/** Nút "AI chấm" (DECISION-D44): AI chấm mọi bài đã nộp nhưng chưa chấm của bài tập; giáo viên xem lại ở mục Bài nộp. */
export async function aiGradeUngradedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ assignmentId: id }), formFields(formData, ["assignmentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => gradeUngradedWithAi(actor, parsed.data.assignmentId));
  if (!result.ok) return result.state;
  revalidatePath(`/giao-vien/bai-tap/${parsed.data.assignmentId}`, "layout");
  const r = result.value;
  const parts = [`AI đã chấm ${r.graded} bài${r.mock ? " (chế độ mẫu, điểm giả lập)" : ""}.`];
  if (r.needTeacher > 0) parts.push(`${r.needTeacher} bài AI không đọc được, hãy chấm ở mục Bài nộp.`);
  if (r.remaining > 0) parts.push(`Còn ${r.remaining} bài chưa chấm${r.stoppedReason ? ` (${r.stoppedReason})` : ""} — bấm lại để chấm tiếp.`);
  else if (r.graded > 0) parts.push("Vào mục Bài nộp để xem lại và sửa điểm trước khi công bố.");
  return { ok: r.graded > 0 || r.remaining === 0, message: parts.join(" ") };
}
