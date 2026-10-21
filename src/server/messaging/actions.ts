"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireActor } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { MESSAGE_MAX, sendMessage, startDirectConversation } from "./service";

const id = z.string().min(1).max(40);

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const fields = formFields(formData, ["conversationId", "body"]);
  const parsed = parseForm(z.object({ conversationId: id, body: z.string().trim().min(1, "Nhập tin nhắn.").max(MESSAGE_MAX, `Tối đa ${MESSAGE_MAX} ký tự.`) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => sendMessage(actor, parsed.data.conversationId, parsed.data.body), fields);
  if (!result.ok) return result.state;
  revalidatePath(`/tin-nhan/${parsed.data.conversationId}`);
  return { ok: true };
}

export async function startConversationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = parseForm(z.object({ userId: z.string().min(1, "Chọn người nhận.").max(40) }), formFields(formData, ["userId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => startDirectConversation(actor, parsed.data.userId));
  if (!result.ok) return result.state;
  redirect(`/tin-nhan/${result.value}`);
}
