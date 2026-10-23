import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listMyAssignments } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { cn } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài tập" };

type Row = Awaited<ReturnType<typeof listMyAssignments>>[number];
type Tab = "all" | "chua-nop" | "da-nop" | "nop-muon" | "da-cham";

function statusOf(a: Row, now: Date): { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" } {
  if (a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED") {
    if (a.resultsPublished) return { label: `Đã chấm: ${a.score ?? 0}/${a.maxScore}`, tone: "success" };
    return a.awaitingGrade ? { label: "Đang chờ chấm", tone: "primary" } : { label: a.isLate ? "Đã nộp (muộn)" : "Đã nộp", tone: "neutral" };
  }
  if (a.returned) return { label: "Cần nộp lại", tone: "warning" };
  if (a.status === "CLOSED") return { label: "Đã đóng", tone: "neutral" };
  if (now > a.dueAt) return a.allowLate ? { label: "Quá hạn — vẫn nhận nộp muộn", tone: "warning" } : { label: "Quá hạn", tone: "danger" };
  return { label: a.submissionStatus === "IN_PROGRESS" ? "Đang làm" : "Chưa nộp", tone: "primary" };
}

/** Bộ lọc HS §1: Chưa nộp, Đã nộp, Nộp muộn, Đã chấm. */
function inTab(a: Row, tab: Tab): boolean {
  const submitted = a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED";
  if (tab === "chua-nop") return !submitted;
  if (tab === "da-nop") return submitted;
  if (tab === "nop-muon") return submitted && a.isLate;
  if (tab === "da-cham") return submitted && a.resultsPublished;
  return true;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "chua-nop", label: "Chưa nộp" },
  { key: "da-nop", label: "Đã nộp" },
  { key: "nop-muon", label: "Nộp muộn" },
  { key: "da-cham", label: "Đã chấm" },
];

export default async function StudentAssignmentsPage({ searchParams }: { searchParams: Promise<{ loc?: string }> }) {
  const actor = await requireRole("STUDENT");
  const rows = await listMyAssignments(actor);
  const loc = (await searchParams).loc;
  const tab: Tab = TABS.some((t) => t.key === loc) ? (loc as Tab) : "all";
  const now = new Date();
  const todo = rows.filter((r) => r.enrollmentStatus === "ACTIVE" && r.status === "PUBLISHED" && (r.submissionStatus === null || r.submissionStatus === "IN_PROGRESS") && (now <= r.dueAt || r.allowLate || r.returned));
  const shown = tab === "all" ? rows.filter((r) => !todo.includes(r)) : rows.filter((r) => inTab(r, tab));

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
              {a.isTest && (
                <span className="ml-2 align-middle">
                  <Badge tone="warning">Kiểm tra</Badge>
                </span>
              )}
              <span className="block text-sm text-muted">
                {a.classCode} · hạn {formatDateTime(a.dueAt)}
                {a.submittedAt ? ` · nộp ${formatDateTime(a.submittedAt)}` : ""}
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
      <PageHeader title="Bài tập" description="Xem bài được giao, làm bài trực tuyến hoặc nộp ảnh/tệp, xem điểm và bài chữa." />
      <nav aria-label="Lọc bài tập" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t.key === "all" ? rows.length : rows.filter((r) => inTab(r, t.key)).length;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/hoc-sinh/bai-tap" : `/hoc-sinh/bai-tap?loc=${t.key}`}
              aria-current={t.key === tab ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline",
                t.key === tab ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink",
              )}
            >
              {t.label} ({count})
            </Link>
          );
        })}
      </nav>
      {tab === "all" ? (
        <>
          <h2 className="mb-3 text-xl">Cần làm ({todo.length})</h2>
          {todo.length === 0 ? <EmptyState message="Bạn không có bài nào cần làm." /> : list(todo)}
          {shown.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-xl">Đã nộp và đã đóng</h2>
              {list(shown)}
            </>
          )}
        </>
      ) : shown.length === 0 ? (
        <EmptyState message="Không có bài nào trong mục này." />
      ) : (
        list([...shown].reverse())
      )}
    </>
  );
}
