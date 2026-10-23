"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formFields, parseForm, runAction } from "@/server/action";
import { requireActor } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { readUploads } from "@/server/files/storage";
import { askAboutAssignment, MESSAGE_MAX, removeMessage, sendMessage, setMemberMuted, startCenterConversation, startDirectConversation } from "./service";

const id = z.string().min(1).max(40);

/** Gửi tin: chữ và/hoặc ảnh/tệp đính kèm (ô `files`). */
export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const fields = formFields(formData, ["conversationId", "body"]);
  const parsed = parseForm(z.object({ conversationId: id, body: z.string().trim().max(MESSAGE_MAX, `Tối đa ${MESSAGE_MAX} ký tự.`) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(async () => {
    const files = await readUploads(formData, "files");
    await sendMessage(actor, parsed.data.conversationId, parsed.data.body, files);
  }, fields);
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

/** Thu hồi tin của mình / gỡ tin trong nhóm lớp (quản lý, GV phụ trách). */
export async function removeMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = parseForm(z.object({ messageId: id }), formFields(formData, ["messageId"]));
  if (!parsed.ok) return parsed.state;
  const result = await runAction(() => removeMessage(actor, parsed.data.messageId));
  if (!result.ok) return result.state;
  revalidatePath(`/tin-nhan/${result.value}`);
  return { ok: true, message: "Đã thu hồi tin nhắn." };
}

/** Tạm chặn / bỏ chặn thành viên gửi tin trong nhóm lớp. */
export async function setMemberMutedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = parseForm(z.object({ conversationId: id, userId: id, muted: z.enum(["0", "1"]) }), formFields(formData, ["conversationId", "userId", "muted"]));
  if (!parsed.ok) return parsed.state;
  const muted = parsed.data.muted === "1";
  const result = await runAction(() => setMemberMuted(actor, parsed.data.conversationId, parsed.data.userId, muted));
  if (!result.ok) return result.state;
  revalidatePath(`/tin-nhan/${parsed.data.conversationId}`);
  return { ok: true, message: muted ? "Đã tạm chặn gửi tin trong nhóm." : "Đã bỏ chặn." };
}

/** HS "Hỏi bài": gửi câu hỏi cho GV phụ trách, tin gắn thẻ bài tập, rồi mở cuộc trò chuyện. */
export async function askAboutAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const fields = formFields(formData, ["assignmentId", "body"]);
  const parsed = parseForm(z.object({ assignmentId: id, body: z.string().trim().min(1, "Nhập câu hỏi.").max(MESSAGE_MAX, `Tối đa ${MESSAGE_MAX} ký tự.`) }), fields);
  if (!parsed.ok) return parsed.state;
  const result = await runAction(async () => askAboutAssignment(actor, parsed.data.assignmentId, parsed.data.body, await readUploads(formData, "files")), fields);
  if (!result.ok) return result.state;
  redirect(`/tin-nhan/${result.value}`);
}

/** PH/HS/GV "Nhắn trung tâm" (form thường, không cần state). */
export async function startCenterConversationAction(): Promise<void> {
  const actor = await requireActor();
  redirect(`/tin-nhan/${await startCenterConversation(actor)}`);
}

/** Nút nhắn nhanh một người (form thường: `userId`). */
export async function openDirectAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const userId = String(formData.get("userId") ?? "");
  if (!id.safeParse(userId).success) return;
  redirect(`/tin-nhan/${await startDirectConversation(actor, userId)}`);
}
