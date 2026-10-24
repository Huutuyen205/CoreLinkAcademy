"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { isValidTime, vnToUtc } from "@/lib/time";
import { cancelLeaveRequest, createLeaveRequest, handleLeaveRequest } from "./leave";
import { cancelScheduleRequest, createScheduleRequest, handleScheduleRequest, updateScheduleRequest } from "./schedule";

const id = z.string().min(1).max(40);
const reason = z.string().trim().min(3, "Nhập lý do (ít nhất 3 ký tự).").max(500, "Tối đa 500 ký tự.");
const note = z.string().trim().max(500, "Tối đa 500 ký tự.").transform((v) => v || null);

/* ───────────── Đơn xin nghỉ (phụ huynh) ───────────── */

export async function createLeaveRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("PARENT");
  const fields = formFields(formData, ["studentId", "sessionId", "reason"]);
  const parsed = parseForm(z.object({ studentId: id, sessionId: id, reason }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => createLeaveRequest(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath("/phu-huynh", "layout");
  // Form xin nghỉ ẩn sau khi gửi → báo kết quả bằng Flash.
  redirect(`/phu-huynh/buoi/${parsed.data.sessionId}?con=${parsed.data.studentId}&thongbao=gui-don`);
}

/** PH §2: gửi đơn ngay ở trang Đơn xin nghỉ — ô `target` = "studentId|sessionId". */
export async function createLeaveFromListAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("PARENT");
  const fields = formFields(formData, ["target", "reason"]);
  const parsed = parseForm(z.object({ target: z.string().regex(/^[a-z0-9]{1,40}\|[a-z0-9]{1,40}$/i, "Chọn buổi học."), reason }), fields);
  if (!parsed.ok) return parsed.state;
  const [studentId, sessionId] = parsed.data.target.split("|") as [string, string];
  const result = await runAction(() => createLeaveRequest(actor, { studentId, sessionId, reason: parsed.data.reason }), fields);
  if (!result.ok) return result.state;
  revalidatePath("/phu-huynh", "layout");
  redirect("/phu-huynh/don-nghi?thongbao=gui-don");
}

export async function cancelLeaveRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("PARENT");
  const parsed = parseForm(z.object({ requestId: id }), formFields(formData, ["requestId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => cancelLeaveRequest(actor, parsed.data.requestId));
  if (!result.ok) return result.state;
  revalidatePath("/phu-huynh", "layout");
  return { ok: true, message: "Đã rút đơn." };
}

export async function handleLeaveRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "TEACHER");
  const fields = formFields(formData, ["requestId", "decision", "note"]);
  const parsed = parseForm(z.object({ requestId: id, decision: z.enum(["approve", "reject"]), note }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => handleLeaveRequest(actor, parsed.data.requestId, parsed.data.decision === "approve", parsed.data.note), fields);
  if (!result.ok) return result.state;
  // Đơn đã xử lý rời khỏi danh sách chờ (form biến mất) → báo kết quả bằng Flash sau khi chuyển trang.
  const back = actor.role === "TEACHER" ? "/giao-vien/don" : "/quan-ly/de-xuat";
  revalidatePath(back);
  redirect(`${back}?thongbao=${parsed.data.decision === "approve" ? "duyet-don" : "tu-choi-don"}`);
}

/* ───────────── Đề xuất đổi lịch (giáo viên) ───────────── */

const time = z.string().refine((v) => v === "" || isValidTime(v), "Giờ dạng HH:mm.");
const optionalDate = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Ngày không hợp lệ.");

const requestSchema = z.object({
  type: z.enum(["LEAVE", "RESCHEDULE"], { errorMap: () => ({ message: "Chọn loại đề xuất." }) }),
  date: optionalDate,
  startTime: time,
  endTime: time,
  reason,
});

function proposal(v: z.infer<typeof requestSchema>) {
  const has = v.type === "RESCHEDULE" && v.date && v.startTime && v.endTime;
  return {
    type: v.type,
    reason: v.reason,
    proposedStartsAt: has ? vnToUtc(v.date, v.startTime) : null,
    proposedEndsAt: has ? vnToUtc(v.date, v.endTime) : null,
  };
}

export async function createScheduleRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["sessionId", "type", "date", "startTime", "endTime", "reason"]);
  const parsed = parseForm(requestSchema.extend({ sessionId: id }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => createScheduleRequest(actor, { sessionId: parsed.data.sessionId, ...proposal(parsed.data) }), fields);
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/don");
  return { ok: true, message: "Đã gửi đề xuất cho trung tâm." };
}

export async function updateScheduleRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["requestId", "type", "date", "startTime", "endTime", "reason"]);
  const parsed = parseForm(requestSchema.extend({ requestId: id }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => updateScheduleRequest(actor, parsed.data.requestId, proposal(parsed.data)), fields);
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/don");
  return { ok: true, message: "Đã cập nhật đề xuất." };
}

export async function cancelScheduleRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ requestId: id }), formFields(formData, ["requestId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => cancelScheduleRequest(actor, parsed.data.requestId));
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/don");
  return { ok: true, message: "Đã rút đề xuất." };
}

export async function handleScheduleRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["requestId", "decision", "note", "substituteTeacherId"]);
  const parsed = parseForm(
    z.object({ requestId: id, decision: z.enum(["approve", "reject"]), note, substituteTeacherId: z.string().max(40).transform((v) => v || null) }),
    fields,
  );
  if (!parsed.ok) return parsed.state;
  const { requestId, decision, ...rest } = parsed.data;
  const result = await runAction(() => handleScheduleRequest(actor, requestId, { approve: decision === "approve", ...rest }), fields);
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/de-xuat");
  redirect(`/quan-ly/de-xuat?thongbao=${decision === "approve" ? "duyet-de-xuat" : "tu-choi-de-xuat"}`);
}
