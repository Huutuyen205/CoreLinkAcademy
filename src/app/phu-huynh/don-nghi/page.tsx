import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { Flash } from "@/components/layout/flash";
import { cancelLeaveRequestAction, createLeaveFromListAction } from "@/server/requests/actions";
import { listLeaveRequestsForParent, upcomingLeaveTargets } from "@/server/requests/leave";
import { REQUEST_STATUS } from "@/lib/labels";
import { formatDateTime, formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Đơn xin nghỉ" };

// Phụ huynh §2 — FR-044: gửi đơn xin nghỉ cho con (chọn buổi sắp tới), xem trạng thái đơn, rút đơn đang chờ.
export default async function ParentLeavePage({ searchParams }: { searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("PARENT");
  const [rows, targets] = await Promise.all([listLeaveRequestsForParent(actor), upcomingLeaveTargets(actor)]);
  const multiChild = new Set(targets.map((t) => t.studentId)).size > 1;

  return (
    <>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader title="Đơn xin nghỉ" description="Chọn buổi học sắp tới của con và ghi lý do. Giáo viên/giáo vụ duyệt thì buổi đó được ghi &ldquo;Có phép&rdquo;." />
      <Card title="Gửi đơn xin nghỉ" className="mb-6">
        {targets.length === 0 ? (
          <p className="text-sm text-muted">Con không có buổi học nào trong 30 ngày tới có thể xin nghỉ.</p>
        ) : (
          <ConfigForm
            action={createLeaveFromListAction}
            submitLabel="Gửi đơn"
            columns={2}
            fields={[
              {
                type: "select",
                name: "target",
                label: "Buổi học xin nghỉ",
                required: true,
                placeholder: "Chọn buổi",
                options: targets.map((t) => ({ value: `${t.studentId}|${t.sessionId}`, label: `${multiChild ? `${t.studentName} · ` : ""}${t.classCode} · ${formatVn(t.startsAt, "EEEE dd/MM HH:mm")}` })),
              },
              { type: "text", name: "reason", label: "Lý do", required: true, maxLength: 500 },
            ]}
          />
        )}
      </Card>
      <h2 className="mb-3 text-xl">Đơn đã gửi ({rows.length})</h2>
      {rows.length === 0 ? (
        <EmptyState message="Chưa có đơn xin nghỉ nào." action={<Link href="/phu-huynh">Mở lịch học của con</Link>} />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.student.fullName} · lớp {r.session.class.code}
                    </p>
                    <p className="text-sm text-muted">
                      Buổi <Link href={`/phu-huynh/buoi/${r.session.id}?con=${r.student.id}`}>{formatDateTime(r.session.startsAt)}</Link> · gửi {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge>
                </div>
                <p className="mt-2">Lý do: {r.reason}</p>
                {r.handledBy && (
                  <p className="mt-1 text-sm text-muted">
                    {r.handledBy.fullName}
                    {r.handledAt ? ` · ${formatDateTime(r.handledAt)}` : ""}
                    {r.responseNote ? `: ${r.responseNote}` : ""}
                  </p>
                )}
                {r.status === "PENDING" && (
                  <ConfigForm className="mt-3" action={cancelLeaveRequestAction} hidden={{ requestId: r.id }} submitLabel="Rút đơn" submitVariant="secondary" confirm="Rút đơn xin nghỉ này?" fields={[]} />
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
