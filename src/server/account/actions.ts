"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireActor } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { emailField, optionalText, phoneField } from "@/server/users/schemas";
import { readUploads } from "@/server/files/storage";
import { removeMyAvatar, updateMyAvatar, updateMyContact } from "./service";

export async function updateMyContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const fields = formFields(formData, ["email", "phone", "address", "currentPassword"]);
  const parsed = parseForm(z.object({ email: emailField, phone: phoneField, address: optionalText(255), currentPassword: z.string().max(200) }), fields);
  // Không trả mật khẩu về form (DECISION-D13).
  const values = { ...fields, currentPassword: "" };
  if (!parsed.ok) return { ...parsed.state, values };
  const result = await runAction(() => updateMyContact(actor, parsed.data), values);
  if (!result.ok) return result.state;
  revalidatePath("/tai-khoan");
  return { ok: true, message: "Đã cập nhật thông tin liên hệ." };
}

/** FR-051: đổi ảnh đại diện (ô `avatar`, một ảnh — đã thu nhỏ trên trình duyệt). */
export async function updateAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const result = await runAction(async () => updateMyAvatar(actor, await readUploads(formData, "avatar", 1)));
  if (!result.ok) return result.state;
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã cập nhật ảnh đại diện." };
}

export async function removeAvatarAction(): Promise<ActionState> {
  const actor = await requireActor();
  await removeMyAvatar(actor);
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã gỡ ảnh đại diện." };
}
