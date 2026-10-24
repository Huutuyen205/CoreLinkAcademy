"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import type { ActionState } from "@/server/errors";
import { isValidTime, vnToUtc } from "@/lib/time";
import { addMakeupSession, assignSessionTeacher, setSessionRoom, transferStudent, updateClass } from "./operations";

const id = z.string().min(1).max(40);
const optionalId = z.string().max(40).transform((v) => v || null);
const time = z.string().refine(isValidTime, "Giờ dạng HH:mm.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày.");
const note = z.string().trim().max(255, "Tối đa 255 ký tự.").transform((v) => v || null);

const classUpdateSchema = z.object({
  classId: id,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Nhập mã lớp.")
    .max(30)
    .regex(/^[A-Z0-9._-]+$/, "Mã lớp chỉ gồm chữ không dấu, số, dấu chấm, gạch."),
  teacherId: z.string().min(1, "Chọn giáo viên.").max(40),
  roomId: optionalId,
  capacity: z.coerce.number({ invalid_type_error: "Nhập sĩ số." }).int().min(1, "Ít nhất 1.").max(100, "Tối đa 100."),
});

/** FR-037: sửa lớp, phân công giáo viên phụ trách, đổi phòng. */
export async function updateClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["classId", "code", "teacherId", "roomId", "capacity"]);
  const parsed = parseForm(classUpdateSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { classId, ...input } = parsed.data;
  const result = await runAction(() => updateClass(actor, classId, input), fields);
  if (!result.ok) return result.state;
  invalidate(CACHE_TAGS.dashboard);
  revalidatePath(`/quan-ly/lop/${classId}`);
  return { ok: true, message: "Đã lưu thông tin lớp. Các buổi sắp tới đã được cập nhật." };
}

/** FR-038: phân công giáo viên dạy một buổi. */
export async function assignSessionTeacherAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["sessionId", "teacherId", "note"]);
  const parsed = parseForm(z.object({ sessionId: id, teacherId: z.string().min(1, "Chọn giáo viên.").max(40), note }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => assignSessionTeacher(actor, parsed.data.sessionId, parsed.data.teacherId, parsed.data.note), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${result.value}`);
  return { ok: true, message: "Đã phân công giáo viên cho buổi học." };
}

const makeupSchema = z
  .object({ classId: id, date, startTime: time, endTime: time, teacherId: optionalId, roomId: optionalId, note })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "Giờ kết thúc phải sau giờ bắt đầu." });

/** FR-038: xếp lịch học bù. */
export async function addMakeupSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["classId", "date", "startTime", "endTime", "teacherId", "roomId", "note"]);
  const parsed = parseForm(makeupSchema, fields);
  if (!parsed.ok) return parsed.state;
  const v = parsed.data;
  const result = await runAction(
    () => addMakeupSession(actor, v.classId, { startsAt: vnToUtc(v.date, v.startTime), endsAt: vnToUtc(v.date, v.endTime), teacherId: v.teacherId, roomId: v.roomId, note: v.note }),
    fields,
  );
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${v.classId}`);
  return { ok: true, message: "Đã thêm buổi học bù và thông báo cho lớp." };
}

/** Admin §2: chuyển học sinh sang lớp khác. */
export async function transferStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["enrollmentId", "toClassId"]);
  const parsed = parseForm(z.object({ enrollmentId: id, toClassId: z.string().min(1, "Chọn lớp mới.").max(40) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => transferStudent(actor, parsed.data.enrollmentId, parsed.data.toClassId), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/hoc-vien/${result.value.studentId}`);
  return { ok: true, message: "Đã chuyển lớp." };
}

/** Admin §7: đổi phòng cho một buổi. */
export async function setSessionRoomAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["sessionId", "roomId"]);
  const parsed = parseForm(z.object({ sessionId: id, roomId: optionalId }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setSessionRoom(actor, parsed.data.sessionId, parsed.data.roomId), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/lop/${result.value}`);
  revalidatePath(`/quan-ly/buoi/${parsed.data.sessionId}`);
  return { ok: true, message: "Đã đổi phòng cho buổi học. Lớp đã nhận thông báo." };
}
