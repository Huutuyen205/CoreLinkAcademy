import type { Metadata } from "next";
import { BookOpenCheck, CalendarDays, Trophy } from "lucide-react";
import Link from "next/link";
import { ResultsList } from "@/components/learner/learner-progress";
import { Flash } from "@/components/layout/flash";
import { BannerLink, WelcomeBanner } from "@/components/layout/welcome-banner";
import { StatCard } from "@/components/ui/stat-card";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { Card, EmptyState } from "@/components/ui/feedback";
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
      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Học sinh"
        summary={todo.length > 0 ? `Em có ${todo.length} bài cần làm. Cố lên nhé!` : "Em đã hoàn thành hết bài được giao. Tuyệt vời!"}
      >
        <BannerLink href="/hoc-sinh/bai-tap">Bài tập</BannerLink>
        <BannerLink href="/tai-lieu">Tài liệu</BannerLink>
        <BannerLink href="/tin-nhan">Nhóm lớp</BannerLink>
      </WelcomeBanner>
      <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <li>
          <StatCard icon={BookOpenCheck} label="Bài cần làm" value={todo.length} href="/hoc-sinh/bai-tap" tone={todo.length > 0 ? "warning" : "success"} index={0} />
        </li>
        <li>
          <StatCard icon={CalendarDays} label="Buổi học tuần này" value={sessions.filter((s) => s.status !== "CANCELLED").length} href="/hoc-sinh/lich" index={1} />
        </li>
        <li>
          <StatCard icon={Trophy} label="Bài đã có điểm" value={results.length} href="/hoc-sinh/ket-qua" tone="success" index={2} />
        </li>
      </ul>
      <div className="space-y-6">
        <Card title={`Bài cần làm (${todo.length})`} action={<Link href="/hoc-sinh/bai-tap" className="inline-flex min-h-11 shrink-0 items-center">Tất cả bài tập</Link>}>
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
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/hoc-sinh?tuan=${w}`} sessionHref={(s) => `/hoc-sinh/buoi/${s.id}`} />
        <ResultsList results={results.slice(0, 5)} linkToAssignment />
      </div>
    </>
  );
}
