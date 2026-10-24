import Link from "next/link";
import type { listSessionsInRange } from "@/server/academic/service";
import { addDays } from "@/lib/schedule";
import { cn } from "@/lib/format";
import { formatTime, vnDateKey } from "@/lib/time";

type Session = Awaited<ReturnType<typeof listSessionsInRange>>[number];

/** `YYYY-MM` hợp lệ hoặc tháng hiện tại (giờ VN). */
export function parseMonthParam(value: string | string[] | undefined, now = new Date()): string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : vnDateKey(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Ngày đầu lưới (Thứ Hai trước/ngày 1) và số ô (bội 7) của một tháng. */
export function monthGrid(month: string): { first: string; days: string[] } {
  const first = `${month}-01`;
  const dow = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Thứ Hai
  const start = addDays(first, -dow);
  const next = `${shiftMonth(month, 1)}-01`;
  const days: string[] = [];
  for (let d = start; d < next || days.length % 7 !== 0; d = addDays(d, 1)) days.push(d);
  return { first, days };
}

const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_CHIPS = 3;

const chip = (s: Session) =>
  s.status === "CANCELLED" ? "bg-danger-soft text-danger line-through" : s.status === "COMPLETED" ? "bg-success-soft text-success" : "bg-primary-soft text-primary";

/**
 * Lịch tháng dạng lưới 7 cột như lịch điện thoại, rộng toàn trang. Bấm buổi để vào chi tiết;
 * bấm số ngày (khi có `dayHref`) để xem tuần chứa ngày đó.
 */
export function MonthSchedule({
  month,
  sessions,
  monthHref,
  sessionHref,
  dayHref,
}: {
  month: string;
  sessions: Session[];
  monthHref: (m: string) => string;
  sessionHref: (s: Session) => string | null;
  dayHref?: (day: string) => string;
}) {
  const { days } = monthGrid(month);
  const byDay = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = vnDateKey(s.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const today = vnDateKey(new Date());
  const [y, m] = month.split("-");
  const nav = "inline-flex size-11 items-center justify-center rounded-control border border-line bg-surface text-lg no-underline";

  return (
    <section aria-label="Lịch tháng">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-medium">{`Tháng ${Number(m)}/${y}`}</p>
        <nav aria-label="Chọn tháng" className="flex items-center gap-2 text-sm">
          <Link href={monthHref(shiftMonth(month, -1))} className={nav} aria-label="Tháng trước">
            ‹
          </Link>
          <Link href={monthHref(today.slice(0, 7))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Hôm nay
          </Link>
          <Link href={monthHref(shiftMonth(month, 1))} className={nav} aria-label="Tháng sau">
            ›
          </Link>
        </nav>
      </div>
      <div className="overflow-hidden rounded-block border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-semibold text-muted">
          {HEAD.map((h) => (
            <div key={h} className="py-2">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const inMonth = d.startsWith(month);
            const list = byDay.get(d) ?? [];
            const shown = list.slice(0, MAX_CHIPS);
            const num = Number(d.slice(8));
            const numClass = cn("mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold no-underline", d === today ? "bg-primary text-white" : inMonth ? "text-ink" : "text-subtle");
            return (
              <div key={d} className={cn("min-h-[5.5rem] border-b border-r border-line p-1 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-paper/60")}>
                {dayHref ? (
                  <Link href={dayHref(d)} className={numClass} aria-label={`Xem tuần của ngày ${num}`}>
                    {num}
                  </Link>
                ) : (
                  <span className={numClass}>{num}</span>
                )}
                <ul className="space-y-0.5">
                  {shown.map((s) => {
                    const href = sessionHref(s);
                    const cls = cn("block truncate rounded px-1 py-0.5 text-[10px] leading-tight no-underline sm:text-xs", chip(s));
                    const text = (
                      <>
                        <span className="hidden sm:inline">{formatTime(s.startsAt)} </span>
                        {s.class.code}
                      </>
                    );
                    return (
                      <li key={s.id}>
                        {href ? (
                          <Link href={href} className={cls} title={`${s.class.code} · ${s.class.course.title} · ${formatTime(s.startsAt)}–${formatTime(s.endsAt)}`}>
                            {text}
                          </Link>
                        ) : (
                          <span className={cls}>{text}</span>
                        )}
                      </li>
                    );
                  })}
                  {list.length > MAX_CHIPS && <li className="px-1 text-[10px] text-muted sm:text-xs">+{list.length - MAX_CHIPS}</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
