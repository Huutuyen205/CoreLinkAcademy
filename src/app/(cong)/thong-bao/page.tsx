import type { Metadata } from "next";
import Link from "next/link";
import { kindIcon } from "@/components/notifications/kind-icon";
import { PushToggle } from "@/components/notifications/push-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Pagination, parsePage } from "@/components/ui/data-table";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { markAllReadAction, openNotificationAction } from "@/server/notifications/actions";
import { listMyNotifications, NOTIFICATION_PAGE_SIZE } from "@/server/notifications/service";
import { cn } from "@/lib/format";
import { NOTIFICATION_GROUPS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Thông báo" };

// FR-048: hộp thư thông báo của mọi vai trò.
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; chua?: string; loai?: string }> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const onlyUnread = sp.chua === "1";
  const group = NOTIFICATION_GROUPS.find((g) => g.key === sp.loai);
  const { total, unread, rows } = await listMyNotifications(actor, page, onlyUnread, group?.kinds);
  const href = (p: { chua?: boolean; loai?: string }) => {
    const q = new URLSearchParams();
    if (p.chua) q.set("chua", "1");
    if (p.loai) q.set("loai", p.loai);
    const s = q.toString();
    return s ? `/thong-bao?${s}` : "/thong-bao";
  };
  const canSend = actor.role === "ADMIN" || actor.role === "TEACHER";

  return (
    <>
      <PageHeader
        title="Thông báo"
        description={unread > 0 ? `${unread} thông báo chưa đọc.` : "Bạn đã đọc hết thông báo."}
        action={
          <span className="flex flex-wrap gap-2">
            {canSend && (
              <ButtonLink href="/thong-bao/gui" size="sm">
                Gửi thông báo
              </ButtonLink>
            )}
            {canSend && (
              <ButtonLink href="/thong-bao/gui#da-gui" size="sm" variant="secondary">
                Đã gửi &amp; trạng thái
              </ButtonLink>
            )}
            {unread > 0 && (
              <form action={markAllReadAction}>
                <button type="submit" className="inline-flex min-h-9 items-center rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-soft">
                  Đánh dấu đã đọc tất cả
                </button>
              </form>
            )}
          </span>
        }
      />
      <PushToggle />
      {canSend && <p className="mb-3 text-sm text-muted">Đây là hộp thư thông báo <strong>bạn nhận được</strong> (đơn xin nghỉ, đề xuất đổi lịch, bài cần chấm, thông báo của trung tâm…). Thông báo bạn đã gửi xem ở &ldquo;Đã gửi &amp; trạng thái&rdquo;.</p>}
      <nav aria-label="Lọc theo loại" className="mb-3 flex flex-wrap gap-2">
        {[{ key: undefined as string | undefined, label: "Mọi loại" }, ...NOTIFICATION_GROUPS.map((g) => ({ key: g.key as string | undefined, label: g.label }))].map((t) => (
          <Link
            key={t.key ?? "all"}
            href={href({ chua: onlyUnread, loai: t.key })}
            aria-current={t.key === group?.key ? "page" : undefined}
            className={cn("inline-flex min-h-9 items-center rounded-full border px-3 text-sm no-underline", t.key === group?.key ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Lọc thông báo" className="mb-4 flex gap-2">
        {[
          { href: href({ loai: group?.key }), label: "Tất cả", active: !onlyUnread },
          { href: href({ chua: true, loai: group?.key }), label: `Chưa đọc (${unread})`, active: onlyUnread },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn("inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline", t.active ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState message={onlyUnread ? "Không có thông báo chưa đọc." : "Chưa có thông báo nào."} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-block border border-line bg-surface">
          {rows.map((n) => {
            const Icon = kindIcon(n.kind);
            return (
              <li key={n.id} className={cn(!n.readAt && "bg-primary-soft/40")}>
                <form action={openNotificationAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="flex w-full gap-3 px-4 py-3 text-left hover:bg-paper">
                    <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full", n.readAt ? "bg-paper text-muted" : "bg-primary text-white")}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block", !n.readAt && "font-semibold")}>
                        {n.title}
                        {!n.readAt && <span className="sr-only"> (chưa đọc)</span>}
                      </span>
                      <span className="block whitespace-pre-line text-sm text-muted">{n.body}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatDateTime(n.createdAt)}
                        {n.announcement ? ` · ${n.announcement.author.fullName}` : ""}
                      </span>
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageSize={NOTIFICATION_PAGE_SIZE} total={total} basePath="/thong-bao" params={{ chua: onlyUnread ? "1" : undefined, loai: group?.key }} />
    </>
  );
}
