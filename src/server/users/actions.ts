"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { normalizePhone } from "@/lib/phone";
import { parseStudentImport } from "./import";
import { createUser, importStudents, linkGuardian, resetPassword, setUserStatus, unlinkGuardian, updateUser } from "./service";

const id = z.string().min(1).max(40);
const ROLES = ["ADMIN", "STAFF", "TEACHER", "STUDENT", "PARENT"] as const;

const userSchema = z
  .object({
    fullName: z.string().trim().min(2, "Nhập họ tên.").max(120),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(191)
      .pipe(z.union([z.literal(""), z.string().email("Email không hợp lệ.")]))
      .transform((v) => v || null),
    phone: z
      .string()
      .trim()
      .max(20)
      .transform((v, ctx) => {
        if (!v) return null;
        const p = normalizePhone(v);
        if (!p) {
          ctx.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
          return z.NEVER;
        }
        return p;
      }),
    role: z.enum(ROLES, { errorMap: () => ({ message: "Chọn vai trò." }) }),
    gradeLevel: z.string().transform((v) => (v ? Number(v) : null)),
  })
  .superRefine((v, ctx) => {
    if (v.role === "STUDENT" && (v.gradeLevel === null || !Number.isInteger(v.gradeLevel) || v.gradeLevel < 1 || v.gradeLevel > 12)) {
      ctx.addIssue({ code: "custom", path: ["gradeLevel"], message: "Chọn khối lớp cho học sinh." });
    }
  });

const USER_FIELDS = ["fullName", "email", "phone", "role", "gradeLevel"];

export type CreateUserState = ActionState & { credential?: { fullName: string; login: string; password: string; studentCode: string | null } };

/** API-008: Admin tạo mọi vai trò; Staff chỉ tạo học sinh/phụ huynh. */
export async function createUserAction(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, USER_FIELDS);
  const parsed = parseForm(userSchema, fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => createUser(actor, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/nguoi-dung");
  revalidatePath("/quan-ly/hoc-vien");
  return {
    ok: true,
    message: "Đã tạo tài khoản.",
    credential: { fullName: parsed.data.fullName, login: result.value.login, password: result.value.password, studentCode: result.value.studentCode },
  };
}

export async function updateUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  if (!id.safeParse(userId).success) return { ok: false, message: "Người dùng không hợp lệ." };
  const fields = formFields(formData, USER_FIELDS);
  const parsed = parseForm(userSchema, fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => updateUser(actor, userId, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/nguoi-dung/${userId}`);
  return { ok: true, message: "Đã lưu thông tin." };
}

export async function setUserStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const parsed = parseForm(z.object({ userId: id, status: z.enum(["ACTIVE", "DISABLED"]) }), formFields(formData, ["userId", "status"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setUserStatus(actor, parsed.data.userId, parsed.data.status));
  if (!result.ok) return result.state;
  revalidatePath(`/quan-ly/nguoi-dung/${parsed.data.userId}`);
  return { ok: true, message: parsed.data.status === "DISABLED" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản." };
}

export type ResetState = ActionState & { password?: string; login?: string };

export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const actor = await requireRole("ADMIN");
  const parsed = parseForm(z.object({ userId: id }), formFields(formData, ["userId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => resetPassword(actor, parsed.data.userId));
  if (!result.ok) return result.state;
  return { ok: true, message: "Đã đặt lại mật khẩu tạm.", ...result.value };
}

/** API-009 — FR-014. */
export async function linkGuardianAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const fields = formFields(formData, ["parentId", "studentId"]);
  const parsed = parseForm(z.object({ parentId: z.string().min(1, "Chọn phụ huynh.").max(40), studentId: id }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => linkGuardian(actor, parsed.data.parentId, parsed.data.studentId), fields);
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/hoc-vien", "layout");
  revalidatePath("/quan-ly/phu-huynh", "layout");
  revalidatePath(`/quan-ly/nguoi-dung/${parsed.data.studentId}`);
  return { ok: true, message: "Đã liên kết phụ huynh." };
}

export async function unlinkGuardianAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const parsed = parseForm(z.object({ parentId: id, studentId: id }), formFields(formData, ["parentId", "studentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => unlinkGuardian(actor, parsed.data.parentId, parsed.data.studentId));
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/hoc-vien", "layout");
  revalidatePath("/quan-ly/phu-huynh", "layout");
  revalidatePath(`/quan-ly/nguoi-dung/${parsed.data.studentId}`);
  return { ok: true, message: "Đã bỏ liên kết." };
}

export type ImportState = ActionState & { credentials?: { fullName: string; studentCode: string; login: string; password: string }[] };

/** Admin §2 — FR-036: nhập danh sách học sinh hàng loạt. */
export async function importStudentsAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const actor = await requireRole("ADMIN", "STAFF");
  const text = String(formData.get("data") ?? "").slice(0, 50_000);
  const { rows, errors } = parseStudentImport(text);
  if (errors.length > 0) return { ok: false, message: "Dữ liệu chưa hợp lệ. Chưa nhập dòng nào.", details: errors.slice(0, 30), values: { data: text } };
  const result = await runAction(() => importStudents(actor, rows), { data: text });
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/hoc-vien");
  return { ok: true, message: `Đã tạo ${result.value.length} tài khoản học sinh.`, credentials: result.value };
}
