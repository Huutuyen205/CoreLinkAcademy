import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChildPicker } from "@/components/learner/child-picker";
import { BannerLink, WelcomeBanner } from "@/components/layout/welcome-banner";
import { EvaluationList } from "@/components/learner/evaluation-list";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { Flash } from "@/components/layout/flash";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listStudentClasses } from "@/server/academic/learner";
import { listSessionsInRange } from "@/server/academic/service";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { listEvaluationsOfStudent } from "@/server/evaluations/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { listMyChildren } from "@/server/users/service";
import { ENROLLMENT_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDate, parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Theo dõi con" };

type SP = { con?: string; tuan?: string; thongbao?: string };

// UC-011 — FR-022, FR-025, FR-033, FR-034. Con không liên kết → 404 (TC-034).
export default async function ParentDashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("PARENT");
  const sp = await searchParams;
  const children = await listMyChildren(actor);

  if (children.length === 0) {
    return (
      <>
        <Flash code={sp.thongbao} />
        <PageHeader title={`Xin chào, ${actor.fullName}`} />
        <EmptyState message="Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ giáo vụ của học viện." />
      </>
    );
  }

  const childId = sp.con ?? children[0]!.id;
  const child = children.find((c) => c.id === childId);
  if (!child) notFound();

  const weekStart = parseWeekParam(sp.tuan);
  const { from, to } = vnWeekRange(weekStart);
  const [sessions, attendance, results, classes, evaluations] = await Promise.all([
    orNotFound(listSessionsInRange(actor, from, to, child.id)),
    orNotFound(getStudentAttendance(actor, child.id)),
    orNotFound(listPublishedResults(actor, child.id)),
    orNotFound(listStudentClasses(actor, child.id)),
    orNotFound(listEvaluationsOfStudent(actor, child.id)),
  ]);

  return (
    <>
      <Flash code={sp.thongbao} />
      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Phụ huynh"
        summary={`Theo dõi lịch học, chuyên cần, bài tập và kết quả của ${children.length > 1 ? `${children.length} con` : child.fullName}.`}
      >
        <BannerLink href={`/phu-huynh/bai-tap?con=${child.id}`}>Bài tập của con</BannerLink>
        <BannerLink href="/phu-huynh/don-nghi">Đơn xin nghỉ</BannerLink>
        <BannerLink href="/tin-nhan">Nhắn giáo viên</BannerLink>
      </WelcomeBanner>
      <ChildPicker items={children} currentId={child.id} basePath="/phu-huynh" />
      <h2 className="mb-4 text-xl">
        {child.fullName}
        {child.gradeLevel ? ` · lớp ${child.gradeLevel}` : ""}
      </h2>
      <div className="space-y-6">
        <Card title={`Lớp đang học (${classes.length})`}>
          {classes.length === 0 ? (
            <EmptyState message="Con chưa ghi danh lớp nào." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {classes.map(({ class: c, status }) => (
                <li key={c.id} className="rounded-control border border-line p-3">
                  <p className="flex flex-wrap items-center justify-between gap-2 font-medium">
                    {c.code}
                    {status !== "ACTIVE" && <Badge tone={ENROLLMENT_STATUS[status].tone}>{ENROLLMENT_STATUS[status].label}</Badge>}
                  </p>
                  <p className="text-sm">{c.course.title}</p>
                  <p className="text-sm text-muted">
                    {formatSchedule(c.weekdays, c.startTime, c.endTime)} · {c.room?.name ?? "chưa xếp phòng"}
                  </p>
                  <p className="text-sm text-muted">
                    GV {c.teacher.fullName} · khai giảng {formatDate(c.startDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/phu-huynh?con=${child.id}&tuan=${w}`} sessionHref={(s) => `/phu-huynh/buoi/${s.id}?con=${child.id}`} showTeacher />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AttendanceSummary data={attendance} />
          <ResultsList results={results} />
        </div>
        <EvaluationList evaluations={evaluations} hideWhenEmpty />
      </div>
    </>
  );
}
