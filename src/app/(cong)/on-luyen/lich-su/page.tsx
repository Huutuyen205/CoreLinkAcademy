import type { Metadata } from "next";
import Link from "next/link";
import { BookCheck, Layers, Target } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/server/auth/guard";
import { listMyPracticeHistory } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch sử luyện tập" };

// Học sinh §5: xem lịch sử luyện tập.
export default async function PracticeHistoryPage() {
  const actor = await requireRole("STUDENT");
  const rows = await listMyPracticeHistory(actor);
  const sets = new Set(rows.map((r) => r.set.id)).size;
  const avg = rows.length ? Math.round((rows.reduce((s, r) => s + (r.maxScore ? r.score / r.maxScore : 0), 0) / rows.length) * 100) : 0;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/on-luyen">← Tự ôn luyện</Link>
      </p>
      <PageHeader title="Lịch sử luyện tập" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookCheck} label="Lượt đã làm" value={rows.length} />
        <StatCard icon={Layers} label="Số đề đã luyện" value={sets} index={1} />
        <StatCard icon={Target} label="Điểm trung bình" value={`${avg}%`} tone="success" index={2} />
      </div>
      {rows.length === 0 ? (
        <EmptyState message="Bạn chưa làm đề luyện tập nào." action={<Link href="/on-luyen">Chọn đề để luyện</Link>} />
      ) : (
        <DataTable
          caption="Lịch sử luyện tập"
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { header: "Đề", primary: true, cell: (r) => <Link href={`/on-luyen/ket-qua/${r.id}`}>{r.set.title}</Link> },
            { header: "Chuyên đề", cell: (r) => r.set.topic },
            { header: "Mức độ", cell: (r) => <Badge tone={PRACTICE_DIFFICULTY[r.set.difficulty].tone}>{PRACTICE_DIFFICULTY[r.set.difficulty].label}</Badge> },
            { header: "Kết quả", cell: (r) => `${r.score}/${r.maxScore} · đúng ${r.correctCount}/${r.total}` },
            { header: "Thời gian", cell: (r) => formatDateTime(r.submittedAt) },
          ]}
        />
      )}
    </>
  );
}
