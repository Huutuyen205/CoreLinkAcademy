import type { Metadata } from "next";
import Link from "next/link";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";
import { orNotFound } from "@/server/page";
import { getStudentProfile } from "@/server/people/service";
import { ENROLLMENT_STATUS, EVALUATION_STATUS, memberStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Hồ sơ học sinh" };

// Giáo viên §1 "Xem hồ sơ học sinh": điểm, chuyên cần, phụ huynh — chỉ học sinh lớp mình (TC-035), chỉ đọc.
export default async function TeacherStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const s = await orNotFound(getStudentProfile(actor, id));
  const [attendance, results, evaluations] = await Promise.all([getStudentAttendance(actor, id), listPublishedResults(actor, id), listEvaluationsOfStudent(actor, id)]);
  const ms = memberStatusLabel("STUDENT", s.memberStatus);

  return (
    <>
      <PageHeader
        title={s.fullName}
        description={[s.studentCode, s.gradeLevel !== null ? (s.gradeLevel === 0 ? "Tiền tiểu học" : `lớp ${s.gradeLevel}`) : null].filter(Boolean).join(" · ")}
        action={<Badge tone={ms.tone}>{ms.label}</Badge>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <AttendanceSummary data={attendance} />
          <ResultsList results={results} />
          <Card title="Đánh giá định kỳ của tôi">
            {evaluations.length === 0 ? (
              <EmptyState message="Chưa có đánh giá." />
            ) : (
              <ul className="space-y-3">
                {evaluations.map((ev) => (
                  <li key={ev.id} className="rounded-control border border-line p-3">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {ev.period} · lớp {ev.class.code} <Badge tone={EVALUATION_STATUS[ev.status].tone}>{EVALUATION_STATUS[ev.status].label}</Badge>
                    </p>
                    <p className="mt-1 whitespace-pre-line">{ev.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Lớp với tôi">
            <ul className="space-y-2">
              {s.enrollments.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/giao-vien/lop/${e.class.id}`}>{e.class.code}</Link>
                  <Badge tone={ENROLLMENT_STATUS[e.status].tone}>{ENROLLMENT_STATUS[e.status].label}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Phụ huynh">
            {s.parentLinks.length === 0 ? (
              <p className="text-sm text-muted">Chưa liên kết phụ huynh.</p>
            ) : (
              <ul className="space-y-2">
                {s.parentLinks.map(({ parent }) => (
                  <li key={parent.id}>
                    {parent.fullName}
                    {parent.phone && (
                      <a href={`tel:${parent.phone}`} className="block text-sm">
                        {formatPhone(parent.phone)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-muted">Nhắn tin cho phụ huynh tại mục Tin nhắn.</p>
          </Card>
          {s.profileNote && (
            <Card title="Ghi chú hồ sơ">
              <p className="whitespace-pre-line text-sm">{s.profileNote}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
