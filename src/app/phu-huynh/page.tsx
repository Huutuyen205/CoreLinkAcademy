import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceSummary, ResultsList } from "@/components/learner/learner-progress";
import { Flash } from "@/components/layout/flash";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { listPublishedResults } from "@/server/assessment/service";
import { getStudentAttendance } from "@/server/attendance/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { listMyChildren } from "@/server/users/service";
import { cn } from "@/lib/format";
import { parseWeekParam, vnWeekRange } from "@/lib/time";

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
  const [sessions, attendance, results] = await Promise.all([
    orNotFound(listSessionsInRange(actor, from, to, child.id)),
    orNotFound(getStudentAttendance(actor, child.id)),
    orNotFound(listPublishedResults(actor, child.id)),
  ]);

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader title={`Xin chào, ${actor.fullName}`} description="Lịch học, chuyên cần và điểm đã công bố của con." />
      {children.length > 1 && (
        <nav aria-label="Chọn con" className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/phu-huynh?con=${c.id}`}
              aria-current={c.id === child.id ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 no-underline",
                c.id === child.id ? "border-primary bg-primary-soft font-medium text-primary" : "border-line bg-surface text-ink",
              )}
            >
              {c.fullName}
            </Link>
          ))}
        </nav>
      )}
      <h2 className="mb-4 text-xl">
        {child.fullName}
        {child.gradeLevel ? ` · lớp ${child.gradeLevel}` : ""}
      </h2>
      <div className="space-y-6">
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/phu-huynh?con=${child.id}&tuan=${w}`} showTeacher />
        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceSummary data={attendance} />
          <ResultsList results={results} />
        </div>
      </div>
    </>
  );
}
