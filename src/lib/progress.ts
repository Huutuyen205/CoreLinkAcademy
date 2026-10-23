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
