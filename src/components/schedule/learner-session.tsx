import type { ReactNode } from "react";
import Link from "next/link";
import { FileList } from "@/components/files/file-list";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/feedback";
import type { getSessionForLearner } from "@/server/academic/learner";
import { ATTENDANCE_STATUS, DOCUMENT_KIND, REQUEST_STATUS, SESSION_STATUS } from "@/lib/labels";
import { formatDateTime, formatTime, formatVn } from "@/lib/time";

type Session = Awaited<ReturnType<typeof getSessionForLearner>>;

/** Nội dung chi tiết buổi học dùng chung cho cổng học sinh và phụ huynh. `extra` = khối riêng (vd. form xin nghỉ). */
export function LearnerSessionView({ s, backHref, backLabel, extra }: { s: Session; backHref: string; backLabel: string; extra?: ReactNode }) {
  const status = SESSION_STATUS[s.status];
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={backHref}>← {backLabel}</Link>
      </p>
      <PageHeader
        title={`${s.class.code} — buổi ${s.index}`}
        description={`${formatVn(s.startsAt, "EEEE dd/MM/yyyy")} · ${formatTime(s.startsAt)}–${formatTime(s.endsAt)} · ${s.class.course.title}`}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {s.isMakeup && <Badge tone="primary">Học bù</Badge>}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Thông tin buổi học">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Giáo viên</dt>
              <dd>
                {s.teacher.fullName}
                {s.teacherId !== s.class.teacherId && <span className="text-sm text-muted"> (dạy thay)</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Phòng</dt>
              <dd>{s.room?.name ?? "Chưa xếp phòng"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Điểm danh</dt>
              <dd>
                {s.attendance ? (
                  <Badge tone={ATTENDANCE_STATUS[s.attendance.status].tone}>{ATTENDANCE_STATUS[s.attendance.status].label}</Badge>
                ) : (
                  <span className="text-muted">Chưa điểm danh</span>
                )}
              </dd>
            </div>
            {s.attendance?.note && (
              <div>
                <dt className="text-sm text-muted">Ghi chú của giáo viên</dt>
                <dd>{s.attendance.note}</dd>
              </div>
            )}
          </dl>
          {s.note && <p className="mt-3 text-sm">Ghi chú: {s.note}</p>}
          {s.cancelReason && (
            <Alert tone="warning" className="mt-3">
              Buổi học đã hủy: {s.cancelReason}
            </Alert>
          )}
          {s.leaveRequests.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-sm font-medium">Đơn xin nghỉ</p>
              <ul className="mt-2 space-y-2 text-sm">
                {s.leaveRequests.map((r) => (
                  <li key={r.id}>
                    <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge> <span className="text-muted">{formatDateTime(r.createdAt)}</span> — {r.reason}
                    {r.responseNote && <span className="block text-muted">Phản hồi: {r.responseNote}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Card title={`Tài liệu của lớp (${s.documents.length})`}>
          {s.documents.length === 0 ? (
            <p className="text-sm text-muted">Chưa có tài liệu.</p>
          ) : (
            <ul className="space-y-4">
              {s.documents.map((d) => (
                <li key={d.id}>
                  <p className="font-medium">
                    <Link href={`/tai-lieu/${d.id}`}>{d.title}</Link> <span className="text-sm font-normal text-muted">· {DOCUMENT_KIND[d.kind]}</span>
                  </p>
                  {d.files.length > 0 && (
                    <div className="mt-2">
                      <FileList files={d.files} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {extra}
      </div>
    </>
  );
}
