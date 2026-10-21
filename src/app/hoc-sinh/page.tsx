import type { Metadata } from "next";
import Link from "next/link";
import { ResultsList } from "@/components/learner/learner-progress";
import { Flash } from "@/components/layout/flash";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { listMyAssignments, listPublishedResults } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { formatDateTime, parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Tổng quan học sinh" };

// FR-034: lịch tuần, bài cần làm, điểm mới.
export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ thongbao?: string | string[]; tuan?: string }> }) {
  const actor = await requireRole("STUDENT");
  const sp = await searchParams;
  const weekStart = parseWeekParam(sp.tuan);
  const { from, to } = vnWeekRange(weekStart);
  const [sessions, assignments, results] = await Promise.all([listSessionsInRange(actor, from, to), listMyAssignments(actor), listPublishedResults(actor, actor.id)]);
  const now = new Date();
  const todo = assignments.filter(
    (a) => a.enrollmentStatus === "ACTIVE" && a.status === "PUBLISHED" && (a.submissionStatus === null || a.submissionStatus === "IN_PROGRESS") && (now <= a.dueAt || a.allowLate),
  );

  return (
    <>
      <Flash code={sp.thongbao} />
      <PageHeader title={`Xin chào, ${actor.fullName}`} />
      <div className="space-y-6">
        <Card title={`Bài cần làm (${todo.length})`} action={<Link href="/hoc-sinh/bai-tap">Tất cả bài tập</Link>}>
          {todo.length === 0 ? (
            <EmptyState message="Bạn không có bài nào cần làm." />
          ) : (
            <ul className="divide-y divide-line">
              {todo.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2">
                  <Link href={`/hoc-sinh/bai-tap/${a.id}`} className="font-medium">
                    {a.title}
                  </Link>
                  <span className="block text-sm text-muted">
                    {a.classCode} · hạn {formatDateTime(a.dueAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/hoc-sinh?tuan=${w}`} />
        <ResultsList results={results.slice(0, 5)} linkToAssignment />
      </div>
    </>
  );
}
