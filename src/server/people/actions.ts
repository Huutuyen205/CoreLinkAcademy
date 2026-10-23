"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { emailField, optionalDate, optionalText, phoneField } from "@/server/users/schemas";
import { updateProfile } from "./service";
import { addAvailability, removeAvailability, reviewIntro, saveMyIntro, setMemberStatus } from "./teacher";

const id = z.string().min(1).max(40);

const profileSchema = z.object({
  userId: id,
  fullName: z.string().trim().min(2, "Nhập họ tên.").max(120),
  email: emailField,
  phone: phoneField,
  dateOfBirth: optionalDate,
  address: optionalText(255),
  memberStatus: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"], { errorMap: () => ({ message: "Chọn trạng thái." }) }),
  profileNote: optionalText(5000),
  expertise: optionalText(200),
  gradeLevel: z.string().transform((v) => (v === "" ? null : Number(v))),
});

const FIELDS = ["userId", "fullName", "email", "phone", "dateOfBirth", "address", "memberStatus", "profileNote", "expertise", "gradeLevel"];

/** FR-036: Admin sửa hồ sơ mọi vai trò; Staff sửa hồ sơ học sinh/phụ huynh. */
export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, FIELDS);
  const parsed = parseForm(profileSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { userId, ...input } = parsed.data;
  const result = await runAction(() => updateProfile(actor, userId, input), fields);
  if (!result.ok) return result.state;
  const base = { TEACHER: "/quan-ly/giao-vien", STUDENT: "/quan-ly/hoc-vien", PARENT: "/quan-ly/phu-huynh" } as Record<string, string>;
  if (base[result.value]) revalidatePath(`${base[result.value]}/${userId}`);
  revalidatePath(`/quan-ly/nguoi-dung/${userId}`);
  return { ok: true, message: "Đã lưu hồ sơ." };
}

/** Admin §3: đổi nhanh trạng thái hoạt động (Đang dạy / Tạm nghỉ / Đã nghỉ) — cũng dùng cho HS/PH. */
export async function setMemberStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ userId: id, status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]) }), formFields(formData, ["userId", "status"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setMemberStatus(actor, parsed.data.userId, parsed.data.status));
  if (!result.ok) return result.state;
  const base = { TEACHER: "/quan-ly/giao-vien", STUDENT: "/quan-ly/hoc-vien", PARENT: "/quan-ly/phu-huynh" } as Record<string, string>;
  if (base[result.value]) revalidatePath(base[result.value]!, "layout");
  return { ok: true, message: "Đã cập nhật trạng thái hoạt động." };
}

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ dạng HH:mm.");

/** GV §2: đăng ký một khung giờ rảnh. */
export async function addAvailabilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["weekday", "startTime", "endTime", "note"]);
  const parsed = parseForm(
    z.object({ weekday: z.coerce.number().int().min(1, "Chọn thứ.").max(7, "Chọn thứ."), startTime: hhmm, endTime: hhmm, note: optionalText(200) }),
    fields,
  );
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => addAvailability(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/ho-so");
  return { ok: true, message: "Đã thêm khung giờ rảnh." };
}

export async function removeAvailabilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const parsed = parseForm(z.object({ slotId: id }), formFields(formData, ["slotId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => removeAvailability(actor, parsed.data.slotId));
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/ho-so");
  return { ok: true, message: "Đã xóa khung giờ." };
}

/** GV §11A: lưu nháp / gửi duyệt hồ sơ giới thiệu (nút `intent`). */
export async function saveMyIntroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("TEACHER");
  const fields = formFields(formData, ["introDraft"]);
  const parsed = parseForm(z.object({ introDraft: z.string().trim().max(3000, "Tối đa 3000 ký tự.") }), fields);
  if (!parsed.ok) return parsed.state;
  const submit = formData.get("intent") === "submit";
  const result = await runAction(() => saveMyIntro(actor, parsed.data.introDraft, submit), fields);
  if (!result.ok) return result.state;
  revalidatePath("/giao-vien/ho-so");
  return { ok: true, message: submit ? "Đã gửi duyệt. Trung tâm sẽ phản hồi qua thông báo." : "Đã lưu bản nháp." };
}

/** Quản lý duyệt / từ chối hồ sơ giới thiệu. */
export async function reviewIntroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["teacherId", "decision", "note"]);
  const parsed = parseForm(z.object({ teacherId: id, decision: z.enum(["approve", "reject"]), note: optionalText(500) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => reviewIntro(actor, parsed.data.teacherId, parsed.data.decision === "approve", parsed.data.note), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/giao-vien/${parsed.data.teacherId}`);
  return { ok: true, message: parsed.data.decision === "approve" ? "Đã duyệt hồ sơ giới thiệu." : "Đã từ chối, giáo viên nhận được thông báo." };
}
