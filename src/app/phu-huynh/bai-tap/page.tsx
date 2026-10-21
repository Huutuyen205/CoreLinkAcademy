import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChildPicker } from "@/components/learner/child-picker";
import { DataTable } from "@/components/ui/data-table";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listAssignmentsOfStudent } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { listMyChildren } from "@/server/users/service";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài tập của con" };

type Row = Awaited<ReturnType<typeof listAssignmentsOfStudent>>[number];

function submissionBadge(a: Row, now: Date) {
  if (a.resultsPublished) return <Badge tone="success">Đã có điểm</Badge>;
  if (a.awaitingGrade) return <Badge tone="primary">Đang chờ chấm</Badge>;
  if (a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED") return <Badge tone="success">{a.isLate ? "Đã nộp (muộn)" : "Đã nộp"}</Badge>;
  if (a.dueAt < now && !a.allowLate) return <Badge tone="danger">Không nộp</Badge>;
  return <Badge tone="warning">Chưa nộp</Badge>;
}

// Phụ huynh §4 — FR-045: danh sách bài tập của con, hạn nộp, trạng thái nộp, điểm và nhận xét (chỉ xem).
export default async function ParentAssignmentsPage({ searchParams }: { searchParams: Promise<{ con?: string }> }) {
  const actor = await requireRole("PARENT");
  const children = await listMyChildren(actor);
  if (children.length === 0) {
    return (
      <>
        <PageHeader title="Bài tập của con" />
        <EmptyState message="Tài khoản chưa được liên kết với học sinh nào." />
      </>
    );
  }
  const { con } = await searchParams;
  const child = children.find((c) => c.id === (con ?? children[0]!.id));
  if (!child) notFound();
  const rows = await orNotFound(listAssignmentsOfStudent(actor, child.id));
  const now = new Date();
  const pending = rows.filter((r) => !r.submissionStatus || r.submissionStatus === "IN_PROGRESS").filter((r) => r.status === "PUBLISHED").length;

  return (
    <>
      <PageHeader title="Bài tập của con" description={`${child.fullName}: ${rows.length} bài được giao · ${pending} bài đang mở chưa nộp.`} />
      <ChildPicker items={children} currentId={child.id} basePath="/phu-huynh/bai-tap" />
      {rows.length === 0 ? (
        <EmptyState message="Chưa có bài tập nào được giao." />
      ) : (
        <Card>
          <DataTable
            caption="Bài tập của con"
            rows={[...rows].reverse()}
            rowKey={(r) => r.id}
            columns={[
              { header: "Bài", primary: true, cell: (r) => <span className="font-medium">{r.title}</span> },
              { header: "Lớp", cell: (r) => r.classCode },
              { header: "Hạn nộp", cell: (r) => formatDateTime(r.dueAt) },
              { header: "Trạng thái", cell: (r) => submissionBadge(r, now) },
              {
                header: "Điểm / nhận xét",
                cell: (r) =>
                  r.resultsPublished ? (
                    <span>
                      <strong>
                        {r.score ?? 0}/{r.maxScore}
                      </strong>
                      {r.teacherComment && <span className="block text-sm text-muted">{r.teacherComment}</span>}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
            ]}
          />
        </Card>
      )}
    </>
  );
}
