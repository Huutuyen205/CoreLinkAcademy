import Link from "next/link";
import { Alert, Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import type { getSessionForAttendance } from "@/server/attendance/service";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "@/lib/labels";
import { formatTime, formatVn } from "@/lib/time";
import { AttendanceForm } from "./attendance-form";

type Data = Awaited<ReturnType<typeof getSessionForAttendance>>;

/** Màn hình điểm danh một buổi (UC-007), dùng cho cả giáo viên và giáo vụ. */
export function SessionAttendance({ data, backHref, backLabel }: { data: Data; backHref: string; backLabel: string }) {
  const { session, roster, canEdit, needsReason, inWindow } = data;
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={backHref}>← {backLabel}</Link>
      </p>
      <PageHeader
        title={`Điểm danh lớp ${session.class.code} — buổi ${session.index}`}
        description={`${formatVn(session.startsAt, "EEEE dd/MM/yyyy")} · ${formatTime(session.startsAt)}–${formatTime(session.endsAt)}${session.room ? ` · ${session.room.name}` : ""} · ${session.class.course.title}`}
        action={<Badge tone={SESSION_STATUS[session.status].tone}>{SESSION_STATUS[session.status].label}</Badge>}
      />
      {session.status === "CANCELLED" && <Alert tone="danger" className="mb-4">Buổi học đã hủy{session.cancelReason ? `: ${session.cancelReason}` : ""}.</Alert>}
      {session.status !== "CANCELLED" && !inWindow && !canEdit && (
        <Alert tone="info" className="mb-4">
          Ngoài khung điểm danh (30 phút trước giờ học đến 24 giờ sau giờ kết thúc). Bạn chỉ xem được; liên hệ giáo vụ nếu cần sửa.
        </Alert>
      )}
      {needsReason && (
        <Alert tone="warning" className="mb-4">
          Ngoài khung điểm danh của giáo viên: cần nhập lý do, thay đổi được ghi vào nhật ký.
        </Alert>
      )}

      {roster.length === 0 ? (
        <EmptyState message="Lớp chưa có học sinh đang học." />
      ) : canEdit ? (
        <AttendanceForm
          sessionId={session.id}
          needsReason={needsReason}
          rows={roster.map((r) => ({ id: r.id, fullName: r.fullName, studentCode: r.studentCode, status: r.record?.status ?? null, note: r.record?.note ?? null }))}
        />
      ) : (
        <ul className="divide-y divide-line rounded-block border border-line bg-surface">
          {roster.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span>{r.fullName}</span>
              {r.record ? <Badge tone={ATTENDANCE_STATUS[r.record.status].tone}>{ATTENDANCE_STATUS[r.record.status].label}</Badge> : <span className="text-sm text-muted">Chưa điểm danh</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
