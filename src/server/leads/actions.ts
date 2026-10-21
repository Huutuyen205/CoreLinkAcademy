"use server";

import type { LeadStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { hitRateLimit } from "@/server/rate-limit/limiter";
import { clientIp } from "@/server/request";
import { convertLeadSchema, manualLeadSchema, trialRequestSchema } from "./schemas";
import {
  addLeadNote,
  changeLeadStatus,
  convertLead,
  createManualLead,
  DuplicateOpenLeadError,
  submitTrialRequest,
  type IssuedCredential,
} from "./service";

const THANK_YOU = "/dang-ky-hoc-thu/cam-on";

/** API-001 — FR-004, FR-005. Không cần đăng nhập. */
export async function submitTrialRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: bot điền ô ẩn → báo thành công giả, không lưu.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") redirect(THANK_YOU);

  const fields = formFields(formData, ["parentName", "phone", "email", "studentName", "gradeLevel", "subjectId", "courseSlug", "note"]);
  if (!(await hitRateLimit(`trial:${await clientIp()}`))) {
    return { ok: false, message: "Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút.", values: fields };
  }
  const parsed = parseForm(trialRequestSchema, { ...fields, consent: formData.get("consent") ?? undefined });
  if (!parsed.ok) return parsed.state;

  const result = await runAction(() => submitTrialRequest(parsed.data), fields);
  if (!result.ok) return result.state;
  redirect(THANK_YOU);
}

export type CreateLeadState = ActionState & { existingLeadId?: string };

/** API-021 — FR-006: Staff/Admin nhập lead tay. Trùng lead đang mở → trả id lead cũ (BR-011). */
export async function createLeadAction(_prev: CreateLeadState, formData: FormData): Promise<CreateLeadState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["source", "parentName", "phone", "email", "studentName", "gradeLevel", "subjectId", "courseSlug", "note"]);
  const parsed = parseForm(manualLeadSchema, fields);
  if (!parsed.ok) return parsed.state;

  let existingLeadId: string | undefined;
  const result = await runAction(
    () =>
      createManualLead(actor, parsed.data).catch((error: unknown) => {
        if (error instanceof DuplicateOpenLeadError) existingLeadId = error.existingLeadId;
        throw error;
      }),
    fields,
  );
  if (!result.ok) return { ...result.state, existingLeadId };
  revalidatePath("/quan-ly/lead");
  redirect(`/quan-ly/lead/${result.value}?thongbao=tao-lead`);
}

const LEAD_STATUSES =["NEW", "CONTACTED", "TRIAL_SCHEDULED", "TRIAL_DONE", "ENROLLED", "LOST"] as const;

const statusSchema = z.object({
  leadId: z.string().min(1).max(40),
  status: z.enum(LEAD_STATUSES, { errorMap: () => ({ message: "Chọn trạng thái." }) }),
  lostReason: z.string().trim().max(255, "Tối đa 255 ký tự."),
});

/** API-002 — FR-007. */
export async function changeLeadStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(statusSchema, formFields(formData, ["leadId", "status", "lostReason"]));
  if (!parsed.ok) return parsed.state;
  const { leadId, status, lostReason } = parsed.data;

  const result = await runAction(() => changeLeadStatus(actor, leadId, status as LeadStatus, lostReason || null), { lostReason });
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lead/${leadId}`);
  return { ok: true, message: "Đã cập nhật trạng thái." };
}

const noteSchema = z.object({
  leadId: z.string().min(1).max(40),
  content: z.string().trim().min(1, "Nhập nội dung ghi chú.").max(2000, "Tối đa 2000 ký tự."),
});

/** API-003 — FR-008. */
export async function addLeadNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(noteSchema, formFields(formData, ["leadId", "content"]));
  if (!parsed.ok) return parsed.state;

  const result = await runAction(() => addLeadNote(actor, parsed.data.leadId, parsed.data.content));
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lead/${parsed.data.leadId}`);
  return { ok: true, message: "Đã thêm ghi chú." };
}

export type ConvertState = ActionState & { credentials?: IssuedCredential[]; studentCode?: string; studentId?: string };

/** API-004 — FR-009. Mật khẩu tạm chỉ trả về trong state của lần gửi này (hiển thị một lần). */
export async function convertLeadAction(_prev: ConvertState, formData: FormData): Promise<ConvertState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, [
    "leadId",
    "studentName",
    "gradeLevel",
    "studentEmail",
    "studentPhone",
    "parentName",
    "parentPhone",
    "parentEmail",
    "classId",
  ]);
  const parsed = parseForm(convertLeadSchema, fields);
  if (!parsed.ok) return parsed.state;
  const classId = fields.classId && fields.classId.length <= 40 ? fields.classId : null;

  const result = await runAction(() => convertLead(actor, { ...parsed.data, classId }), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lead/${parsed.data.leadId}`);
  revalidatePath("/quan-ly/lead");
  return { ok: true, message: "Đã chuyển thành học viên.", ...result.value };
}
