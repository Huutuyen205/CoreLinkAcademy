import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextField } from "@/components/ui/field";
import { FilterSelect } from "@/components/ui/filter-select";
import { EmptyState } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { requireActor } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { messagePartners, searchMessages } from "@/server/messaging/service";
import { formatChatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tìm tin nhắn" };

/** Cắt đoạn quanh từ khóa để hiện kết quả gọn. */
function snippet(body: string, q: string): string {
  const i = q ? body.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0 || body.length <= 140) return body.slice(0, 140);
  const start = Math.max(0, i - 50);
  return `${start > 0 ? "…" : ""}${body.slice(start, start + 140)}…`;
}

// HS §6 "Tìm kiếm tin nhắn theo giáo viên, từ khóa"; GV §10B, Admin §12B: tìm trong mọi cuộc trò chuyện mình xem được.
export default async function SearchMessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; nguoi?: string }> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const partners = await messagePartners(actor);
  const withUserId = partners.some((p) => p.id === sp.nguoi) ? sp.nguoi : undefined;
  const results = q.length >= 2 || withUserId ? await searchMessages(actor, q, withUserId) : [];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/tin-nhan" className="inline-flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-soft lg:hidden" aria-label="Danh sách tin nhắn">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl text-primary">Tìm tin nhắn</h1>
      </div>
      <FilterForm className="grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr] md:items-end">
        <TextField name="q" label="Từ khóa trong nội dung" defaultValue={q} maxLength={80} />
        <FilterSelect
          name="nguoi"
          label="Người trò chuyện"
          placeholder="Tất cả"
          defaultValue={withUserId ?? ""}
          options={partners.map((p) => ({ value: p.id, label: `${p.fullName} · ${ROLE_LABELS[p.role]}` }))}
        />
      </FilterForm>
      {q.length < 2 && !withUserId ? (
        <p className="text-sm text-muted">Gõ ít nhất 2 ký tự hoặc chọn một người (vd. giáo viên) để xem các tin liên quan.</p>
      ) : results.length === 0 ? (
        <EmptyState message="Không tìm thấy tin nhắn phù hợp. Lưu ý gõ đúng dấu tiếng Việt." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-block border border-line bg-surface">
          {results.map((m) => (
            <li key={m.id}>
              <Link href={`/tin-nhan/${m.conversationId}#tin-${m.id}`} className="block px-4 py-3 text-ink no-underline hover:bg-paper">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-semibold text-primary">{m.where}</span>
                  <span className="shrink-0 text-xs text-muted">{formatChatTime(m.createdAt)}</span>
                </span>
                <span className="block text-sm">
                  <span className="text-muted">{m.senderName}: </span>
                  {snippet(m.body, q) || <span className="text-muted">[Ảnh/tệp]</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {results.length === 50 && <p className="text-sm text-muted">Hiển thị 50 tin mới nhất. Thêm từ khóa để thu hẹp.</p>}
    </section>
  );
}
