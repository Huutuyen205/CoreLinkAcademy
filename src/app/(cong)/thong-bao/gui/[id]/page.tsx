import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck, Eye, Smartphone } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/policy";
import { orNotFound } from "@/server/page";
import { getAnnouncementStatus } from "@/server/notifications/service";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Trạng thái gửi thông báo" };

// Admin §12A "Xem trạng thái gửi thông báo": đã gửi tới ai, ai đã đọc (lúc nào), ai có thông báo đẩy.
export default async function AnnouncementStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loc?: string }> }) {
  const actor = await requireRole("ADMIN", "TEACHER");
  const a = await orNotFound(getAnnouncementStatus(actor, (await params).id));
  const loc = (await searchParams).loc;
  const rows = loc === "chua-doc" ? a.rows.filter((r) => !r.readAt) : loc === "da-doc" ? a.rows.filter((r) => r.readAt) : a.rows;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/thong-bao/gui#da-gui">← Thông báo đã gửi</Link>
      </p>
      <PageHeader
        title={a.title}
        description={`${a.audience === "CLASS" && a.class ? `Lớp ${a.class.code}` : AUDIENCE_LABELS[a.audience]} · gửi ${formatDateTime(a.createdAt)} · ${a.author.fullName}`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCheck} label="Đã gửi tới (hộp thư)" value={a.rows.length} />
        <StatCard icon={Eye} label="Đã đọc" value={`${a.readCount}/${a.rows.length}`} tone="success" index={1} />
        <StatCard icon={Smartphone} label="Có bật thông báo đẩy" value={a.pushCount} index={2} />
      </div>
      <Card title="Nội dung" className="mb-6">
        <p className="whitespace-pre-line">{a.body}</p>
      </Card>
      <nav aria-label="Lọc người nhận" className="mb-4 flex flex-wrap gap-2 text-sm">
        {[
          { k: undefined, label: `Tất cả (${a.rows.length})` },
          { k: "chua-doc", label: `Chưa đọc (${a.rows.length - a.readCount})` },
          { k: "da-doc", label: `Đã đọc (${a.readCount})` },
        ].map((t) => (
          <Link
            key={t.k ?? "all"}
            href={t.k ? `?loc=${t.k}` : "?"}
            aria-current={t.k === loc ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 no-underline ${t.k === loc ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <DataTable
        caption="Người nhận"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Người nhận", primary: true, cell: (r) => r.fullName },
          { header: "Vai trò", cell: (r) => ROLE_LABELS[r.role] },
          { header: "Trạng thái", cell: (r) => (r.readAt ? <Badge tone="success">Đã đọc {formatDateTime(r.readAt)}</Badge> : <Badge tone="warning">Chưa đọc</Badge>) },
          { header: "Thông báo đẩy", cell: (r) => (r.pushDevices > 0 ? `${r.pushDevices} thiết bị` : <span className="text-muted">Chưa bật</span>) },
        ]}
      />
      <p className="mt-3 text-sm text-muted">Thông báo luôn vào hộp thư của người nhận. Thông báo đẩy chỉ tới thiết bị người nhận đã bật &ldquo;Nhận thông báo trên thiết bị này&rdquo;.</p>
    </>
  );
}
