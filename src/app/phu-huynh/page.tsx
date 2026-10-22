import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Clock, MessageSquare, User } from "lucide-react";
import Link from "next/link";
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
      <div className="space-y-6">
        <Flash code={sp.thongbao} />
        <PageHeader title={`Xin chào, ${actor.fullName}`} />
        <EmptyState message="Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ giáo vụ của học viện để được hỗ trợ ghép hồ sơ con." />
      </div>
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
    <div className="space-y-6">
      <Flash code={sp.thongbao} />

      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Phụ huynh"
        summary={`Đồng hành và theo dõi lịch học, chuyên cần, bài tập và kết quả của con ${child.fullName} tại CoreLink Academy.`}
      >
        <BannerLink href={`/phu-huynh/bai-tap?con=${child.id}`}>
          <BookOpen className="size-4" />
          <span>Bài tập của con</span>
        </BannerLink>
        <BannerLink href="/phu-huynh/don-nghi">
          <span>Gửi đơn xin nghỉ phép</span>
        </BannerLink>
        <BannerLink href="/tin-nhan">
          <MessageSquare className="size-4" />
          <span>Nhắn tin với giáo viên</span>
        </BannerLink>
      </WelcomeBanner>

      {/* Child Switcher if multiple children */}
      <ChildPicker items={children} currentId={child.id} basePath="/phu-huynh" />

      {/* Student Badge Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-2xs sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary font-heading font-extrabold text-lg shadow-2xs">
            {child.fullName.trim().split(" ").slice(-1)[0]?.[0] ?? "C"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-ink leading-tight">
              {child.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
              {child.gradeLevel && (
                <span className="rounded-md bg-brand-tint px-2 py-0.5 font-bold text-primary">
                  Khối Lớp {child.gradeLevel}
                </span>
              )}
              {child.studentCode && (
                <span className="font-mono text-muted">Mã: {child.studentCode}</span>
              )}
              <span className="text-subtle">• Đang theo học tại cơ sở</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/phu-huynh/bai-tap?con=${child.id}`}
            className="rounded-full bg-primary-soft hover:bg-primary hover:text-white px-3.5 py-1.5 text-xs font-bold text-primary transition-colors no-underline"
          >
            Xem bài tập của con →
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Lớp đang học */}
        <Card title={`Khóa & Lớp đang theo học (${classes.length})`}>
          {classes.length === 0 ? (
            <EmptyState message="Con chưa ghi danh lớp nào trong học kỳ này." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {classes.map(({ class: c, status }) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-line bg-paper/60 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface hover:shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-primary bg-primary-soft px-2.5 py-0.5 rounded-md">
                      {c.code}
                    </span>
                    {status !== "ACTIVE" && (
                      <Badge tone={ENROLLMENT_STATUS[status].tone}>
                        {ENROLLMENT_STATUS[status].label}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-ink">{c.course.title}</h3>
                  <div className="mt-2.5 space-y-1 text-xs text-muted">
                    <p className="flex items-center gap-1.5 font-medium text-ink">
                      <Clock className="size-3.5 text-primary" />
                      {formatSchedule(c.weekdays, c.startTime, c.endTime)}
                      {c.room?.name && <span>· {c.room.name}</span>}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted" />
                      Giáo viên phụ trách: <span className="font-semibold text-ink">{c.teacher.fullName}</span>
                    </p>
                    <p className="text-subtle">
                      Khai giảng: {formatDate(c.startDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Lịch học tuần */}
        <WeekSchedule
          weekStart={weekStart}
          sessions={sessions}
          weekHref={(w) => `/phu-huynh?con=${child.id}&tuan=${w}`}
          sessionHref={(s) => `/phu-huynh/buoi/${s.id}?con=${child.id}`}
          showTeacher
        />

        {/* Chuyên cần & Kết quả */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AttendanceSummary data={attendance} />
          <ResultsList results={results} />
        </div>

        {/* Nhận xét giáo viên */}
        {evaluations && evaluations.length > 0 && (
          <EvaluationList evaluations={evaluations} />
        )}
      </div>
    </div>
  );
}
