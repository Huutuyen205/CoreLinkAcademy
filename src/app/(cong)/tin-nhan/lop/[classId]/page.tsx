import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/guard";
import { openClassConversation } from "@/server/messaging/service";
import { orNotFound } from "@/server/page";

/** Mở nhóm trao đổi của lớp (tạo lần đầu) rồi chuyển tới cuộc trò chuyện. */
export default async function ClassConversationRedirect({ params }: { params: Promise<{ classId: string }> }) {
  const actor = await requireActor();
  const id = await orNotFound(openClassConversation(actor, (await params).classId));
  redirect(`/tin-nhan/${id}`);
}
