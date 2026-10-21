import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listMyAssignments } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài tập" };

type Row = Awaited<ReturnType<typeof listMyAssignments>>[number];

function statusOf(a: Row, now: Date): { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" } {
  if (a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED") {
    return a.resultsPublished ? { label: `Đã có điểm: ${a.score ?? 0}`, tone: "success" } : { label: "Đã nộp", tone: "neutral" };
  }
  if (a.status === "CLOSED") return { label: "Đã đóng", tone: "neutral" };
  if (now > a.dueAt) return a.allowLate ? { label: "Quá hạn — vẫn nhận nộp muộn", tone: "warning" } : { label: "Quá hạn", tone: "danger" };
  return { label: a.submissionStatus === "IN_PROGRESS" ? "Đang làm" : "Cần làm", tone: "primary" };
}

export default async function StudentAssignmentsPage() {
  const actor = await requireRole("STUDENT");
  const rows = await listMyAssignments(actor);
  const now = new Date();
  const todo = rows.filter((r) => r.enrollmentStatus === "ACTIVE" && r.status === "PUBLISHED" && (r.submissionStatus === null || r.submissionStatus === "IN_PROGRESS") && (now <= r.dueAt || r.allowLate));
  const others = rows.filter((r) => !todo.includes(r));

  const list = (items: Row[]) => (
    <ul className="divide-y divide-line rounded-block border border-line bg-surface">
      {items.map((a) => {
        const s = statusOf(a, now);
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span>
              <Link href={`/hoc-sinh/bai-tap/${a.id}`} className="font-medium">
                {a.title}
              </Link>
              <span className="block text-sm text-muted">
                {a.classCode} · hạn {formatDateTime(a.dueAt)}
              </span>
            </span>
            <Badge tone={s.tone}>{s.label}</Badge>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <PageHeader title="Bài tập" />
      <h2 className="mb-3 text-xl">Cần làm ({todo.length})</h2>
      {todo.length === 0 ? <EmptyState message="Bạn không có bài nào cần làm." /> : list(todo)}
      {others.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl">Đã nộp và đã đóng</h2>
          {list(others)}
        </>
      )}
    </>
  );
}
