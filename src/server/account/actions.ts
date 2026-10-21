"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireActor } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { emailField, optionalText, phoneField } from "@/server/users/schemas";
import { updateMyContact } from "./service";

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
