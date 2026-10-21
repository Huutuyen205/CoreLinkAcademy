import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { getClassForTeacher } from "@/server/academic/service";
import { getGradebook, listClassAssignments } from "@/server/assessment/service";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { ASSIGNMENT_STATUS, CLASS_STATUS, ENROLLMENT_STATUS, SESSION_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDateTime, formatTime, formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Lớp học" };

// FR-033 + UC-007/UC-008: học sinh, buổi, bài tập, bảng điểm của lớp mình dạy.
export default async function TeacherClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const { thongbao } = await searchParams;
  const klass = await orNotFound(getClassForTeacher(actor, id));
  const [assignments, gradebook, alerts] = klass.isOwner
    ? await Promise.all([listClassAssignments(actor, id), getGradebook(actor, id), listAbsenceAlerts(actor)])
    : [[], null, []];
  const classAlerts = alerts.filter((a) => a.classId === id);
  const mySessions = klass.isOwner ? klass.sessions : klass.sessions.filter((s) => s.teacherId === actor.id);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/giao-vien/lop">← Lớp của tôi</Link>
      </p>
      <Flash code={thongbao} />
      <PageHeader
        title={`Lớp ${klass.code}`}
        description={`${klass.course.title} · ${formatSchedule(klass.weekdays, klass.startTime, klass.endTime)}${klass.room ? ` · ${klass.room.name}` : ""}`}
        action={<Badge tone={CLASS_STATUS[klass.status].tone}>{CLASS_STATUS[klass.status].label}</Badge>}
      />
      {klass.isOwner && (
        <nav aria-label="Công cụ lớp" className="mb-6 flex flex-wrap gap-2">
          <ButtonLink href={`/giao-vien/lop/${klass.id}/danh-gia`} variant="secondary" size="sm">
            Đánh giá định kỳ
          </ButtonLink>
          <ButtonLink href={`/tai-lieu?lop=${klass.id}`} variant="secondary" size="sm">
            Tài liệu lớp
          </ButtonLink>
          <ButtonLink href={`/thong-bao/gui?lop=${klass.id}`} variant="secondary" size="sm">
            Gửi thông báo cho lớp
          </ButtonLink>
          <ButtonLink href={`/tin-nhan/lop/${klass.id}`} variant="secondary" size="sm">
            Nhóm trao đổi lớp
          </ButtonLink>
        </nav>
      )}

      {classAlerts.length > 0 && (
        <div role="status" className="mb-6 rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <p className="font-semibold">Vắng không phép 2 buổi liên tiếp</p>
          <p>{classAlerts.map((a) => a.studentName).join(", ")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={`Học sinh (${klass.enrollments.length})`}>
          {klass.enrollments.length === 0 ? (
            <EmptyState message="Lớp chưa có học sinh." />
          ) : (
            <ul className="divide-y divide-line">
              {klass.enrollments.map((e) => (
                <li key={e.student.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {klass.isOwner ? <Link href={`/giao-vien/hoc-sinh/${e.student.id}`}>{e.student.fullName}</Link> : e.student.fullName}{" "}
                    <span className="text-sm text-muted">{e.student.studentCode}</span>
                  </span>
                  {e.status !== "ACTIVE" && <Badge tone={ENROLLMENT_STATUS[e.status].tone}>{ENROLLMENT_STATUS[e.status].label}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Buổi học">
          <ol className="max-h-[28rem] divide-y divide-line overflow-y-auto">
            {mySessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  Buổi {s.index} · {formatVn(s.startsAt, "EEE dd/MM")} {formatTime(s.startsAt)}
                  <span className="block text-sm text-muted">Đã điểm danh {s._count.attendances} em</span>
                </span>
                <span className="flex items-center gap-2">
                  {s.status !== "SCHEDULED" && <Badge tone={SESSION_STATUS[s.status].tone}>{SESSION_STATUS[s.status].label}</Badge>}
                  {s.status !== "CANCELLED" && (
                    <Link href={`/giao-vien/buoi/${s.id}`} className="inline-flex min-h-11 items-center">
                      Điểm danh
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {klass.isOwner && (
        <>
          <Card title="Bài tập" className="mt-6" action={<ButtonLink href={`/giao-vien/bai-tap/moi?lop=${klass.id}`} size="sm">Tạo bài tập</ButtonLink>}>
            {assignments.length === 0 ? (
              <EmptyState message="Chưa có bài tập nào." />
            ) : (
              <ul className="divide-y divide-line">
                {assignments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span>
                      <Link href={`/giao-vien/bai-tap/${a.id}`} className="font-medium">
                        {a.title}
                      </Link>
                      <span className="block text-sm text-muted">
                        Hạn {formatDateTime(a.dueAt)} · {a._count.questions} câu
                        {a._count.submissions > 0 ? ` · ${a._count.submissions} bài chờ chấm` : ""}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
                      {a.resultsPublishedAt && <Badge tone="success">Đã công bố</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {gradebook && gradebook.assignments.length > 0 && (
            <Card title="Bảng điểm" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <caption className="sr-only">Bảng điểm lớp {klass.code}</caption>
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Học sinh
                      </th>
                      {gradebook.assignments.map((a) => (
                        <th key={a.id} scope="col" className="px-2 py-2 font-medium">
                          {a.title}
                          <span className="block font-normal">/{a.maxScore}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.rows.map((r) => (
                      <tr key={r.student.id} className="border-b border-line last:border-0">
                        <th scope="row" className="py-2 pr-4 font-normal">
                          {r.student.fullName}
                        </th>
                        {r.cells.map((c, i) => (
                          <td key={gradebook.assignments[i]!.id} className="px-2 py-2">
                            {!c || c.status === "IN_PROGRESS" ? <span className="text-muted">—</span> : c.status === "SUBMITTED" ? "Chờ chấm" : c.score}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
