import Link from "next/link";
import type { listSessionsInRange } from "@/server/academic/service";
import { cn } from "@/lib/format";
import { addDays } from "@/lib/schedule";
import { formatTime, vnDateKey, WEEKDAY_LABELS } from "@/lib/time";

type Session = Awaited<ReturnType<typeof listSessionsInRange>>[number];

type Props = {
  weekStart: string;
  sessions: Session[];
  /** URL cho tuần khác, nhận `YYYY-MM-DD`. */
  weekHref: (weekStart: string) => string;
  /** Liên kết của từng buổi (vd. trang chi tiết buổi của GV). */
  sessionHref?: (s: Session) => string | null;
  showTeacher?: boolean;
};

const HOUR_PX = 56;
const ddmm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
const minutesOf = (d: Date) => {
  const [h, m] = formatTime(d).split(":").map(Number) as [number, number];
  return h * 60 + m;
};

type Placed = { s: Session; start: number; end: number; lane: number; lanes: number };

/** Xếp các buổi trùng giờ trong một ngày thành các làn song song. */
function place(list: Session[]): Placed[] {
  const items = list.map((s) => ({ s, start: minutesOf(s.startsAt), end: Math.max(minutesOf(s.endsAt), minutesOf(s.startsAt) + 30) })).sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Placed[] = [];
  let group: Placed[] = [];
  let groupEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...group.map((g) => g.lane + 1));
    for (const g of group) out.push({ ...g, lanes });
    group = [];
  };
  for (const it of items) {
    if (group.length > 0 && it.start >= groupEnd) flush();
    const used = new Set(group.filter((g) => g.end > it.start).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    group.push({ ...it, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, it.end);
  }
  flush();
  return out;
}

const tone = (s: Session) =>
  s.status === "CANCELLED"
    ? "border-danger/40 bg-danger-soft text-danger line-through"
    : s.status === "COMPLETED"
      ? "border-success/40 bg-success-soft text-success"
      : "border-primary/40 bg-primary-soft text-primary";

/** Lịch tuần theo giờ Việt Nam (FR-022): hàng dọc là khung giờ, hàng ngang là thứ. */
export function WeekSchedule({ weekStart, sessions, weekHref, sessionHref, showTeacher }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map(days.map((d) => [d, [] as Session[]]));
  for (const s of sessions) byDay.get(vnDateKey(s.startsAt))?.push(s);
  const today = vnDateKey(new Date());
  const nowMin = minutesOf(new Date());

  const starts = sessions.map((s) => minutesOf(s.startsAt));
  const ends = sessions.map((s) => minutesOf(s.endsAt));
  const fromHour = Math.max(0, Math.min(7, ...starts.map((m) => Math.floor(m / 60))));
  const toHour = Math.min(24, Math.max(21, ...ends.map((m) => Math.ceil(m / 60))));
  const hours = Array.from({ length: toHour - fromHour }, (_, i) => fromHour + i);
  const height = hours.length * HOUR_PX;
  const top = (min: number) => ((min - fromHour * 60) / 60) * HOUR_PX;

  const nav = "inline-flex size-11 items-center justify-center rounded-control border border-line bg-surface text-lg no-underline";

  return (
    <section aria-label="Lịch tuần">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-medium">
          {ddmm(days[0]!)} – {ddmm(days[6]!)}/{days[6]!.slice(0, 4)}
        </p>
        <nav aria-label="Chọn tuần" className="flex items-center gap-2 text-sm">
          <Link href={weekHref(addDays(weekStart, -7))} className={nav} aria-label="Tuần trước">
            ‹
          </Link>
          <Link href={weekHref(today)} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Hôm nay
          </Link>
          <Link href={weekHref(addDays(weekStart, 7))} className={nav} aria-label="Tuần sau">
            ›
          </Link>
        </nav>
      </div>

      <div className="overflow-hidden rounded-block border border-line bg-surface">
        <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] border-b border-line bg-paper text-center text-xs sm:grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
          <div />
          {days.map((d, i) => (
            <div key={d} className={cn("py-2", d === today && "font-semibold text-primary")}>
              <span className="block">
                <span className="sm:hidden">{i === 6 ? "CN" : `T${i + 2}`}</span>
                <span className="hidden sm:inline">{WEEKDAY_LABELS[i + 1]}</span>
              </span>
              <span className={cn("mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-sm", d === today ? "bg-primary text-white" : "text-muted")}>{Number(d.slice(8))}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]" style={{ height }}>
          <div className="relative border-r border-line text-right text-[10px] text-muted sm:text-xs">
            {hours.map((h, i) => (
              <span key={h} className="absolute right-1 -translate-y-1/2" style={{ top: i * HOUR_PX, display: i === 0 ? "none" : undefined }}>
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} className={cn("relative border-r border-line last:border-r-0", d === today && "bg-primary-soft/20")}>
              {hours.map((h, i) => (
                <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }} aria-hidden="true" />
              ))}
              {d === today && nowMin >= fromHour * 60 && nowMin <= toHour * 60 && (
                <div className="absolute inset-x-0 z-10 border-t-2 border-danger" style={{ top: top(nowMin) }} aria-hidden="true" />
              )}
              {place(byDay.get(d) ?? []).map(({ s, start, end, lane, lanes }) => {
                const href = sessionHref?.(s);
                const body = (
                  <>
                    <span className="block truncate font-semibold">{s.class.code}</span>
                    <span className="hidden truncate sm:block">
                      {formatTime(s.startsAt)}–{formatTime(s.endsAt)}
                    </span>
                    <span className="block truncate sm:hidden">{formatTime(s.startsAt)}</span>
                    {s.room && <span className="hidden truncate md:block">{s.room.name}</span>}
                    {showTeacher && <span className="hidden truncate lg:block">{s.teacher.fullName}</span>}
                  </>
                );
                const cls = cn("absolute z-[5] overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight no-underline sm:text-xs", tone(s));
                const style = { top: top(start), height: Math.max(top(end) - top(start) - 2, 22), left: `calc(${(lane / lanes) * 100}% + 1px)`, width: `calc(${100 / lanes}% - 2px)` };
                const label = `${s.class.code} ${formatTime(s.startsAt)}–${formatTime(s.endsAt)}`;
                return href ? (
                  <Link key={s.id} href={href} className={cls} style={style} aria-label={label}>
                    {body}
                  </Link>
                ) : (
                  <div key={s.id} className={cls} style={style}>
                    {body}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
