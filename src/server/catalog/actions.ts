"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { deleteCourse, deleteRoom, deleteSubject, saveCourse, saveRoom, saveSubject } from "./admin";

const optionalId = z.string().max(40).transform((v) => v || null);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Nhập slug.")
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
const int = (min: number, max: number, label: string) =>
  z.coerce.number({ invalid_type_error: `Nhập ${label}.` }).int(`${label} phải là số nguyên.`).min(min, `${label} tối thiểu ${min}.`).max(max, `${label} tối đa ${max}.`);

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

const subjectSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(2, "Nhập tên môn.").max(80),
  slug: slug.max(80),
  description: z.string().trim().max(2000),
  sortOrder: int(0, 999, "Thứ tự"),
});

export async function saveSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["id", "name", "slug", "description", "sortOrder"]);
  const parsed = parseForm(subjectSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { id, ...data } = parsed.data;
  const result = await runAction(() => saveSubject(actor, id, data), fields);
  if (!result.ok) return result.state;
  revalidateCatalog();
  return { ok: true, message: id ? "Đã lưu môn học." : "Đã thêm môn học." };
}

/** API-022 — FR-015. */
export async function deleteSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id || id.length > 40) return { ok: false, message: "Môn học không hợp lệ." };
  const result = await runAction(() => deleteSubject(actor, id));
  if (!result.ok) return result.state;
  revalidateCatalog();
  return { ok: true, message: "Đã xóa môn học." };
}

const courseSchema = z
  .object({
    id: optionalId,
    subjectId: z.string().min(1, "Chọn môn.").max(40),
    title: z.string().trim().min(3, "Nhập tên khóa.").max(160),
    slug,
    summary: z.string().trim().min(10, "Nhập tóm tắt (ít nhất 10 ký tự).").max(300),
    description: z.string().trim().min(10, "Nhập mô tả.").max(10000),
    gradeFrom: int(1, 12, "Khối từ"),
    gradeTo: int(1, 12, "Khối đến"),
    level: z.string().trim().min(1, "Nhập trình độ.").max(60),
    totalSessions: int(1, 500, "Số buổi"),
    sessionMinutes: int(15, 300, "Số phút/buổi"),
    tuitionVnd: z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (!v) return null;
        const n = Number(v.replace(/[.,\s]/g, ""));
        if (!Number.isInteger(n) || n < 0 || n > 1_000_000_000) {
          ctx.addIssue({ code: "custom", message: "Học phí không hợp lệ." });
          return z.NEVER;
        }
        return n;
      }),
    outcomes: z.string().max(5000).transform((v) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)),
    syllabus: z
      .string()
      .max(10000)
      .transform((v) =>
        v
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [title, ...rest] = line.split("|");
            return { title: title!.trim(), detail: rest.join("|").trim() };
          }),
      ),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  })
  .refine((v) => v.gradeFrom <= v.gradeTo, { path: ["gradeTo"], message: "Khối đến phải ≥ khối từ." });

const COURSE_FIELDS = ["id", "subjectId", "title", "slug", "summary", "description", "gradeFrom", "gradeTo", "level", "totalSessions", "sessionMinutes", "tuitionVnd", "outcomes", "syllabus"];

/** API-010 — FR-015. Mục tiêu: mỗi dòng một ý; lộ trình: mỗi dòng "Tiêu đề | chi tiết". */
export async function saveCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, COURSE_FIELDS);
  const isPublished = formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  // Giá trị checkbox trả lại để form giữ trạng thái khi lỗi (GAP-08).
  const values = { ...fields, isPublished: isPublished ? "on" : "", isFeatured: isFeatured ? "on" : "" };
  const parsed = parseForm(courseSchema, { ...fields, isPublished, isFeatured });
  if (!parsed.ok) return { ...parsed.state, values };
  const { id, ...data } = parsed.data;
  const result = await runAction(() => saveCourse(actor, id, data), values);
  if (!result.ok) return result.state;
  revalidateCatalog();
  if (!id) redirect(`/quan-ly/khoa-hoc/${result.value}?thongbao=luu`);
  return { ok: true, message: "Đã lưu khóa học." };
}

export async function deleteCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id || id.length > 40) return { ok: false, message: "Khóa học không hợp lệ." };
  const result = await runAction(() => deleteCourse(actor, id));
  if (!result.ok) return result.state;
  revalidateCatalog();
  redirect("/quan-ly/khoa-hoc?thongbao=xoa-khoa");
}

const roomSchema = z.object({ id: optionalId, name: z.string().trim().min(1, "Nhập tên phòng.").max(60), capacity: int(1, 500, "Sức chứa") });

export async function saveRoomAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const fields = formFields(formData, ["id", "name", "capacity"]);
  const parsed = parseForm(roomSchema, fields);
  if (!parsed.ok) return parsed.state;
  const { id, ...data } = parsed.data;
  const result = await runAction(() => saveRoom(actor, id, data), fields);
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/phong");
  return { ok: true, message: id ? "Đã lưu phòng." : "Đã thêm phòng." };
}

export async function deleteRoomAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id || id.length > 40) return { ok: false, message: "Phòng không hợp lệ." };
  const result = await runAction(() => deleteRoom(actor, id));
  if (!result.ok) return result.state;
  revalidatePath("/quan-ly/phong");
  return { ok: true, message: "Đã xóa phòng." };
}
