import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/messaging/auto-refresh";
import { MessageComposer } from "@/components/messaging/message-composer";
import { EmptyState } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { getConversation } from "@/server/messaging/service";
import { orNotFound } from "@/server/page";
import { cn } from "@/lib/format";
import { formatDate, formatTime, vnDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "Trò chuyện" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const c = await orNotFound(getConversation(actor, (await params).id));
  let lastDay = "";

  return (
    <>
      <AutoRefresh seconds={8} />
      <p className="mb-2 text-sm">
        <Link href="/tin-nhan">← Tin nhắn</Link>
      </p>
      <header className="mb-4">
        <h1 className="text-2xl text-primary">{c.title}</h1>
        <p className="text-muted">{c.subtitle ?? (c.otherRole ? ROLE_LABELS[c.otherRole] : "")}</p>
        {c.kind === "CLASS" && <p className="text-sm text-muted">Thành viên: giáo viên, học sinh đang học và phụ huynh của lớp (hệ thống tự cập nhật).</p>}
      </header>
      <section aria-label="Tin nhắn" aria-live="polite" className="space-y-3 pb-4">
        {c.messages.length === 0 && <EmptyState message="Chưa có tin nhắn. Hãy gửi lời chào!" />}
        {c.messages.map((m) => {
          const mine = m.sender.id === actor.id;
          const day = vnDateKey(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs text-muted">{formatDate(m.createdAt)}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[70%]", mine ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-line bg-surface")}>
                  {!mine && (
                    <p className="text-xs font-semibold text-primary">
                      {m.sender.fullName} <span className="font-normal text-muted">· {ROLE_LABELS[m.sender.role]}</span>
                    </p>
                  )}
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={cn("mt-0.5 text-right text-xs", mine ? "text-on-brand-muted" : "text-muted")}>{formatTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>
      <MessageComposer conversationId={c.id} />
    </>
  );
}
