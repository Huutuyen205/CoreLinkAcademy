import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/feedback";
import { monthlyAttendance, scoreDelta, scoreTrend } from "@/lib/progress";
import { cn } from "@/lib/format";
import { formatDate } from "@/lib/time";
import type { AttendanceStatus } from "@prisma/client";

type Props = {
  results: { publishedAt: Date; score: number | null; maxScore: number; title: string; classCode: string }[];
  attendance: { status: AttendanceStatus; sessionCancelled?: boolean; session: { startsAt: Date } }[];
};

const W = 600;
const H = 180;
const PAD = { l: 34, r: 12, t: 12, b: 24 };

function toneOf(pct: number) {
  return pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-danger)";
}

/** FEAT-B3 (DECISION-D32): xu hướng điểm % và chuyên cần theo tháng — SVG, không thêm thư viện. */
export function ProgressCharts({ results, attendance }: Props) {
  const points = scoreTrend(results).slice(-12);
  const months = monthlyAttendance(attendance, new Date());
  const delta = scoreDelta(scoreTrend(results));
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.pct, 0) / points.length) : null;
  const thisMonth = months.at(-1)!;

  const x = (i: number) => PAD.l + (points.length <= 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (points.length - 1));
  const y = (pct: number) => PAD.t + ((100 - pct) * (H - PAD.t - PAD.b)) / 100;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ");

  return (
    <Card title="Tiến độ học tập">
      <dl className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-control bg-paper p-3">
          <dt className="text-xs text-muted">Điểm TB ({points.length} bài gần nhất)</dt>
          <dd className="text-2xl font-bold text-primary">{avg === null ? "—" : `${avg}%`}</dd>
        </div>
        <div className="rounded-control bg-paper p-3">
          <dt className="text-xs text-muted">Xu hướng 3 bài gần nhất</dt>
          <dd className={cn("flex items-center gap-1 text-2xl font-bold", delta === null ? "text-muted" : delta >= 0 ? "text-success" : "text-danger")}>
            {delta === null ? (
              "—"
            ) : (
              <>
                {delta >= 0 ? <TrendingUp className="size-5" aria-hidden="true" /> : <TrendingDown className="size-5" aria-hidden="true" />}
                {delta > 0 ? "+" : ""}
                {delta}%
              </>
            )}
          </dd>
        </div>
        <div className="rounded-control bg-paper p-3">
          <dt className="text-xs text-muted">Chuyên cần tháng này</dt>
          <dd className="text-2xl font-bold text-primary">{thisMonth.rate === null ? "—" : `${Math.round(thisMonth.rate * 100)}%`}</dd>
        </div>
      </dl>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <figure>
          <figcaption className="mb-1 text-sm font-medium">Điểm từng bài (%)</figcaption>
          {points.length === 0 ? (
            <p className="rounded-control border border-dashed border-line p-6 text-center text-sm text-muted">Chưa có bài nào được công bố điểm.</p>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Điểm ${points.length} bài gần nhất, trung bình ${avg}%`}>
              {[0, 50, 80, 100].map((g) => (
                <g key={g}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeDasharray={g === 0 || g === 100 ? undefined : "4 4"} />
                  <text x={PAD.l - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
                    {g}
                  </text>
                </g>
              ))}
              {points.length > 1 && <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
              {points.map((p, i) => (
                <g key={`${p.title}-${i}`}>
                  <circle cx={x(i)} cy={y(p.pct)} r="5" fill={toneOf(p.pct)} stroke="white" strokeWidth="2">
                    <title>{`${p.title} (${p.classCode}) · ${formatDate(p.date)}: ${p.pct}%`}</title>
                  </circle>
                  {(i === 0 || i === points.length - 1) && (
                    <text x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : "end"} fontSize="11" fill="var(--color-muted)">
                      {formatDate(p.date).slice(0, 5)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          )}
        </figure>

        <figure>
          <figcaption className="mb-1 text-sm font-medium">Chuyên cần theo tháng</figcaption>
          <div className="flex h-[150px] items-end gap-2" role="img" aria-label={months.map((m) => `${m.label}: ${m.rate === null ? "chưa có" : `${Math.round(m.rate * 100)}%`}`).join(", ")}>
            {months.map((m) => {
              const pct = m.rate === null ? 0 : Math.round(m.rate * 100);
              return (
                <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={m.rate === null ? `${m.label}: chưa có buổi` : `${m.label}: ${pct}% (${m.total} buổi)`}>
                  <span className="text-[11px] font-semibold text-muted">{m.rate === null ? "" : `${pct}%`}</span>
                  <div
                    className={cn("w-full max-w-9 rounded-t-md", m.rate === null ? "bg-line" : pct >= 85 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-danger")}
                    style={{ height: `${m.rate === null ? 4 : Math.max(6, pct)}%` }}
                  />
                  <span className="text-xs text-muted">{m.label}</span>
                </div>
              );
            })}
          </div>
        </figure>
      </div>
    </Card>
  );
}
