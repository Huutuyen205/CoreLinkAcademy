import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { handleLeaveRequestAction } from "@/server/requests/actions";
import type { listLeaveRequestsForHandler } from "@/server/requests/leave";
import { REQUEST_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

type Rows = Awaited<ReturnType<typeof listLeaveRequestsForHandler>>;

/** Đơn xin nghỉ cần xử lý — dùng cho giáo viên (lớp mình) và quản trị viên (tất cả). */
export function LeaveRequestList({ rows, studentHref }: { rows: Rows; studentHref?: (id: string) => string }) {
  if (rows.length === 0) return <EmptyState message="Không có đơn xin nghỉ." />;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {studentHref ? <Link href={studentHref(r.student.id)}>{r.student.fullName}</Link> : r.student.fullName} · lớp {r.session.class.code}
              </p>
              <p className="text-sm text-muted">
                Buổi {formatDateTime(r.session.startsAt)} · PH {r.requestedBy.fullName} gửi {formatDateTime(r.createdAt)}
              </p>
            </div>
            <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge>
          </div>
          <p className="mt-1">Lý do: {r.reason}</p>
          {r.handledBy && (
            <p className="text-sm text-muted">
              {r.handledBy.fullName}
              {r.responseNote ? `: ${r.responseNote}` : ""}
            </p>
          )}
          {r.status === "PENDING" && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <ConfigForm
                action={handleLeaveRequestAction}
                hidden={{ requestId: r.id, decision: "approve" }}
                submitLabel="Duyệt (ghi Có phép)"
                fields={[{ type: "text", name: "note", label: "Phản hồi (tùy chọn)", maxLength: 500 }]}
              />
              <ConfigForm
                action={handleLeaveRequestAction}
                hidden={{ requestId: r.id, decision: "reject" }}
                submitLabel="Từ chối"
                submitVariant="secondary"
                confirm="Từ chối đơn xin nghỉ này?"
                fields={[{ type: "text", name: "note", label: "Lý do từ chối", maxLength: 500 }]}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
