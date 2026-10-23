import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, FileText, Search, Users } from "lucide-react";
import { ConfigForm } from "@/components/forms/config-form";
import { AutoRefresh } from "@/components/messaging/auto-refresh";
import { MessageComposer } from "@/components/messaging/message-composer";
import { ScrollToBottom } from "@/components/messaging/scroll-to-bottom";
import { Avatar } from "@/components/ui/avatar";
import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { ActionButton } from "@/components/ui/row-actions";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { formatBytes, isInlineType } from "@/server/files/rules";
import { removeMessageAction, setMemberMutedAction, startConversationAction } from "@/server/messaging/actions";
import { getConversation } from "@/server/messaging/service";
import { orNotFound } from "@/server/page";
import { cn } from "@/lib/format";
import { formatDate, formatTime, vnDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "Trò chuyện" };

type FileMeta = { id: string; fileName: string; mimeType: string; size: number };

function Attachments({ files, mine }: { files: FileMeta[]; mine: boolean }) {
  const images = files.filter((f) => isInlineType(f.mimeType) && f.mimeType.startsWith("image/"));
  const others = files.filter((f) => !images.includes(f));
  return (
    <div className="mt-1 space-y-1.5">
      {images.length > 0 && (
        <div className={cn("grid gap-1", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((f) => (
            <a key={f.id} href={`/tep/${f.id}`} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh qua route có kiểm tra quyền */}
              <img src={`/tep/${f.id}`} alt={f.fileName} loading="lazy" className="max-h-72 w-full bg-paper object-cover" />
            </a>
          ))}
        </div>
      )}
      {others.map((f) => (
        <a
          key={f.id}
          href={`/tep/${f.id}?tai=1`}
          className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm no-underline", mine ? "bg-white/15 text-white hover:bg-white/25" : "bg-paper text-ink hover:bg-primary-soft")}
        >
          <FileText className="size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{f.fileName}</span>
            <span className={cn("block text-xs", mine ? "text-on-brand-muted" : "text-muted")}>{formatBytes(f.size)}</span>
          </span>
          <Download className="size-4 shrink-0" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

/** Thẻ "Hỏi bài": tin gắn với một bài tập — HS/GV bấm mở bài. */
function AssignmentTag({ id, title, mine, role }: { id: string; title: string; mine: boolean; role: string }) {
  const href = role === "STUDENT" ? `/hoc-sinh/bai-tap/${id}` : role === "TEACHER" ? `/giao-vien/bai-tap/${id}` : null;
  const body = (
    <>
      <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">Hỏi về bài: {title}</span>
    </>
  );
  const cls = cn("mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold no-underline", mine ? "bg-white/15 text-white" : "bg-primary-soft text-primary");
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}

// FR-050 (DECISION-D30): nội dung một cuộc trò chuyện — tin nhắn chữ/ảnh/tệp, thành viên nhóm lớp và nhắn riêng.
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const c = await orNotFound(getConversation(actor, (await params).id));
  let lastDay = "";
  const lastId = c.messages.at(-1)?.id ?? "none";

  return (
    <>
      <AutoRefresh seconds={4} />
      <ScrollToBottom marker={lastId} />
      <header className="sticky top-16 z-20 -mx-4 mb-4 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-sm lg:top-0 lg:mx-0 lg:rounded-block lg:border lg:bg-surface">
        <Link href="/tin-nhan" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-soft lg:hidden" aria-label="Danh sách tin nhắn">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        {c.kind === "CLASS" ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Users className="size-5" aria-hidden="true" />
          </span>
        ) : (
          <Avatar name={c.title} fileId={c.other?.avatarFileId} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-primary">{c.title}</h1>
          <p className="truncate text-sm text-muted">{c.subtitle ?? (c.other ? ROLE_LABELS[c.other.role] : "")}{c.members ? ` · ${c.members.length} thành viên` : ""}</p>
        </div>
        <Link
          href={c.other ? `/tin-nhan/tim?nguoi=${c.other.id}` : "/tin-nhan/tim"}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-soft"
          aria-label="Tìm trong tin nhắn"
          title="Tìm trong tin nhắn"
        >
          <Search className="size-5" aria-hidden="true" />
        </Link>
      </header>
      {c.iAmMuted && (
        <Alert tone="warning" className="mb-4">
          Bạn đang bị tạm chặn gửi tin trong nhóm này (vẫn đọc được). Liên hệ giáo viên hoặc trung tâm nếu cần.
        </Alert>
      )}

      {c.members && (
        <details className="mb-4 rounded-block border border-line bg-surface">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 font-medium text-primary">
            <Users className="size-4" aria-hidden="true" />
            Thành viên nhóm ({c.members.length}) — nhắn riêng từng người
          </summary>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line custom-scrollbar">
            {c.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2">
                <Avatar name={m.fullName} fileId={m.avatarFileId} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {m.fullName}
                    {m.id === actor.id && <span className="font-normal text-muted"> (bạn)</span>}
                    {c.mutedIds.includes(m.id) && (
                      <span className="ml-1.5 align-middle">
                        <Badge tone="warning">Đang bị chặn gửi</Badge>
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">{m.note ?? ROLE_LABELS[m.role]}</span>
                </span>
                {m.canDirect && <ConfigForm action={startConversationAction} hidden={{ userId: m.id }} submitLabel="Nhắn riêng" submitVariant="secondary" fields={[]} />}
                {c.canModerate && m.id !== actor.id && (m.role !== "TEACHER" || actor.role === "ADMIN" || actor.role === "STAFF") && (
                  <ActionButton
                    action={setMemberMutedAction}
                    hidden={{ conversationId: c.id, userId: m.id, muted: c.mutedIds.includes(m.id) ? "0" : "1" }}
                    icon={c.mutedIds.includes(m.id) ? "unlock" : "lock"}
                    tone={c.mutedIds.includes(m.id) ? "success" : "danger"}
                    confirm={c.mutedIds.includes(m.id) ? undefined : `Tạm chặn ${m.fullName} gửi tin trong nhóm? (Vẫn đọc được tin.)`}
                  >
                    {c.mutedIds.includes(m.id) ? "Bỏ chặn" : "Chặn gửi"}
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2 text-xs text-muted">
            Thành viên tự cập nhật theo lớp: giáo viên, học sinh đang học và phụ huynh của các em.
            {c.canModerate && " Bạn quản lý nhóm này: gỡ tin không phù hợp (nút thùng rác cạnh tin) hoặc tạm chặn gửi tin một thành viên."}
          </p>
        </details>
      )}

      <section aria-label="Tin nhắn" aria-live="polite" className="space-y-2 pb-4">
        {c.messages.length === 0 && <EmptyState message="Chưa có tin nhắn. Hãy gửi lời chào!" />}
        {c.messages.map((m, i) => {
          const mine = m.sender.id === actor.id;
          const day = vnDateKey(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          // Gộp các tin liên tiếp của cùng người (như Zalo): chỉ tin đầu có tên + ảnh đại diện.
          const prev = c.messages[i - 1];
          const grouped = !showDay && prev?.sender.id === m.sender.id;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs text-muted">{formatDate(m.createdAt)}</p>}
              <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2")}>
                {!mine && (grouped ? <span className="size-8 shrink-0" aria-hidden="true" /> : <Avatar name={m.sender.fullName} fileId={m.sender.avatarFileId} size="sm" />)}
                {mine && !m.deletedAt && (
                  <ActionButton action={removeMessageAction} hidden={{ messageId: m.id }} icon="delete" iconOnly confirm="Thu hồi tin nhắn này? Mọi người sẽ không xem được nội dung và tệp đính kèm.">
                    Thu hồi
                  </ActionButton>
                )}
                <div
                  id={`tin-${m.id}`}
                  className={cn(
                    "max-w-[80%] scroll-mt-28 rounded-2xl px-3.5 py-2 target:ring-2 target:ring-warning sm:max-w-[65%]",
                    m.deletedAt ? "border border-dashed border-line bg-paper text-muted" : mine ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-line bg-surface",
                  )}
                >
                  {!mine && !grouped && c.kind === "CLASS" && (
                    <p className="text-xs font-semibold text-primary">
                      {m.sender.fullName} <span className="font-normal text-muted">· {ROLE_LABELS[m.sender.role]}</span>
                    </p>
                  )}
                  {m.deletedAt ? (
                    <p className="text-sm italic">{m.deletedById === m.sender.id ? "Tin nhắn đã được thu hồi" : "Tin nhắn đã bị gỡ bởi người quản lý nhóm"}</p>
                  ) : (
                    <>
                      {m.assignment && (
                        <AssignmentTag id={m.assignment.id} title={m.assignment.title} mine={mine} role={actor.role} />
                      )}
                      {m.body && <p className="whitespace-pre-line break-words">{m.body}</p>}
                      {m.files.length > 0 && <Attachments files={m.files} mine={mine} />}
                    </>
                  )}
                  <p className={cn("mt-0.5 text-right text-[11px]", mine && !m.deletedAt ? "text-on-brand-muted" : "text-muted")}>{formatTime(m.createdAt)}</p>
                </div>
                {!mine && !m.deletedAt && c.canModerate && (
                  <ActionButton action={removeMessageAction} hidden={{ messageId: m.id }} icon="delete" iconOnly tone="danger" confirm={`Gỡ tin nhắn của ${m.sender.fullName}? Nội dung được lưu vào nhật ký hệ thống.`}>
                    Gỡ tin
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </section>
      {c.iAmMuted ? null : <MessageComposer conversationId={c.id} />}
    </>
  );
}
