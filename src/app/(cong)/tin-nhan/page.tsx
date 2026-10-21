import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { ConfigForm } from "@/components/forms/config-form";
import { AutoRefresh } from "@/components/messaging/auto-refresh";
import { buttonClass } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { startConversationAction } from "@/server/messaging/actions";
import { listContacts, listConversations } from "@/server/messaging/service";
import { cn } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tin nhắn" };

// FR-050: danh sách cuộc trò chuyện, nhóm lớp, tìm kiếm, bắt đầu tin nhắn mới.
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await requireActor();
  const q = (await searchParams).q?.slice(0, 80);
  const [{ conversations, unopenedClasses }, contacts] = await Promise.all([listConversations(actor, q), listContacts(actor)]);

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader
        title="Tin nhắn"
        description={actor.role === "STUDENT" ? "Trao đổi trong nhóm lớp của em." : "Nhóm trao đổi theo lớp và tin nhắn riêng."}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <form method="get" className="flex items-end gap-2">
            <TextField name="q" label="Tìm theo tên, lớp hoặc nội dung" defaultValue={q} maxLength={80} className="flex-1" />
            <button type="submit" className={buttonClass("secondary")}>
              Tìm
            </button>
          </form>
          {conversations.length === 0 && unopenedClasses.length === 0 ? (
            <EmptyState message={q ? "Không tìm thấy cuộc trò chuyện." : "Chưa có cuộc trò chuyện nào."} />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-block border border-line bg-surface">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link href={`/tin-nhan/${c.id}`} className={cn("flex items-center gap-3 px-4 py-3 text-ink no-underline hover:bg-paper", c.unread > 0 && "bg-primary-soft/40")}>
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full font-semibold", c.kind === "CLASS" ? "bg-primary text-white" : "bg-brand-tint text-primary")}>
                      {c.kind === "CLASS" ? <Users className="size-5" aria-hidden="true" /> : c.title.trim().split(/\s+/).pop()?.[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate", c.unread > 0 && "font-semibold")}>
                          {c.title}
                          {c.otherRole && <span className="text-sm font-normal text-muted"> · {ROLE_LABELS[c.otherRole]}</span>}
                        </span>
                        {c.last && <span className="shrink-0 text-xs text-muted">{formatDateTime(c.last.createdAt)}</span>}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-muted">
                          {c.last ? `${c.last.senderId === actor.id ? "Bạn" : c.last.sender.fullName}: ${c.last.body}` : "Chưa có tin nhắn"}
                        </span>
                        {c.unread > 0 && <span className="shrink-0 rounded-full bg-primary px-2 text-xs font-bold leading-5 text-white">{c.unread}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {unopenedClasses.map((k) => (
                <li key={k.classId}>
                  <Link href={`/tin-nhan/lop/${k.classId}`} className="flex items-center gap-3 px-4 py-3 text-ink no-underline hover:bg-paper">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/80 text-white">
                      <Users className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{k.title}</span>
                      <span className="block truncate text-sm text-muted">{k.subtitle} · chưa có tin nhắn</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {contacts.length > 0 && (
          <Card title="Tin nhắn mới">
            <ConfigForm
              action={startConversationAction}
              submitLabel="Mở cuộc trò chuyện"
              fields={[
                {
                  type: "select",
                  name: "userId",
                  label: "Người nhận",
                  required: true,
                  placeholder: "Chọn người nhận",
                  options: contacts.map((u) => ({ value: u.id, label: `${u.fullName} · ${ROLE_LABELS[u.role]}` })),
                },
              ]}
            />
            <p className="mt-3 text-sm text-muted">
              {actor.role === "PARENT"
                ? "Bạn nhắn được cho giáo viên của con và trung tâm."
                : actor.role === "TEACHER"
                  ? "Bạn nhắn được cho trung tâm và phụ huynh học sinh lớp mình."
                  : "Trung tâm nhắn được cho giáo viên và phụ huynh."}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
