"use client";

import { Building2, MessageSquarePlus, Search, TextSearch, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfigForm } from "@/components/forms/config-form";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/format";
import { foldVietnamese } from "@/lib/search";
import { formatChatTime } from "@/lib/time";
import { openDirectAction, startCenterConversationAction, startConversationAction } from "@/server/messaging/actions";

export type ChatListItem = {
  id: string;
  kind: "DIRECT" | "CLASS";
  title: string;
  subtitle: string | null;
  roleLabel: string | null;
  avatarFileId: string | null;
  last: { body: string; createdAt: Date; mine: boolean; senderName: string } | null;
  unread: number;
};

type Props = {
  conversations: ChatListItem[];
  unopenedClasses: { classId: string; title: string; subtitle: string }[];
  contacts: { value: string; label: string }[];
  contactHint: string;
  /** PH/HS: giáo viên đang dạy (nút nhắn nhanh). */
  teachers?: { id: string; fullName: string; classes: string }[];
  /** Không phải quản lý: hiện nút "Nhắn trung tâm". */
  showCenter?: boolean;
};

/** Cột trái kiểu Zalo: tìm nhanh, tin nhắn mới, danh sách cuộc trò chuyện. Trên điện thoại chỉ hiện ở `/tin-nhan`. */
export function ChatSidebar({ conversations, unopenedClasses, contacts, contactHint, teachers = [], showCenter }: Props) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);
  const atRoot = pathname === "/tin-nhan";
  const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
  const match = (text: string) => terms.every((t) => foldVietnamese(text).includes(t));
  const shown = useMemo(() => conversations.filter((c) => match(`${c.title} ${c.subtitle ?? ""} ${c.last?.body ?? ""}`)), [conversations, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownClasses = unopenedClasses.filter((k) => match(`${k.title} ${k.subtitle}`));

  return (
    <aside className={cn("min-w-0 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto custom-scrollbar", !atRoot && "hidden")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl text-primary">Tin nhắn</h1>
        {contacts.length > 0 && (
          <button
            type="button"
            onClick={() => setComposing((v) => !v)}
            aria-expanded={composing}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-strong"
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            Tin nhắn mới
          </button>
        )}
      </div>
      {composing && (
        <div className="mb-3 rounded-block border border-line bg-surface p-3">
          <ConfigForm
            action={startConversationAction}
            submitLabel="Nhắn tin"
            fields={[{ type: "combobox", name: "userId", label: "Người nhận", required: true, placeholder: "Gõ tên người cần nhắn…", options: contacts }]}
          />
          <p className="mt-2 text-xs text-muted">{contactHint}</p>
        </div>
      )}
      {(showCenter || teachers.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {showCenter && (
            <form action={startCenterConversationAction}>
              <button type="submit" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-soft">
                <Building2 className="size-4" aria-hidden="true" />
                Nhắn trung tâm
              </button>
            </form>
          )}
          {teachers.map((t) => (
            <form key={t.id} action={openDirectAction}>
              <input type="hidden" name="userId" value={t.id} />
              <button type="submit" title={`Lớp ${t.classes}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm hover:border-primary/40 hover:bg-primary-soft">
                Nhắn GV {t.fullName}
              </button>
            </form>
          ))}
        </div>
      )}
      <label className="relative mb-3 block">
        <span className="sr-only">Tìm cuộc trò chuyện</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, lớp, nội dung…"
          className="block min-h-11 w-full rounded-full border border-line-strong bg-surface pl-9 pr-4 text-base"
        />
      </label>
      <Link href="/tin-nhan/tim" className="mb-3 inline-flex items-center gap-1.5 text-sm">
        <TextSearch className="size-4" aria-hidden="true" />
        Tìm trong nội dung mọi tin nhắn
      </Link>
      {shown.length === 0 && shownClasses.length === 0 ? (
        <p className="rounded-block border border-dashed border-line p-4 text-center text-sm text-muted">{q ? "Không tìm thấy cuộc trò chuyện." : "Chưa có cuộc trò chuyện nào."}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-block border border-line bg-surface">
          {shown.map((c) => {
            const active = pathname === `/tin-nhan/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/tin-nhan/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-3 px-3 py-3 text-ink no-underline hover:bg-paper", active ? "bg-primary-soft" : c.unread > 0 && "bg-primary-soft/40")}
                >
                  {c.kind === "CLASS" ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <Users className="size-5" aria-hidden="true" />
                    </span>
                  ) : (
                    <Avatar name={c.title} fileId={c.avatarFileId} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate", c.unread > 0 && "font-semibold")}>
                        {c.title}
                        {c.roleLabel && <span className="text-xs font-normal text-muted"> · {c.roleLabel}</span>}
                      </span>
                      {c.last && <span className="shrink-0 text-xs text-muted">{formatChatTime(c.last.createdAt)}</span>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-muted">{c.last ? `${c.last.mine ? "Bạn" : c.last.senderName}: ${c.last.body}` : "Chưa có tin nhắn"}</span>
                      {c.unread > 0 && <span className="shrink-0 rounded-full bg-danger px-2 text-xs font-bold leading-5 text-white">{c.unread > 99 ? "99+" : c.unread}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {shownClasses.map((k) => (
            <li key={k.classId}>
              <Link href={`/tin-nhan/lop/${k.classId}`} className="flex items-center gap-3 px-3 py-3 text-ink no-underline hover:bg-paper">
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
    </aside>
  );
}
