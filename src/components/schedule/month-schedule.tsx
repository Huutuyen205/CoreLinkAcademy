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

/** Thời khóa biểu theo tháng (HS §3 "Xem thời khóa biểu theo tuần/tháng"). */
export function MonthSchedule({ month, sessions, monthHref, sessionHref }: { month: string; sessions: Session[]; monthHref: (m: string) => string; sessionHref: (s: Session) => string }) {
  const { days } = monthGrid(month);
  const byDay = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = vnDateKey(s.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const today = vnDateKey(new Date());
  const [y, m] = month.split("-");

  return (
    <section aria-label="Lịch tháng">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">{`Tháng ${Number(m)}/${y} · ${sessions.filter((s) => s.status !== "CANCELLED").length} buổi`}</p>
        <nav aria-label="Chọn tháng" className="flex gap-2 text-sm">
          <Link href={monthHref(shiftMonth(month, -1))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tháng trước
          </Link>
          <Link href={monthHref(today.slice(0, 7))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tháng này
          </Link>
          <Link href={monthHref(shiftMonth(month, 1))} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-3 no-underline">
            Tháng sau
          </Link>
        </nav>
      </div>
      {/* Máy tính: lưới 7 cột */}
      <div className="hidden overflow-hidden rounded-block border border-line bg-surface md:block">
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
            return (
              <div key={d} className={cn("min-h-24 border-b border-r border-line p-1.5 text-xs [&:nth-child(7n)]:border-r-0", !inMonth && "bg-paper/60 text-subtle")}>
                <p className={cn("mb-1 font-semibold", d === today && "inline-flex size-6 items-center justify-center rounded-full bg-primary text-white")}>{Number(d.slice(8))}</p>
                <ul className="space-y-1">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={sessionHref(s)}
                        className={cn(
                          "block truncate rounded px-1.5 py-0.5 no-underline",
                          s.status === "CANCELLED" ? "bg-danger-soft text-danger line-through" : s.status === "COMPLETED" ? "bg-success-soft text-success" : "bg-primary-soft text-primary",
                        )}
                        title={`${s.class.code} · ${s.class.course.title}`}
                      >
                        {formatTime(s.startsAt)} {s.class.code}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      {/* Điện thoại: danh sách các ngày có buổi */}
      <ul className="space-y-3 md:hidden">
        {days
          .filter((d) => d.startsWith(month) && byDay.has(d))
          .map((d) => (
            <li key={d} className="rounded-block border border-line bg-surface p-3">
              <p className={cn("mb-2 text-sm font-semibold", d === today && "text-primary")}>
                {`${d.slice(8)}/${d.slice(5, 7)}`}
                {d === today ? " · Hôm nay" : ""}
              </p>
              <ul className="space-y-1.5">
                {byDay.get(d)!.map((s) => (
                  <li key={s.id}>
                    <Link href={sessionHref(s)} className={cn("block text-sm no-underline", s.status === "CANCELLED" && "text-danger line-through")}>
                      {formatTime(s.startsAt)}–{formatTime(s.endsAt)} · {s.class.code} · {s.class.course.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        {sessions.length === 0 && <li className="text-sm text-muted">Tháng này không có buổi học.</li>}
      </ul>
      <p className="mt-3 text-xs text-muted">Xanh dương: sắp học · xanh lá: đã học · đỏ gạch: nghỉ/hủy.</p>
    </section>
  );
}
