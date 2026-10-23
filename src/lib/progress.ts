// Dữ liệu biểu đồ tiến độ (FEAT-B3, DECISION-D32): hàm thuần, không truy cập DB.
import type { AttendanceStatus } from "@prisma/client";
import { vnDateKey } from "@/lib/time";

export type ScorePoint = { date: Date; pct: number; title: string; classCode: string };

/** Điểm % từng bài đã công bố, theo thời gian tăng dần (bỏ bài có điểm tối đa 0). */
export function scoreTrend(results: { publishedAt: Date; score: number | null; maxScore: number; title: string; classCode: string }[]): ScorePoint[] {
  return results
    .filter((r) => r.maxScore > 0)
    .map((r) => ({ date: r.publishedAt, pct: Math.round(((r.score ?? 0) / r.maxScore) * 1000) / 10, title: r.title, classCode: r.classCode }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type MonthRate = { key: string; label: string; rate: number | null; total: number };

/** Tỷ lệ chuyên cần từng tháng (giờ VN) của `months` tháng gần nhất, tính như BR-032 (bỏ buổi đã hủy). */
export function monthlyAttendance(
  records: { status: AttendanceStatus; sessionCancelled?: boolean; session: { startsAt: Date } }[],
  now: Date,
  months = 6,
): MonthRate[] {
  const [y, m] = vnDateKey(now).split("-").map(Number) as [number, number];
  const out: MonthRate[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = d.toISOString().slice(0, 7);
    const inMonth = records.filter((r) => !r.sessionCancelled && vnDateKey(r.session.startsAt).startsWith(key));
    const ok = inMonth.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    out.push({ key, label: `T${d.getUTCMonth() + 1}`, rate: inMonth.length ? ok / inMonth.length : null, total: inMonth.length });
  }
  return out;
}

/** Xu hướng: so trung bình 3 bài gần nhất với 3 bài trước đó (điểm %). null khi chưa đủ 4 bài. */
export function scoreDelta(points: ScorePoint[]): number | null {
  if (points.length < 4) return null;
  const last = points.slice(-3);
  const prev = points.slice(-6, -3);
  const avg = (xs: ScorePoint[]) => xs.reduce((s, p) => s + p.pct, 0) / xs.length;
  return Math.round((avg(last) - avg(prev)) * 10) / 10;
}

/* ───────────── Kết quả tổng hợp (HS §4, PH §5 — checklist v4) ───────────── */

export type ResultRow = { publishedAt: Date; score: number | null; maxScore: number; classCode: string; subjectName: string };

/** Kỳ của một kết quả (giờ VN): tháng `YYYY-MM` và quý `YYYY-Qn`. */
export function periodKeys(date: Date): { month: string; quarter: string } {
  const key = vnDateKey(date);
  const m = Number(key.slice(5, 7));
  return { month: key.slice(0, 7), quarter: `${key.slice(0, 4)}-Q${Math.ceil(m / 3)}` };
}

export function periodLabel(key: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(key);
  if (q) return `Quý ${q[2]}/${q[1]}`;
  return `Tháng ${Number(key.slice(5, 7))}/${key.slice(0, 4)}`;
}

/** Các kỳ có kết quả (mới nhất trước): quý rồi các tháng. */
export function periodOptions(rows: { publishedAt: Date }[]): string[] {
  const quarters = new Set<string>();
  const months = new Set<string>();
  for (const r of rows) {
    const p = periodKeys(r.publishedAt);
    quarters.add(p.quarter);
    months.add(p.month);
  }
  return [...[...quarters].sort().reverse(), ...[...months].sort().reverse()];
}

export function inPeriod(date: Date, period: string): boolean {
  const p = periodKeys(date);
  return p.month === period || p.quarter === period;
}

export type ResultGroup = { key: string; count: number; avgPct: number; bestPct: number; worstPct: number };

/** Gom kết quả theo môn hoặc theo lớp: số bài, điểm % trung bình / cao nhất / thấp nhất. Bỏ bài điểm tối đa 0. */
export function groupResults(rows: ResultRow[], by: "subject" | "class"): ResultGroup[] {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    if (r.maxScore <= 0) continue;
    const key = by === "subject" ? r.subjectName : r.classCode;
    groups.set(key, [...(groups.get(key) ?? []), ((r.score ?? 0) / r.maxScore) * 100]);
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return [...groups.entries()]
    .map(([key, pcts]) => ({ key, count: pcts.length, avgPct: round(pcts.reduce((s, p) => s + p, 0) / pcts.length), bestPct: round(Math.max(...pcts)), worstPct: round(Math.min(...pcts)) }))
    .sort((a, b) => a.key.localeCompare(b.key, "vi"));
}
