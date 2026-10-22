"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, formIds, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import type { ActionState } from "@/server/errors";
import { isValidTime, vnToUtc } from "@/lib/time";
import {
  cancelSession,
  createClass,
  deleteClass,
  enrollStudent,
  rescheduleSession,
  setClassStatus,
  setEnrollmentStatus,
} from "./service";

const id = z.string().min(1).max(40);
const time = z.string().refine(isValidTime, "Giờ dạng HH:mm.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày.");

const classSchema = z
  .object({
    courseId: z.string().min(1, "Chọn khóa học.").max(40),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, "Nhập mã lớp.")
      .max(30)
      .regex(/^[A-Z0-9._-]+$/, "Mã lớp chỉ gồm chữ không dấu, số, dấu chấm, gạch."),
    teacherId: z.string().min(1, "Chọn giáo viên.").max(40),
    roomId: z.string().max(40).transform((v) => v || null),
    startDate: date,
    weekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "Chọn ít nhất một thứ trong tuần."),
    startTime: time,
    endTime: time,
    totalSessions: z.coerce.number({ invalid_type_error: "Nhập số buổi." }).int().min(1, "Ít nhất 1 buổi.").max(200, "Tối đa 200 buổi."),
    capacity: z.coerce.number({ invalid_type_error: "Nhập sĩ số." }).int().min(1, "Ít nhất 1.").max(100, "Tối đa 100."),
  })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "Giờ kết thúc phải sau giờ bắt đầu." });

/** API-011 — FR-017, FR-018. */
export async function createClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["courseId", "code", "teacherId", "roomId", "startDate", "startTime", "endTime", "totalSessions", "capacity"]);
  const weekdays = [...new Set(formData.getAll("weekdays").map(String))].slice(0, 7);
  const values = { ...fields, weekdays: weekdays.join(",") };
  const parsed = parseForm(classSchema, { ...fields, weekdays });
  if (!parsed.ok) return { ...parsed.state, values };
  const result = await runAction(() => createClass(actor, { ...parsed.data, weekdays: [...new Set(parsed.data.weekdays)].sort() }), values);
  if (!result.ok) return result.state;
  invalidate(CACHE_TAGS.dashboard);
  revalidatePath("/quan-ly/lop");
  redirect(`/quan-ly/lop/${result.value}?thongbao=tao-lop`);
}

const CLASS_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

/** API-012. */
export async function setClassStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ classId: id, status: z.enum(CLASS_STATUSES, { errorMap: () => ({ message: "Chọn trạng thái." }) }) }), formFields(formData, ["classId", "status"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setClassStatus(actor, parsed.data.classId, parsed.data.status));
  if (!result.ok) return result.state;
  invalidate(CACHE_TAGS.dashboard);
  revalidatePath(`/quan-ly/lop/${parsed.data.classId}`);
  return { ok: true, message: "Đã cập nhật trạng thái lớp." };
}

/** Hủy lớp (kèm lý do tùy chọn): các buổi chưa học bị hủy, thành viên lớp nhận thông báo. */
export async function cancelClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ classId: id, reason: z.string().trim().max(200) }), formFields(formData, ["classId", "reason"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setClassStatus(actor, parsed.data.classId, "CANCELLED", parsed.data.reason || null));
  if (!result.ok) return result.state;
  invalidate(CACHE_TAGS.dashboard);
  revalidatePath("/quan-ly/lop", "layout");
  return { ok: true, message: "Đã hủy lớp." };
}

export async function deleteClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ classId: id }), formFields(formData, ["classId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteClass(actor, parsed.data.classId));
  if (!result.ok) return result.state;
  invalidate(CACHE_TAGS.dashboard);
  revalidatePath("/quan-ly/lop");
  redirect("/quan-ly/lop?thongbao=xoa-lop");
}

/** API-013 — FR-019. Ghi danh nhiều học sinh một lần; dừng ở học sinh đầu tiên lỗi. */
export async function enrollStudentsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const classId = formFields(formData, ["classId"]).classId!;
  const studentIds = formIds(formData, "studentIds", 50);
  if (!id.safeParse(classId).success) return { ok: false, message: "Lớp không hợp lệ." };
  if (studentIds.length === 0) return { ok: false, message: "Chọn ít nhất một học sinh.", fieldErrors: { studentIds: "Chọn ít nhất một học sinh." } };

  let done = 0;
  for (const studentId of studentIds) {
    const result = await runAction(() => enrollStudent(actor, classId, studentId));
    if (!result.ok) {
      revalidatePath(`/quan-ly/lop/${classId}`);
      return { ...result.state, message: `${done > 0 ? `Đã ghi danh ${done} học sinh. ` : ""}Dừng lại: ${result.state.message}` };
    }
    done++;
  }
  revalidatePath(`/quan-ly/lop/${classId}`);
  return { ok: true, message: `Đã ghi danh ${done} học sinh.` };
}

const ENROLLMENT_STATUSES = ["ACTIVE", "PAUSED", "DROPPED", "COMPLETED"] as const;

/** API-013 — FR-020. */
export async function setEnrollmentStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ enrollmentId: id, status: z.enum(ENROLLMENT_STATUSES) }), formFields(formData, ["enrollmentId", "status"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setEnrollmentStatus(actor, parsed.data.enrollmentId, parsed.data.status));
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${result.value}`);
  revalidatePath("/quan-ly/hoc-vien", "layout");
  return { ok: true, message: "Đã cập nhật." };
}

const reason = z.string().trim().min(3, "Nhập lý do.").max(255, "Tối đa 255 ký tự.");

/** API-014 — FR-021. */
export async function cancelSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["sessionId", "reason"]);
  const parsed = parseForm(z.object({ sessionId: id, reason }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => cancelSession(actor, parsed.data.sessionId, parsed.data.reason), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${result.value}`);
  return { ok: true, message: "Đã hủy buổi học." };
}

const rescheduleSchema = z
  .object({ sessionId: id, date, startTime: time, endTime: time, reason })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "Giờ kết thúc phải sau giờ bắt đầu." });

/** API-014 — FR-021: dời buổi, kiểm tra trùng lịch. */
export async function rescheduleSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["sessionId", "date", "startTime", "endTime", "reason"]);
  const parsed = parseForm(rescheduleSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { sessionId, date: d, startTime, endTime, reason: r } = parsed.data;
  const startsAt = vnToUtc(d, startTime);
  if (startsAt <= new Date()) return { ok: false, message: "Thời gian mới phải ở tương lai.", fieldErrors: { date: "Chọn thời điểm trong tương lai." }, values: fields };
  const result = await runAction(() => rescheduleSession(actor, sessionId, startsAt, vnToUtc(d, endTime), r), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${result.value}`);
  return { ok: true, message: "Đã dời buổi học." };
}
