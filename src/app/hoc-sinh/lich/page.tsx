import type { Metadata } from "next";
import Link from "next/link";
import { MonthSchedule, parseMonthParam, shiftMonth } from "@/components/schedule/month-schedule";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { cn } from "@/lib/format";
import { parseWeekParam, vnToUtc, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch học" };

// FR-022 + HS §3: thời khóa biểu theo tuần hoặc theo tháng.
export default async function StudentSchedulePage({ searchParams }: { searchParams: Promise<{ tuan?: string; xem?: string; thang?: string }> }) {
  const actor = await requireRole("STUDENT");
  const sp = await searchParams;
  const monthView = sp.xem === "thang";
  const weekStart = parseWeekParam(sp.tuan);
  const month = parseMonthParam(sp.thang);
  const { from, to } = monthView ? { from: vnToUtc(`${month}-01`, "00:00"), to: vnToUtc(`${shiftMonth(month, 1)}-01`, "00:00") } : vnWeekRange(weekStart);
  const sessions = await listSessionsInRange(actor, from, to);
  const tab = (active: boolean) =>
    cn("inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline", active ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink");

  return (
    <>
      <PageHeader
        title="Lịch học"
        description="Giờ hiển thị theo giờ Việt Nam. Bấm một buổi để xem chi tiết, nhật ký buổi học và bài về nhà."
        action={<a href="/lich/xuat" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary no-underline hover:bg-primary-soft">📅 Thêm vào lịch điện thoại</a>}
      />
      <nav aria-label="Kiểu xem" className="mb-4 flex gap-2">
        <Link href="/hoc-sinh/lich" aria-current={!monthView ? "page" : undefined} className={tab(!monthView)}>
          Theo tuần
        </Link>
        <Link href="/hoc-sinh/lich?xem=thang" aria-current={monthView ? "page" : undefined} className={tab(monthView)}>
          Theo tháng
        </Link>
      </nav>
      {monthView ? (
        <MonthSchedule month={month} sessions={sessions} monthHref={(m) => `/hoc-sinh/lich?xem=thang&thang=${m}`} sessionHref={(s) => `/hoc-sinh/buoi/${s.id}`} />
      ) : (
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/hoc-sinh/lich?tuan=${w}`} sessionHref={(s) => `/hoc-sinh/buoi/${s.id}`} showTeacher />
      )}
    </>
  );
}
