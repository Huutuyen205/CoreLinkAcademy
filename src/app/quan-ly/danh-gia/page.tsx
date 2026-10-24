import type { Metadata } from "next";
import Link from "next/link";
import { TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { trackingClassOptions } from "@/server/attendance/tracking";
import { requireRole } from "@/server/auth/guard";
import { listEvaluationsForManager } from "@/server/evaluations/service";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Đánh giá của giáo viên" };

// Admin §11 "Xem đánh giá, nhận xét của giáo viên": đánh giá định kỳ đã gửi, lọc theo lớp, học sinh, kỳ.
export default async function ManagerEvaluationsPage({ searchParams }: { searchParams: Promise<{ lop?: string; q?: string; ky?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const classes = await trackingClassOptions(actor);
  const classId = classes.some((c) => c.id === sp.lop) ? sp.lop : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || undefined : undefined;
  const period = typeof sp.ky === "string" ? sp.ky.trim().slice(0, 40) || undefined : undefined;
  const rows = await listEvaluationsForManager(actor, { classId, q, period });

  return (
    <>
      <PageHeader title="Đánh giá của giáo viên" description="Nhận xét định kỳ giáo viên đã gửi cho học sinh và phụ huynh." />
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-3 md:items-end">
        <SearchSelect name="lop" label="Lớp" emptyLabel="Tất cả" defaultValue={classId ?? ""} options={classes.map((c) => ({ value: c.id, label: `${c.code} · ${c.course.title}` }))} />
        <TextField name="q" label="Học sinh (tên hoặc mã)" defaultValue={q} maxLength={80} />
        <TextField name="ky" label="Kỳ (vd. Tháng 10)" defaultValue={period} maxLength={40} />
      </FilterForm>
      {rows.length === 0 ? (
        <EmptyState message="Chưa có đánh giá phù hợp." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((ev) => (
            <li key={ev.id} className="rounded-block border border-line bg-surface p-4">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/quan-ly/hoc-vien/${ev.student.id}`} className="font-semibold">
                  {ev.student.fullName}
                </Link>
                <span className="text-sm text-muted">
                  {ev.period} · lớp <Link href={`/quan-ly/lop/${ev.class.id}`}>{ev.class.code}</Link>
                </span>
              </p>
              <p className="text-xs text-muted">
                GV {ev.teacher.fullName} · gửi {ev.sentAt ? formatDateTime(ev.sentAt) : "—"}
                {ev.sentAt && ev.updatedAt.getTime() - ev.sentAt.getTime() > 60_000 ? ` · sửa ${formatDateTime(ev.updatedAt)}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm">{ev.content}</p>
              {ev.strengths && <p className="mt-1 text-sm">Điểm mạnh: {ev.strengths}</p>}
              {ev.improvements && <p className="mt-1 text-sm">Cần cải thiện: {ev.improvements}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
