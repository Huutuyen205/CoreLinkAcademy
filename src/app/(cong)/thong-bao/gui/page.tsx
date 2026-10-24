import type { AnnouncementAudience } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementForm } from "@/components/notifications/announcement-form";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { announcementPeople, canAnnounce, listSentAnnouncements } from "@/server/notifications/service";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Gửi thông báo" };

const AUDIENCES = Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[];

// FR-048 — Admin §12A, Giáo viên §10A: soạn và gửi thông báo (nhóm / lớp / từng người); danh sách đã gửi + trạng thái gửi.
export default async function SendAnnouncementPage({ searchParams }: { searchParams: Promise<{ lop?: string }> }) {
  const actor = await requireRole("ADMIN", "TEACHER");
  const { lop } = await searchParams;
  const [classes, sent, people] = await Promise.all([listClasses(actor), listSentAnnouncements(actor), announcementPeople(actor)]);
  const openClasses = classes.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
  const audiences = AUDIENCES.filter((a) => canAnnounce(actor.role, a));
  const presetClass = openClasses.find((c) => c.id === lop)?.id;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/thong-bao">← Thông báo nhận được</Link>
      </p>
      <PageHeader
        title="Gửi thông báo"
        description={
          actor.role === "TEACHER"
            ? "Gửi cho học sinh và phụ huynh của lớp bạn phụ trách."
            : "Gửi đến toàn bộ giáo viên / học sinh / phụ huynh, một lớp, hoặc chọn từng người nhận. Người nhận có thông báo đẩy nếu đã bật."
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title="Soạn thông báo">
          <AnnouncementForm
            audiences={audiences.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] }))}
            classes={openClasses.map((c) => ({ value: c.id, label: `${c.code} · ${c.course.title}` }))}
            people={people.map((p) => ({ id: p.id, label: `${p.fullName}${p.studentCode ? ` (${p.studentCode})` : ""}`, group: ROLE_LABELS[p.role] }))}
            defaultAudience={presetClass || actor.role === "TEACHER" ? "CLASS" : "ALL"}
            defaultClassId={presetClass ?? ""}
          />
        </Card>
        <Card title={`Đã gửi gần đây (${sent.length})`} id="da-gui">
          {sent.length === 0 ? (
            <EmptyState message="Chưa gửi thông báo nào." />
          ) : (
            <ul className="divide-y divide-line">
              {sent.map((a) => (
                <li key={a.id} className="py-3">
                  <Link href={`/thong-bao/gui/${a.id}`} className="font-medium">
                    {a.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {a.audience === "CLASS" && a.class ? `Lớp ${a.class.code}` : AUDIENCE_LABELS[a.audience]} · {formatDateTime(a.createdAt)}
                    {actor.role !== "TEACHER" ? ` · ${a.author.fullName}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{a.body}</p>
                  <p className="mt-1 text-sm">
                    <span className="text-primary">
                      Đã gửi {a.recipientCount} · đã đọc {a.readCount}/{a.recipientCount}
                    </span>{" "}
                    · <Link href={`/thong-bao/gui/${a.id}`}>Xem trạng thái gửi</Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
