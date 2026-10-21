"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, formIds, parseForm, runAction } from "@/server/action";
import { requireRole } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { readUploads } from "@/server/files/storage";
import { optionalText } from "@/server/users/schemas";
import {
  addDocumentFiles,
  createDocument,
  deleteDocument,
  deleteDocumentFile,
  setDocumentActive,
  shareDocument,
  unshareDocument,
  updateDocument,
} from "./service";

const id = z.string().min(1).max(40);
const optionalId = z.string().max(40).transform((v) => v || null);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Đường dẫn phải bắt đầu bằng http:// hoặc https://")
  .transform((v) => v || null);

const docSchema = z.object({
  title: z.string().trim().min(3, "Nhập tên tài liệu.").max(200),
  description: optionalText(5000),
  url,
  subjectId: optionalId,
  levelId: optionalId,
  sessionId: optionalId,
  visibleToStudents: z.boolean(),
  visibleToParents: z.boolean(),
});

const FIELDS = ["title", "description", "url", "subjectId", "levelId", "sessionId"];

function docInput(formData: FormData) {
  const visibleToStudents = formData.get("visibleToStudents") === "on";
  const visibleToParents = formData.get("visibleToParents") === "on";
  const fields = { ...formFields(formData, FIELDS), visibleToStudents: visibleToStudents ? "on" : "", visibleToParents: visibleToParents ? "on" : "" };
  return { fields, data: { ...fields, visibleToStudents, visibleToParents } };
}

const revalidateDocs = () => {
  revalidatePath("/tai-lieu", "layout");
  revalidatePath("/quan-ly/tai-lieu", "layout");
};

/** FR-042: tải lên giáo trình / tài liệu / giáo án. */
export async function createDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const kind = z.enum(["CURRICULUM", "MATERIAL", "LESSON_PLAN"]).safeParse(formData.get("kind"));
  if (!kind.success) return { ok: false, message: "Loại tài liệu không hợp lệ." };
  const { fields, data } = docInput(formData);
  const parsed = parseForm(docSchema, data);
  if (!parsed.ok) return { ...parsed.state, values: fields };
  const shareClassIds = formIds(formData, "classIds", 50);
  const result = await runAction(async () => createDocument(actor, { ...parsed.data, kind: kind.data }, await readUploads(formData, "files"), shareClassIds), fields);
  if (!result.ok) return result.state;
  revalidateDocs();
  redirect(`/tai-lieu/${result.value}?thongbao=luu`);
}

export async function updateDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const documentId = String(formData.get("documentId") ?? "");
  if (!id.safeParse(documentId).success) return { ok: false, message: "Tài liệu không hợp lệ." };
  const { fields, data } = docInput(formData);
  const parsed = parseForm(docSchema, data);
  if (!parsed.ok) return { ...parsed.state, values: fields };
  const result = await runAction(() => updateDocument(actor, documentId, parsed.data), fields);
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: "Đã lưu." };
}

export async function setDocumentActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const parsed = parseForm(z.object({ documentId: id, active: z.enum(["1", "0"]) }), formFields(formData, ["documentId", "active"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => setDocumentActive(actor, parsed.data.documentId, parsed.data.active === "1"));
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: parsed.data.active === "1" ? "Đã dùng lại tài liệu." : "Đã ngừng sử dụng tài liệu." };
}

export async function deleteDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const parsed = parseForm(z.object({ documentId: id }), formFields(formData, ["documentId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteDocument(actor, parsed.data.documentId));
  if (!result.ok) return result.state;
  revalidateDocs();
  redirect("/tai-lieu?thongbao=xoa-tai-lieu");
}

export async function addDocumentFilesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const documentId = String(formData.get("documentId") ?? "");
  if (!id.safeParse(documentId).success) return { ok: false, message: "Tài liệu không hợp lệ." };
  const result = await runAction(async () => addDocumentFiles(actor, documentId, await readUploads(formData, "files")));
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: "Đã tải tệp lên." };
}

export async function deleteDocumentFileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const parsed = parseForm(z.object({ documentId: id, fileId: id }), formFields(formData, ["documentId", "fileId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => deleteDocumentFile(actor, parsed.data.documentId, parsed.data.fileId));
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: "Đã xóa tệp." };
}

/** Chia sẻ / phân phối cho lớp. */
export async function shareDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const fields = formFields(formData, ["documentId", "classId"]);
  const parsed = parseForm(z.object({ documentId: id, classId: z.string().min(1, "Chọn lớp.").max(40) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => shareDocument(actor, parsed.data.documentId, parsed.data.classId), fields);
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: "Đã chia sẻ cho lớp." };
}

export async function unshareDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const parsed = parseForm(z.object({ documentId: id, classId: id }), formFields(formData, ["documentId", "classId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => unshareDocument(actor, parsed.data.documentId, parsed.data.classId));
  if (!result.ok) return result.state;
  revalidateDocs();
  return { ok: true, message: "Đã gỡ chia sẻ." };
}
