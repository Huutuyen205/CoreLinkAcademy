import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import type { listPublishedResults } from "@/server/assessment/service";
import type { learnerProgress } from "@/server/academic/learner";
import { cn } from "@/lib/format";
import { groupResults, inPeriod, periodLabel, periodOptions } from "@/lib/progress";
import { formatDateTime } from "@/lib/time";

type Results = Awaited<ReturnType<typeof listPublishedResults>>;
type Progress = Awaited<ReturnType<typeof learnerProgress>>;

export type ResultFilter = { subject?: string; classCode?: string; period?: string };

/** `?mon=&lop=&ky=` (+ tham số khác, vd. `con`) → đường dẫn bộ lọc kết quả. */
export function resultFilterHref(base: string, f: ResultFilter, extra: Record<string, string> = {}) {
  const q = new URLSearchParams(extra);
  if (f.subject) q.set("mon", f.subject);
  if (f.classCode) q.set("lop", f.classCode);
  if (f.period) q.set("ky", f.period);
  const s = q.toString();
  return s ? `${base}?${s}#tong-hop` : `${base}#tong-hop`;
}

/** Lọc kết quả theo môn / lớp / kỳ (giá trị không hợp lệ bị bỏ qua). */
export function applyResultFilter(results: Results, f: ResultFilter): Results {
  return results.filter((r) => (!f.subject || r.subjectName === f.subject) && (!f.classCode || r.classCode === f.classCode) && (!f.period || inPeriod(r.publishedAt, f.period)));
}

const pct = (n: number) => `${n}%`;
const tone = (n: number) => (n >= 80 ? "success" : n >= 50 ? "primary" : "danger") as "success" | "primary" | "danger";

/**
 * HS §4 "Xem danh sách kết quả học tập tổng hợp (theo môn, lớp, kỳ)" + "Xem chi tiết kết quả theo chế độ lọc";
 * PH §5 "Xem điểm tổng hợp của con", "Xem lịch sử kết quả học tập".
 * Bộ lọc là liên kết (`?mon=&lop=&ky=`) để chạy cả khi chưa tải JavaScript.
 */
export function ResultsSummary({ results, filter, baseHref, detailHref }: { results: Results; filter: ResultFilter; baseHref: (q: ResultFilter) => string; detailHref?: (r: Results[number]) => string }) {
  const subjects = [...new Set(results.map((r) => r.subjectName))].sort();
  const classes = [...new Set(results.map((r) => r.classCode))].sort();
  const periods = periodOptions(results);
  const shown = applyResultFilter(results, filter);
  const bySubject = groupResults(shown, "subject");
  const byClass = groupResults(shown, "class");
  const all = groupResults(shown.map((r) => ({ ...r, subjectName: "all" })), "subject")[0];

  const chip = (label: string, active: boolean, href: string) => (
    <Link key={href + label} href={href} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-9 items-center rounded-full border px-3 text-sm no-underline", active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink")}>
      {label}
    </Link>
  );

  return (
    <Card title="Kết quả học tập tổng hợp">
      {results.length === 0 ? (
        <EmptyState message="Chưa có kết quả nào được công bố." />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {subjects.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-14 text-xs font-semibold text-muted">Môn</span>
                {chip("Tất cả", !filter.subject, baseHref({ ...filter, subject: undefined }))}
                {subjects.map((s) => chip(s, filter.subject === s, baseHref({ ...filter, subject: s })))}
              </div>
            )}
            {classes.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-14 text-xs font-semibold text-muted">Lớp</span>
                {chip("Tất cả", !filter.classCode, baseHref({ ...filter, classCode: undefined }))}
                {classes.map((c) => chip(c, filter.classCode === c, baseHref({ ...filter, classCode: c })))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-xs font-semibold text-muted">Kỳ</span>
              {chip("Mọi lúc", !filter.period, baseHref({ ...filter, period: undefined }))}
              {periods.slice(0, 10).map((p) => chip(periodLabel(p), filter.period === p, baseHref({ ...filter, period: p })))}
            </div>
          </div>

          {all ? (
            <>
              <p className="text-sm">
                <strong>{all.count}</strong> bài · trung bình <Badge tone={tone(all.avgPct)}>{pct(all.avgPct)}</Badge> · cao nhất {pct(all.bestPct)} · thấp nhất {pct(all.worstPct)}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: "Theo môn", rows: bySubject },
                  { title: "Theo lớp", rows: byClass },
                ].map((g) => (
                  <div key={g.title} className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="mb-1 text-left text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</caption>
                      <thead>
                        <tr className="border-b border-line text-muted">
                          <th scope="col" className="py-1.5 pr-2 font-medium" />
                          <th scope="col" className="px-2 py-1.5 font-medium">Số bài</th>
                          <th scope="col" className="px-2 py-1.5 font-medium">TB</th>
                          <th scope="col" className="px-2 py-1.5 font-medium">Cao / thấp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r) => (
                          <tr key={r.key} className="border-b border-line last:border-0">
                            <th scope="row" className="py-1.5 pr-2 font-medium">
                              {r.key}
                            </th>
                            <td className="px-2 py-1.5">{r.count}</td>
                            <td className="px-2 py-1.5">
                              <Badge tone={tone(r.avgPct)}>{pct(r.avgPct)}</Badge>
                            </td>
                            <td className="px-2 py-1.5">
                              {pct(r.bestPct)} / {pct(r.worstPct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <details>
                <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">Chi tiết {shown.length} bài theo bộ lọc</summary>
                <ul className="divide-y divide-line">
                  {shown.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span>
                        {detailHref ? <Link href={detailHref(r)}>{r.title}</Link> : r.title}
                        {r.isTest && <span className="text-warning"> · kiểm tra</span>}
                        <span className="block text-xs text-muted">
                          {r.subjectName} · {r.classCode} · {formatDateTime(r.publishedAt)}
                        </span>
                      </span>
                      <Badge tone="primary">
                        {r.score ?? 0}/{r.maxScore}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <EmptyState message="Không có kết quả trong bộ lọc này." />
          )}
        </div>
      )}
    </Card>
  );
}

function Bar({ value, total, label, warn }: { value: number; total: number; label: string; warn?: boolean }) {
  const p = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">
          {value}/{total} ({p}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full", warn ? "bg-warning" : "bg-primary")} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

/** HS §4 / PH §5 "Xem tiến độ học tập": tiến độ hoàn thành khóa (buổi đã học) và tỷ lệ hoàn thành bài tập theo lớp. */
export function CourseProgress({ rows }: { rows: Progress }) {
  return (
    <Card title="Tiến độ khóa học & bài tập">
      {rows.length === 0 ? (
        <EmptyState message="Chưa ghi danh lớp nào." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.classId} className="space-y-2 rounded-control border border-line p-3">
              <p className="text-sm font-semibold">
                {r.classCode} <span className="font-normal text-muted">· {r.courseTitle}</span>
              </p>
              <Bar value={r.sessionsDone} total={r.sessionsTotal} label="Buổi đã học / tổng số buổi" />
              <Bar value={r.submitted} total={r.assigned} label="Bài đã nộp / bài được giao" warn={r.overdue > 0} />
              {r.overdue > 0 && <p className="text-xs text-danger">{r.overdue} bài quá hạn chưa nộp</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
