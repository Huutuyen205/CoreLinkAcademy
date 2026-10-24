import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import type { listPublishedResults } from "@/server/assessment/service";
import type { getStudentAttendance } from "@/server/attendance/service";
import { formatRate } from "@/server/attendance/rules";
import { ATTENDANCE_STATUS, ATTITUDE } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/time";

type Attendance = Awaited<ReturnType<typeof getStudentAttendance>>;
type Results = Awaited<ReturnType<typeof listPublishedResults>>;

/** FR-025: tỷ lệ và lịch sử chuyên cần. */
export function AttendanceSummary({ data, limit = 10 }: { data: Attendance; limit?: number }) {
  return (
    <Card title={`Chuyên cần: ${formatRate(data.rate)}`}>
      {data.records.length === 0 ? (
        <EmptyState message="Chưa có buổi nào được điểm danh." />
      ) : (
        <>
          {data.classes.length > 1 && (
            <ul className="mb-4 flex flex-wrap gap-2 text-sm">
              {data.classes.map((c) => (
                <li key={c.id} className="rounded-full border border-line px-3 py-1">
                  {c.code}: {formatRate(c.rate)}
                </li>
              ))}
            </ul>
          )}
          {/* HS §3 / PH §3: số buổi có mặt, vắng, đi muộn (bỏ buổi đã hủy). */}
          <dl className="mb-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
            {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const).map((st) => (
              <div key={st} className="rounded-control border border-line px-2 py-1.5">
                <dt className="text-xs text-muted">{ATTENDANCE_STATUS[st].label}</dt>
                <dd className="text-lg font-semibold">{data.records.filter((r) => !r.sessionCancelled && r.status === st).length}</dd>
              </div>
            ))}
          </dl>
          <p className="mb-2 text-sm text-muted">Tỷ lệ = (có mặt + muộn) / số buổi đã điểm danh.</p>
          <ul className="divide-y divide-line">
            {data.records.slice(0, limit).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {formatDate(r.session.startsAt)} · {r.session.class.code}
                  {r.note && <span className="block text-sm text-muted">{r.note}</span>}
                  {r.comment && <span className="block text-sm">{r.comment}</span>}
                </span>
                <span className="flex flex-wrap gap-1">
                  {r.attitude && ATTITUDE[r.attitude] && <Badge tone={ATTITUDE[r.attitude]!.tone}>{ATTITUDE[r.attitude]!.label}</Badge>}
                  <Badge tone={ATTENDANCE_STATUS[r.status].tone}>{ATTENDANCE_STATUS[r.status].label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** FR-033: điểm đã công bố. */
export function ResultsList({ results, linkToAssignment }: { results: Results; linkToAssignment?: boolean }) {
  return (
    <Card title="Điểm đã công bố">
      {results.length === 0 ? (
        <EmptyState message="Chưa có kết quả nào được công bố." />
      ) : (
        <ul className="divide-y divide-line">
          {results.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {linkToAssignment ? (
                    <Link href={`/hoc-sinh/bai-tap/${r.assignmentId}`} className="font-medium">
                      {r.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.title}</span>
                  )}
                  <span className="block text-sm text-muted">
                    {r.classCode} · công bố {formatDateTime(r.publishedAt)}
                    {r.isLate ? " · nộp muộn" : ""}
                  </span>
                </span>
                <Badge tone="primary">
                  {r.score ?? 0}/{r.maxScore}
                </Badge>
              </div>
              {r.teacherComment && <p className="mt-1 text-sm">Nhận xét: {r.teacherComment}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
