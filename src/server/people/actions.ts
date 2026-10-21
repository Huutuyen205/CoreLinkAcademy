"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { emailField, optionalDate, optionalText, phoneField } from "@/server/users/schemas";
import { updateProfile } from "./service";

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
