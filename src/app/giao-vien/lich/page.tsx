import type { Metadata } from "next";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsInRange } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch dạy" };

// FR-022.
export default async function TeacherSchedulePage({ searchParams }: { searchParams: Promise<{ tuan?: string }> }) {
  const actor = await requireRole("TEACHER");
  const weekStart = parseWeekParam((await searchParams).tuan);
  const { from, to } = vnWeekRange(weekStart);
  const sessions = await listSessionsInRange(actor, from, to);
  return (
    <>
      <PageHeader title="Lịch dạy" description="Giờ hiển thị theo giờ Việt Nam. Chọn một buổi để điểm danh." />
      <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={(w) => `/giao-vien/lich?tuan=${w}`} sessionHref={(s) => (s.status === "CANCELLED" ? null : `/giao-vien/buoi/${s.id}`)} />
    </>
  );
}
