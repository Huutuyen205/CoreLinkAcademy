import type { Metadata } from "next";
import { MonthSchedule, parseMonthParam, shiftMonth } from "@/components/schedule/month-schedule";
import { ViewSwitch } from "@/components/schedule/view-switch";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { parseWeekParam, vnToUtc, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch dạy" };

// FR-022: lịch dạy theo tuần (lưới khung giờ) hoặc theo tháng; bấm một buổi để vào chi tiết buổi.
export default async function TeacherSchedulePage({ searchParams }: { searchParams: Promise<{ tuan?: string; xem?: string; thang?: string }> }) {
  const actor = await requireRole("TEACHER");
  const sp = await searchParams;
  const monthView = sp.xem === "thang";
  const weekStart = parseWeekParam(sp.tuan);
  const month = parseMonthParam(sp.thang);
  const { from, to } = monthView ? { from: vnToUtc(`${month}-01`, "00:00"), to: vnToUtc(`${shiftMonth(month, 1)}-01`, "00:00") } : vnWeekRange(weekStart);
  const sessions = await listSessionsInRange(actor, from, to);
  const href = (s: { id: string }) => `/giao-vien/buoi/${s.id}`;
  return (
    <>
      <PageHeader title="Lịch dạy" action={<a href="/lich/xuat" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary no-underline hover:bg-primary-soft">Thêm vào lịch điện thoại</a>} />
      <ViewSwitch monthView={monthView} weekHref="/giao-vien/lich" monthHref="/giao-vien/lich?xem=thang" />
      {monthView ? (
        <MonthSchedule month={month} sessions={sessions} monthHref={(m) => `/giao-vien/lich?xem=thang&thang=${m}`} sessionHref={href} dayHref={(d) => `/giao-vien/lich?tuan=${d}`} />
      ) : (
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/giao-vien/lich?tuan=${w}`} sessionHref={href} />
      )}
    </>
  );
}
