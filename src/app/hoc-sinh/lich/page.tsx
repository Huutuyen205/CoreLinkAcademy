import type { Metadata } from "next";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch học" };

// FR-022.
export default async function StudentSchedulePage({ searchParams }: { searchParams: Promise<{ tuan?: string }> }) {
  const actor = await requireRole("STUDENT");
  const weekStart = parseWeekParam((await searchParams).tuan);
  const { from, to } = vnWeekRange(weekStart);
  const sessions = await listSessionsInRange(actor, from, to);
  return (
    <>
      <PageHeader title="Lịch học" description="Giờ hiển thị theo giờ Việt Nam." />
      <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/hoc-sinh/lich?tuan=${w}`} sessionHref={(s) => `/hoc-sinh/buoi/${s.id}`} showTeacher />
    </>
  );
}
