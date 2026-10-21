// Sinh lịch và phát hiện trùng lịch (BR-021, BR-023). Thuần, unit test được.
import { vnToUtc, WEEKDAY_LABELS } from "./time";

export type Interval = { startsAt: Date; endsAt: Date };
export type GeneratedSession = Interval & { index: number };

/** "1,3,5" → [1,3,5]; bỏ giá trị ngoài 1..7, loại trùng, sắp xếp. */
export function parseWeekdays(value: string): number[] {
  const days = value
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
  return [...new Set(days)].sort((a, b) => a - b);
}

/** Thứ của một ngày lịch `YYYY-MM-DD` (1 = Thứ Hai … 7 = Chủ nhật), không phụ thuộc múi giờ máy. */
export function weekdayOfDate(date: string): number {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * BR-023: duyệt từng ngày từ `startDate`, lấy ngày có thứ thuộc `weekdays`, đến khi đủ `total` buổi.
 * Giờ hiểu theo giờ Việt Nam rồi đổi sang UTC.
 */
export function generateSessions(input: {
  startDate: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  total: number;
}): GeneratedSession[] {
  const days = new Set(input.weekdays);
  if (days.size === 0 || input.total < 1) return [];
  const sessions: GeneratedSession[] = [];
  let date = input.startDate;
  while (sessions.length < input.total) {
    if (days.has(weekdayOfDate(date))) {
      sessions.push({
        index: sessions.length + 1,
        startsAt: vnToUtc(date, input.startTime),
        endsAt: vnToUtc(date, input.endTime),
      });
    }
    date = addDays(date, 1);
  }
  return sessions;
}

/** BR-021: hai khoảng chồng nhau khi a.start < b.end && b.start < a.end. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.startsAt.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < a.endsAt.getTime();
}

/** Cặp (buổi mới, buổi đã có) bị trùng. Buổi đã có ở trạng thái CANCELLED được bỏ qua. */
export function findConflicts<T extends Interval & { status?: string }>(
  candidates: Interval[],
  existing: T[],
): { candidate: Interval; existing: T }[] {
  const active = existing.filter((e) => e.status !== "CANCELLED");
  const out: { candidate: Interval; existing: T }[] = [];
  for (const candidate of candidates) {
    for (const e of active) if (overlaps(candidate, e)) out.push({ candidate, existing: e });
  }
  return out;
}

export function spanOf(intervals: Interval[]): Interval | null {
  if (intervals.length === 0) return null;
  let start = intervals[0]!.startsAt;
  let end = intervals[0]!.endsAt;
  for (const i of intervals) {
    if (i.startsAt < start) start = i.startsAt;
    if (i.endsAt > end) end = i.endsAt;
  }
  return { startsAt: start, endsAt: end };
}

/** "1,3,5", "18:00", "19:30" → "Thứ Hai, Thứ Tư, Thứ Sáu · 18:00–19:30". */
export function formatSchedule(weekdays: string, startTime: string, endTime: string): string {
  return `${parseWeekdays(weekdays)
    .map((d) => WEEKDAY_LABELS[d])
    .join(", ")} · ${startTime}–${endTime}`;
}
