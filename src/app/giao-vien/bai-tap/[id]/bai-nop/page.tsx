import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listSubmissions } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { SUBMISSION_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài nộp" };

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const { assignment, rows } = await orNotFound(listSubmissions(actor, id));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/bai-tap/${id}`}>← {assignment.title}</Link>
      </p>
      <PageHeader title="Bài nộp" description={`${assignment.title} · lớp ${assignment.class.code}`} />
      {rows.length === 0 ? (
        <EmptyState message="Lớp chưa có học sinh." />
      ) : (
        <DataTable
          caption="Danh sách bài nộp"
          rows={rows}
          rowKey={(r) => r.student.id}
          columns={[
            { header: "Học sinh", primary: true, cell: (r) => `${r.student.fullName} (${r.student.studentCode ?? "—"})` },
            {
              header: "Trạng thái",
              cell: (r) =>
                !r.submission ? (
                  <span className="text-muted">Chưa mở bài</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={SUBMISSION_STATUS[r.submission.status].tone}>{SUBMISSION_STATUS[r.submission.status].label}</Badge>
                    {r.submission.isLate && <Badge tone="warning">Nộp muộn</Badge>}
                  </span>
                ),
            },
            { header: "Nộp lúc", cell: (r) => (r.submission?.submittedAt ? formatDateTime(r.submission.submittedAt) : "—") },
            { header: "Điểm", cell: (r) => (r.submission?.status === "GRADED" ? r.submission.score : "—") },
            {
              header: "Thao tác",
              cell: (r) =>
                r.submission && r.submission.status !== "IN_PROGRESS" ? (
                  <Link href={`/giao-vien/bai-nop/${r.submission.id}`}>{r.submission.status === "SUBMITTED" ? "Chấm bài" : "Xem / sửa điểm"}</Link>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      )}
    </>
  );
}
