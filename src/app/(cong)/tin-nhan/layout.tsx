import type { ReactNode } from "react";
import { ChatSidebar } from "@/components/messaging/chat-sidebar";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { listContacts, listConversations } from "@/server/messaging/service";

const CONTACT_HINT = {
  ADMIN: "Trung tâm nhắn được cho mọi giáo viên, học sinh, phụ huynh.",
  STAFF: "Trung tâm nhắn được cho mọi giáo viên, học sinh, phụ huynh.",
  TEACHER: "Bạn nhắn được cho trung tâm, học sinh và phụ huynh các lớp mình dạy.",
  STUDENT: "Em nhắn được cho giáo viên, bạn cùng lớp, phụ huynh của em và trung tâm.",
  PARENT: "Bạn nhắn được cho giáo viên, thành viên lớp của con và trung tâm.",
} as const;

// FR-050 (DECISION-D30): bố cục kiểu Zalo — cột trái danh sách cuộc trò chuyện, cột phải nội dung.
export default async function MessagesLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const [{ conversations, unopenedClasses }, contacts] = await Promise.all([listConversations(actor), listContacts(actor)]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      <ChatSidebar
        conversations={conversations.map((c) => ({ ...c, roleLabel: c.otherRole ? ROLE_LABELS[c.otherRole] : null }))}
        unopenedClasses={unopenedClasses}
        contacts={contacts.map((u) => ({ value: u.id, label: `${u.fullName} · ${ROLE_LABELS[u.role]}` }))}
        contactHint={CONTACT_HINT[actor.role]}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
