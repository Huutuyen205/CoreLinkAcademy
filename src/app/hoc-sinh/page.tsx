import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Clock,
  Trophy,
} from "lucide-react";
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
export default async function StudentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ thongbao?: string | string[]; tuan?: string }>;
}) {
  const actor = await requireRole("STUDENT");
  const sp = await searchParams;
  const weekStart = parseWeekParam(sp.tuan);
  const { from, to } = vnWeekRange(weekStart);
  const [sessions, assignments, results] = await Promise.all([
    listSessionsInRange(actor, from, to),
    listMyAssignments(actor),
    listPublishedResults(actor, actor.id),
  ]);
  const now = new Date();
  const todo = assignments.filter(
    (a) =>
      a.enrollmentStatus === "ACTIVE" &&
      a.status === "PUBLISHED" &&
      (a.submissionStatus === null || a.submissionStatus === "IN_PROGRESS") &&
      (now <= a.dueAt || a.allowLate),
  );

  return (
    <div className="space-y-6">
      <Flash code={sp.thongbao} />

      <WelcomeBanner
        name={actor.fullName}
        roleLabel="Học sinh"
        summary={
          todo.length > 0
            ? `Em có ${todo.length} bài tập cần hoàn thành. Hãy sắp xếp thời gian làm bài sớm để đạt điểm số cao nhất nhé!`
            : "Em đã hoàn thành xuất sắc tất cả bài tập được giao. Hãy xem lại kiến thức và chuẩn bị cho buổi học tiếp theo!"
        }
      >
        <BannerLink href="/hoc-sinh/bai-tap">
          <BookOpenCheck className="size-4" />
          <span>Danh sách bài tập</span>
        </BannerLink>
        <BannerLink href="/tai-lieu">
          <BookOpen className="size-4" />
          <span>Kho tài liệu học tập</span>
        </BannerLink>
        <BannerLink href="/tin-nhan">
          <span>Trò chuyện nhóm lớp</span>
        </BannerLink>
      </WelcomeBanner>

      {/* ─── 3 KPI Stat Cards ─── */}
      <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <li>
          <StatCard
            icon={BookOpenCheck}
            label="Bài tập cần hoàn thành"
            value={todo.length}
            href="/hoc-sinh/bai-tap"
            tone={todo.length > 0 ? "warning" : "success"}
            index={0}
          />
        </li>
        <li>
          <StatCard
            icon={CalendarDays}
            label="Buổi học tuần này"
            value={sessions.filter((s) => s.status !== "CANCELLED").length}
            href="/hoc-sinh/lich"
            index={1}
          />
        </li>
        <li>
          <StatCard
            icon={Trophy}
            label="Bài kiểm tra đã có điểm"
            value={results.length}
            href="/hoc-sinh/ket-qua"
            tone="success"
            index={2}
          />
        </li>
      </ul>

      {/* ─── Content Pillars ─── */}
      <div className="space-y-6">
        {/* Card Bài cần làm */}
        <Card
          title={`Bài tập cần nộp (${todo.length})`}
          action={
            <Link
              href="/hoc-sinh/bai-tap"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline rounded-lg bg-primary-soft px-3 py-1.5"
            >
              <span>Xem tất cả</span>
              <span>→</span>
            </Link>
          }
        >
          {todo.length === 0 ? (
            <EmptyState message="Em đã hoàn thành tất cả bài tập. Rất đáng khen ngợi!" />
          ) : (
            <ul className="divide-y divide-line">
              {todo.slice(0, 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="space-y-1">
                    <Link
                      href={`/hoc-sinh/bai-tap/${a.id}`}
                      className="font-bold text-ink text-sm sm:text-base hover:text-primary transition-colors block"
                    >
                      {a.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="font-semibold text-primary font-mono bg-primary-soft px-2 py-0.5 rounded-md">
                        {a.classCode}
                      </span>
                      <span className="flex items-center gap-1 text-warning font-medium">
                        <Clock className="size-3.5" />
                        Hạn chót: {formatDateTime(a.dueAt)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/hoc-sinh/bai-tap/${a.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-strong text-white px-4 py-2 text-xs font-bold shadow-sm transition-all hover:scale-102"
                  >
                    <span>Làm bài ngay</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Thời khóa biểu tuần */}
        <WeekSchedule
          weekStart={weekStart}
          sessions={sessions}
          weekHref={(w) => `/hoc-sinh?tuan=${w}`}
          sessionHref={(s) => `/hoc-sinh/buoi/${s.id}`}
        />

        {/* Kết quả học tập mới */}
        <ResultsList results={results.slice(0, 5)} linkToAssignment />
      </div>
    </div>
  );
}
