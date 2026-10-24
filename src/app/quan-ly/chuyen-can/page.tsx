import type { Metadata } from "next";
import Link from "next/link";
import { TextField } from "@/components/ui/field";
import { FilterSelect } from "@/components/ui/filter-select";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { listAbsenceAlerts } from "@/server/attendance/service";
import { formatRate } from "@/server/attendance/rules";
import { classAttendanceSheet, trackingClassOptions } from "@/server/attendance/tracking";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { ATTENDANCE_STATUS, CLASS_STATUS } from "@/lib/labels";
import { cn } from "@/lib/format";
import { formatVn, vnToUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Theo dõi chuyên cần" };

const SHORT: Record<string, { text: string; cls: string }> = {
  PRESENT: { text: "✓", cls: "text-success" },
  LATE: { text: "M", cls: "text-warning font-semibold" },
  ABSENT: { text: "V", cls: "text-danger font-semibold" },
  EXCUSED: { text: "P", cls: "text-muted" },
};

const dateOk = (v?: string) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

// Admin §11: theo dõi tình hình điểm danh, lịch sử chuyên cần theo lớp và theo học sinh (bấm tên → hồ sơ học sinh).
export default async function AttendanceTrackingPage({ searchParams }: { searchParams: Promise<{ lop?: string; tu?: string; den?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const [classes, alerts] = await Promise.all([trackingClassOptions(actor), listAbsenceAlerts(actor)]);
  const classId = classes.some((c) => c.id === sp.lop) ? sp.lop : undefined;
  const tu = dateOk(sp.tu);
  const den = dateOk(sp.den);
  const sheet = classId ? await orNotFound(classAttendanceSheet(actor, classId, { from: tu ? vnToUtc(tu, "00:00") : undefined, to: den ? vnToUtc(den, "23:59") : undefined })) : null;

  return (
    <>
      <PageHeader title="Theo dõi chuyên cần" description="Chọn lớp để xem bảng điểm danh từng buổi, số buổi có mặt / muộn / vắng / có phép và tỷ lệ chuyên cần của từng học sinh." />
      {alerts.length > 0 && (
        <Card title={`Cảnh báo vắng 2 buổi liên tiếp (${alerts.length})`} className="mb-6">
          <ul className="flex flex-wrap gap-2 text-sm">
            {alerts.map((a) => (
              <li key={`${a.classId}-${a.studentId}`}>
                <Link href={`/quan-ly/chuyen-can?lop=${a.classId}`} className="inline-flex min-h-9 items-center rounded-full border border-danger/30 bg-danger-soft px-3 text-danger no-underline">
                  {a.studentName} · {a.classCode}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.5fr_1fr_1fr] md:items-end">
        <FilterSelect
          name="lop"
          label="Lớp"
          placeholder="Chọn lớp"
          defaultValue={classId ?? ""}
          options={classes.map((c) => ({ value: c.id, label: `${c.code} · ${c.course.title} (${CLASS_STATUS[c.status].label.toLowerCase()})` }))}
        />
        <TextField type="date" name="tu" label="Từ ngày" defaultValue={tu} />
        <TextField type="date" name="den" label="Đến ngày" defaultValue={den} />
      </FilterForm>

      {!sheet ? (
        <EmptyState message="Chọn một lớp để xem lịch sử chuyên cần." />
      ) : sheet.sessions.length === 0 ? (
        <EmptyState message="Lớp chưa có buổi nào được điểm danh trong khoảng thời gian này." />
      ) : (
        <Card title={`Lớp ${sheet.klass.code} — ${sheet.sessions.length} buổi đã điểm danh`}>
          <p className="mb-3 text-sm text-muted">
            Ký hiệu: <span className="text-success">✓</span> có mặt · <span className="text-warning">M</span> muộn · <span className="text-danger">V</span> vắng · P có phép · — chưa điểm danh. Tỷ lệ = (có mặt + muộn) / số buổi đã điểm danh.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <caption className="sr-only">Bảng điểm danh lớp {sheet.klass.code}</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th scope="col" className="sticky left-0 bg-surface py-2 pr-4 font-medium">
                    Học sinh
                  </th>
                  {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const).map((st) => (
                    <th key={st} scope="col" className="px-2 py-2 font-medium">
                      {ATTENDANCE_STATUS[st].label}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-2 font-medium">
                    Tỷ lệ
                  </th>
                  {sheet.sessions.map((s) => (
                    <th key={s.id} scope="col" className="px-1.5 py-2 text-center font-normal">
                      <Link href={`/quan-ly/buoi/${s.id}`} title={`Buổi ${s.index}`}>
                        {formatVn(s.startsAt, "dd/MM")}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((r) => (
                  <tr key={r.student.id} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky left-0 bg-surface py-2 pr-4 font-normal">
                      <Link href={`/quan-ly/hoc-vien/${r.student.id}`}>{r.student.fullName}</Link>
                      {r.enrollmentStatus !== "ACTIVE" && <span className="ml-1 text-xs text-muted">({r.enrollmentStatus === "DROPPED" ? "đã nghỉ" : r.enrollmentStatus === "PAUSED" ? "bảo lưu" : "hoàn thành"})</span>}
                    </th>
                    <td className="px-2 py-2">{r.counts.PRESENT}</td>
                    <td className="px-2 py-2">{r.counts.LATE}</td>
                    <td className={cn("px-2 py-2", r.counts.ABSENT > 0 && "font-semibold text-danger")}>{r.counts.ABSENT}</td>
                    <td className="px-2 py-2">{r.counts.EXCUSED}</td>
                    <td className="px-2 py-2">
                      <Badge tone={r.rate === null ? "neutral" : r.rate >= 0.9 ? "success" : r.rate >= 0.75 ? "warning" : "danger"}>{formatRate(r.rate)}</Badge>
                    </td>
                    {r.cells.map((c, i) => (
                      <td key={sheet.sessions[i]!.id} className={cn("px-1.5 py-2 text-center", c ? SHORT[c.status]!.cls : "text-subtle")} title={c?.note ?? undefined}>
                        {c ? SHORT[c.status]!.text : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
