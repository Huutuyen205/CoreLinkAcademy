import type { AnnouncementAudience } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listClasses } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { createAnnouncementAction } from "@/server/notifications/actions";
import { canAnnounce, listSentAnnouncements } from "@/server/notifications/service";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Gửi thông báo" };

const AUDIENCES = Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[];

// FR-048 — Admin §12A, Giáo viên §10A: soạn và gửi thông báo; xem danh sách đã gửi + số người đã đọc.
export default async function SendAnnouncementPage({ searchParams }: { searchParams: Promise<{ lop?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF", "TEACHER");
  const { lop } = await searchParams;
  const [classes, sent] = await Promise.all([listClasses(actor), listSentAnnouncements(actor)]);
  const openClasses = classes.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
  const audiences = AUDIENCES.filter((a) => canAnnounce(actor.role, a));
  const presetClass = openClasses.find((c) => c.id === lop)?.id;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/thong-bao">← Thông báo</Link>
      </p>
      <PageHeader title="Gửi thông báo" description={actor.role === "TEACHER" ? "Gửi cho học sinh và phụ huynh của lớp bạn phụ trách." : "Gửi đến giáo viên, học sinh, phụ huynh hoặc một lớp."} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title="Soạn thông báo">
          <ConfigForm
            action={createAnnouncementAction}
            submitLabel="Gửi"
            confirm="Gửi thông báo này?"
            fields={[
              {
                type: "select",
                name: "audience",
                label: "Đối tượng nhận",
                required: true,
                options: audiences.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] })),
                defaultValue: presetClass || actor.role === "TEACHER" ? "CLASS" : "ALL",
              },
              {
                type: "select",
                name: "classId",
                label: "Lớp (khi gửi cho một lớp)",
                placeholder: "Chọn lớp",
                options: openClasses.map((c) => ({ value: c.id, label: `${c.code} · ${c.course.title}` })),
                defaultValue: presetClass ?? "",
              },
              { type: "text", name: "title", label: "Tiêu đề", required: true, maxLength: 200 },
              { type: "textarea", name: "body", label: "Nội dung", required: true, maxLength: 5000, rows: 6 },
            ]}
          />
        </Card>
        <Card title={`Đã gửi gần đây (${sent.length})`}>
          {sent.length === 0 ? (
            <EmptyState message="Chưa gửi thông báo nào." />
          ) : (
            <ul className="divide-y divide-line">
              {sent.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted">
                    {a.audience === "CLASS" && a.class ? `Lớp ${a.class.code}` : AUDIENCE_LABELS[a.audience]} · {formatDateTime(a.createdAt)}
                    {actor.role !== "TEACHER" ? ` · ${a.author.fullName}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{a.body}</p>
                  <p className="mt-1 text-sm text-primary">
                    Đã đọc {a.readCount}/{a.recipientCount}
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
