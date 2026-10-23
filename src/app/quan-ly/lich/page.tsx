import type { Metadata } from "next";
import { WeekSchedule } from "@/components/schedule/week-schedule";
import { ButtonLink } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionButton } from "@/components/ui/row-actions";
import { sendRemindersNowAction } from "@/server/notifications/actions";
import { PageHeader } from "@/components/ui/feedback";
import { listSessionsForManager, scheduleFilterOptions } from "@/server/academic/operations";
import { requireRole } from "@/server/auth/guard";
import { parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch tổng" };

type SP = { tuan?: string; gv?: string; phong?: string; lop?: string };

// Admin §7, §8 — FR-038: xem lịch theo lớp / giáo viên / phòng; kiểm tra tình trạng sử dụng phòng.
export default async function ManagerSchedulePage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const options = await scheduleFilterOptions(actor);
  const pick = (v: string | undefined, list: { id: string }[]) => (typeof v === "string" && list.some((x) => x.id === v) ? v : undefined);
  const teacherId = pick(sp.gv, options.teachers);
  const roomId = pick(sp.phong, options.rooms);
  const classId = pick(sp.lop, options.classes);
  const weekStart = parseWeekParam(sp.tuan);
  const { from, to } = vnWeekRange(weekStart);
  const sessions = await listSessionsForManager(actor, from, to, { teacherId, roomId, classId });

  const query = (w: string) => {
    const p = new URLSearchParams({ tuan: w });
    if (teacherId) p.set("gv", teacherId);
    if (roomId) p.set("phong", roomId);
    if (classId) p.set("lop", classId);
    return `/quan-ly/lich?${p.toString()}`;
  };
  const roomName = roomId ? options.rooms.find((r) => r.id === roomId)?.name : null;

  return (
    <>
      <PageHeader
        title="Lịch tổng"
        description="Toàn bộ buổi học trong tuần. Lọc theo giáo viên, phòng hoặc lớp để kiểm tra lịch trống và tình trạng sử dụng phòng."
        action={
          <ActionButton action={sendRemindersNowAction} hidden={{}} icon="message" tone="primary" confirm="Gửi thông báo nhắc lịch học ngày mai cho giáo viên, học sinh, phụ huynh ngay bây giờ? (Hệ thống cũng tự gửi lúc 19:00 hằng ngày; không gửi trùng.)">
            Nhắc lịch ngày mai
          </ActionButton>
        }
      />
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <input type="hidden" name="tuan" value={weekStart} />
        <SelectField name="gv" label="Giáo viên" placeholder="Tất cả" defaultValue={teacherId ?? ""} options={options.teachers.map((t) => ({ value: t.id, label: t.fullName }))} />
        <SelectField
          name="phong"
          label="Phòng"
          placeholder="Tất cả"
          defaultValue={roomId ?? ""}
          options={options.rooms.map((r) => ({ value: r.id, label: `${r.name}${r.isActive ? "" : " (ngừng)"}` }))}
        />
        <SelectField name="lop" label="Lớp" placeholder="Tất cả" defaultValue={classId ?? ""} options={options.classes.map((c) => ({ value: c.id, label: c.code }))} />
        <div className="flex gap-2">
          {(teacherId || roomId || classId) && (
            <ButtonLink href={`/quan-ly/lich?tuan=${weekStart}`} variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>
      {roomName && (
        <p className="mb-4 text-sm text-muted">
          Phòng {roomName}: {sessions.filter((s) => s.status !== "CANCELLED").length} buổi có lịch trong tuần. Ngày không có buổi là phòng trống cả ngày.
        </p>
      )}
      <WeekSchedule weekStart={weekStart} sessions={sessions} weekHref={query} sessionHref={(s) => `/quan-ly/buoi/${s.id}`} showTeacher />
    </>
  );
}
