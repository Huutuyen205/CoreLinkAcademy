import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { FilterForm } from "@/components/ui/filter-form";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { parseReportFilter } from "@/server/reports/filter";
import { pctOf } from "@/server/reports/format";
import { attendanceByClass, completionByClass, reportFilterOptions, resultsByClass, summaryCounts } from "@/server/reports/service";
import { vnDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "Báo cáo" };

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-block border border-line bg-surface p-4">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Bar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  const tone = value >= 85 ? "bg-success" : value >= 70 ? "bg-warning" : "bg-danger";
  return (
    <span className="flex min-w-32 items-center gap-2">
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper" aria-hidden="true">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className="w-10 text-right text-sm font-medium">{value}%</span>
    </span>
  );
}

// Admin §13A — FR-052: thống kê số lượng, chuyên cần, kết quả, hoàn thành bài tập; lọc thời gian/lớp/môn; xuất Excel (.xlsx, cột % là công thức).
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const options = await reportFilterOptions(actor);
  const { filter, fromKey, toKey } = parseReportFilter(sp, vnDateKey(new Date()), options);
  const [summary, attendance, results, completion] = await Promise.all([
    summaryCounts(actor, filter),
    attendanceByClass(actor, filter),
    resultsByClass(actor, filter),
    completionByClass(actor, filter),
  ]);
  const qs = new URLSearchParams({ tu: fromKey, den: toKey, ...(filter.classId ? { lop: filter.classId } : {}), ...(filter.subjectId ? { mon: filter.subjectId } : {}) }).toString();
  const totalMarked = attendance.reduce((s, r) => s + r.marked, 0);
  const totalAttended = attendance.reduce((s, r) => s + r.present + r.late, 0);
  const totalExpected = completion.reduce((s, r) => s + r.expected, 0);
  const totalSubmitted = completion.reduce((s, r) => s + r.submitted, 0);

  return (
    <>
      <PageHeader
        title="Báo cáo – thống kê"
        description={`Từ ${fromKey.split("-").reverse().join("/")} đến ${toKey.split("-").reverse().join("/")}.`}
        action={
          <ButtonLink href={`/quan-ly/bao-cao/xuat?loai=tat-ca&${qs}`} size="sm">
            Xuất Excel tất cả
          </ButtonLink>
        }
      />
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
        <TextField type="date" name="tu" label="Từ ngày" defaultValue={fromKey} />
        <TextField type="date" name="den" label="Đến ngày" defaultValue={toKey} />
        <SearchSelect name="lop" label="Lớp" emptyLabel="Tất cả" defaultValue={filter.classId ?? ""} options={options.classes.map((c) => ({ value: c.id, label: c.code }))} />
        <SearchSelect name="mon" label="Môn" emptyLabel="Tất cả" defaultValue={filter.subjectId ?? ""} options={options.subjects.map((s) => ({ value: s.id, label: s.name }))} />
      </FilterForm>

      <section aria-label="Số liệu chung" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Học sinh đang học" value={summary.students} hint={`${summary.studentsOnLeave} bảo lưu · ${summary.studentsInactive} đã nghỉ`} />
        <Stat label="Giáo viên đang dạy" value={summary.teachers} />
        <Stat label="Lớp đang học / đang tuyển" value={`${summary.classesRunning} / ${summary.classesOpen}`} hint={`${summary.classesDone} lớp đã kết thúc`} />
        <Stat label="Lead mới trong kỳ" value={summary.leads} hint={`${summary.enrolledLeads} đã nhập học`} />
        <Stat label="Tỷ lệ chuyên cần" value={pct(pctOf(totalAttended, totalMarked))} hint={`${totalMarked} lượt điểm danh`} />
        <Stat label="Tỷ lệ nộp bài" value={pct(pctOf(totalSubmitted, totalExpected))} hint={`${totalSubmitted}/${totalExpected} bài`} />
      </section>

      <div className="space-y-6">
        <Card title="Chuyên cần theo lớp" action={<ButtonLink href={`/quan-ly/bao-cao/xuat?loai=chuyen-can&${qs}`} variant="secondary" size="sm">Xuất Excel</ButtonLink>}>
          {attendance.length === 0 ? (
            <EmptyState message="Không có buổi học trong kỳ." />
          ) : (
            <DataTable
              caption="Chuyên cần theo lớp"
              rows={attendance}
              rowKey={(r) => r.classId}
              columns={[
                { header: "Lớp", primary: true, cell: (r) => r.code },
                { header: "Buổi", cell: (r) => r.sessions },
                { header: "Có mặt / muộn", cell: (r) => `${r.present} / ${r.late}` },
                { header: "Vắng / có phép", cell: (r) => `${r.absent} / ${r.excused}` },
                { header: "Tỷ lệ", cell: (r) => <Bar value={pctOf(r.present + r.late, r.marked)} /> },
              ]}
            />
          )}
        </Card>
        <Card title="Kết quả học tập theo lớp" action={<ButtonLink href={`/quan-ly/bao-cao/xuat?loai=ket-qua&${qs}`} variant="secondary" size="sm">Xuất Excel</ButtonLink>}>
          {results.length === 0 ? (
            <EmptyState message="Chưa có bài đã chấm trong kỳ." />
          ) : (
            <DataTable
              caption="Kết quả học tập"
              rows={results}
              rowKey={(r) => r.classId}
              columns={[
                { header: "Lớp", primary: true, cell: (r) => r.code },
                { header: "Bài đã chấm", cell: (r) => r.graded },
                { header: "Thấp / cao nhất", cell: (r) => `${pct(r.minPct)} / ${pct(r.maxPct)}` },
                { header: "Điểm trung bình", cell: (r) => <Bar value={r.avgPct} /> },
              ]}
            />
          )}
        </Card>
        <Card title="Hoàn thành bài tập theo lớp" action={<ButtonLink href={`/quan-ly/bao-cao/xuat?loai=bai-tap&${qs}`} variant="secondary" size="sm">Xuất Excel</ButtonLink>}>
          {completion.length === 0 ? (
            <EmptyState message="Không có bài tập đến hạn trong kỳ." />
          ) : (
            <DataTable
              caption="Hoàn thành bài tập"
              rows={completion}
              rowKey={(r) => r.classId}
              columns={[
                { header: "Lớp", primary: true, cell: (r) => r.code },
                { header: "Bài đã giao", cell: (r) => r.assignments },
                { header: "Đã nộp / cần nộp", cell: (r) => `${r.submitted} / ${r.expected}` },
                { header: "Nộp muộn", cell: (r) => r.late },
                { header: "Tỷ lệ nộp", cell: (r) => <Bar value={pctOf(r.submitted, r.expected)} /> },
              ]}
            />
          )}
        </Card>
      </div>
    </>
  );
}
