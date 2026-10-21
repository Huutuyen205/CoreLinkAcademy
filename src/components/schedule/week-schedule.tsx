import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui/feedback";
import type { listSessionsInRange } from "@/server/academic/service";
import { SESSION_STATUS } from "@/lib/labels";
import { addDays } from "@/lib/schedule";
import { formatTime, vnDateKey, WEEKDAY_LABELS } from "@/lib/time";

type Session = Awaited<ReturnType<typeof listSessionsInRange>>[number];

type Props = {
  weekStart: string;
  sessions: Session[];
  /** URL cho tuần khác, nhận `YYYY-MM-DD`. */
  weekHref: (weekStart: string) => string;
  /** Liên kết của từng buổi (vd. trang điểm danh của GV). */
  sessionHref?: (s: Session) => string | null;
  showTeacher?: boolean;
};

const ddmm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;

/** Lịch tuần theo giờ Việt Nam (FR-022): một cột mỗi ngày trên desktop, danh sách theo ngày trên điện thoại. */
export function WeekSchedule({ weekStart, sessions, weekHref, sessionHref, showTeacher }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map(days.map((d) => [d, [] as Session[]]));
  for (const s of sessions) byDay.get(vnDateKey(s.startsAt))?.push(s);
  const today = vnDateKey(new Date());

  return (
    <section aria-label="Lịch tuần">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          Tuần {ddmm(days[0]!)} – {ddmm(days[6]!)}/{days[6]!.slice(0, 4)}
        </p>
        <nav aria-label="Chọn tuần" className="flex gap-2 text-sm">
          <Link href={weekHref(addDays(weekStart, -7))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tuần trước
          </Link>
          <Link href={weekHref(vnDateKey(new Date()))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tuần này
          </Link>
          <Link href={weekHref(addDays(weekStart, 7))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tuần sau
          </Link>
        </nav>
      </div>
      {sessions.length === 0 ? (
        <EmptyState message="Không có buổi học nào trong tuần này." />
      ) : (
        <ol className="grid gap-3 lg:grid-cols-7">
          {days.map((d, i) => {
            const list = byDay.get(d) ?? [];
            return (
              <li key={d} className={`rounded-block border bg-surface p-3 ${d === today ? "border-primary" : "border-line"} ${list.length === 0 ? "hidden lg:block" : ""}`}>
                <p className="text-sm font-medium">
                  {WEEKDAY_LABELS[i + 1]} <span className="text-muted">{ddmm(d)}</span>
                  {d === today && <span className="sr-only"> (hôm nay)</span>}
                </p>
                <ul className="mt-2 space-y-2">
                  {list.map((s) => {
                    const href = sessionHref?.(s);
                    const body = (
                      <>
                        <span className="block font-medium">
                          {formatTime(s.startsAt)}–{formatTime(s.endsAt)}
                        </span>
                        <span className="block">{s.class.code}</span>
                        <span className="block text-muted">{s.class.course.title}</span>
                        {s.room && <span className="block text-muted">{s.room.name}</span>}
                        {showTeacher && <span className="block text-muted">GV {s.teacher.fullName}</span>}
                      </>
                    );
                    return (
                      <li key={s.id} className={`rounded-control border border-line p-2 text-sm ${s.status === "CANCELLED" ? "opacity-70" : ""}`}>
                        {href ? (
                          <Link href={href} className="block text-ink no-underline hover:text-primary">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                        {s.status !== "SCHEDULED" && (
                          <span className="mt-1 inline-block">
                            <Badge tone={SESSION_STATUS[s.status].tone}>{SESSION_STATUS[s.status].label}</Badge>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
