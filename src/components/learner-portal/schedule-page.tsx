import { MonthSchedule, parseMonthParam, shiftMonth } from "@/components/schedule/month-schedule";
import { ViewSwitch } from "@/components/schedule/view-switch";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { requireLearner } from "@/server/auth/learner";
import { parseWeekParam, vnToUtc, vnWeekRange } from "@/lib/time";

type SP = { con?: string; tuan?: string; xem?: string; thang?: string };

// FR-022 + HS §3: thời khóa biểu theo tuần (lưới khung giờ) hoặc theo tháng; phụ huynh xem của con đang chọn.
export async function LearnerSchedulePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { student, base, isParent } = await requireLearner({ con: sp.con, den: "/phu-huynh/lich" });
  const monthView = sp.xem === "thang";
  const weekStart = parseWeekParam(sp.tuan);
  const month = parseMonthParam(sp.thang);
  const { from, to } = monthView ? { from: vnToUtc(`${month}-01`, "00:00"), to: vnToUtc(`${shiftMonth(month, 1)}-01`, "00:00") } : vnWeekRange(weekStart);
  const sessions = await listSessionsInRange(student, from, to);
  const href = (s: { id: string }) => `${base}/buoi/${s.id}`;
  const exportHref = isParent ? `/lich/xuat?con=${student.id}` : "/lich/xuat";

  return (
    <>
      <PageHeader
        title="Lịch học"
        action={<a href={exportHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-primary/30 bg-surface px-3 text-sm font-semibold text-primary no-underline hover:bg-primary-soft">Thêm vào lịch điện thoại</a>}
      />
      <ViewSwitch monthView={monthView} weekHref={`${base}/lich`} monthHref={`${base}/lich?xem=thang`} />
      {monthView ? (
        <MonthSchedule month={month} sessions={sessions} monthHref={(m) => `${base}/lich?xem=thang&thang=${m}`} sessionHref={href} dayHref={(d) => `${base}/lich?tuan=${d}`} />
      ) : (
        <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `${base}/lich?tuan=${w}`} sessionHref={href} showTeacher />
      )}
    </>
  );
}
