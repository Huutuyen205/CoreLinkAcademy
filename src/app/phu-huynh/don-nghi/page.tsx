import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { cancelLeaveRequestAction } from "@/server/requests/actions";
import { listLeaveRequestsForParent } from "@/server/requests/leave";
import { REQUEST_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Đơn xin nghỉ" };

// Phụ huynh §2 — FR-044: xem trạng thái đơn xin nghỉ; rút đơn đang chờ.
export default async function ParentLeavePage() {
  const actor = await requireRole("PARENT");
  const rows = await listLeaveRequestsForParent(actor);

  return (
    <>
      <PageHeader title="Đơn xin nghỉ" description="Gửi đơn tại trang chi tiết buổi học (bấm vào buổi trong lịch của con)." />
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
