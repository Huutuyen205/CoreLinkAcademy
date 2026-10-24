import Link from "next/link";
import { Badge } from "@/components/ui/feedback";
import type { listPracticeSets } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY } from "@/lib/labels";

export type PracticeSetRow = Awaited<ReturnType<typeof listPracticeSets>>[number];

/** Lưới thẻ đề luyện tập. `learner` = học sinh (hiện số lần làm, điểm cao nhất) — ngược lại hiện lượt làm + người soạn. */
export function PracticeSetGrid({ sets, learner }: { sets: PracticeSetRow[]; learner: boolean }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sets.map((s) => (
        <li key={s.id} className="card-interactive flex flex-col rounded-block border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PRACTICE_DIFFICULTY[s.difficulty].tone}>{PRACTICE_DIFFICULTY[s.difficulty].label}</Badge>
            {!s.isActive && <Badge tone="neutral">Nháp</Badge>}
            {s.forStudent && <Badge tone="warning">{learner ? "Giáo viên giao riêng" : `Bổ sung: ${s.forStudent.fullName}`}</Badge>}
            {s.subject && <span className="text-sm text-muted">{s.subject.name}</span>}
            {s.level && <span className="text-sm text-muted">· {s.level.name}</span>}
          </div>
          <h2 className="mt-2 text-lg">
            <Link href={`/on-luyen/${s.id}`} className="text-ink no-underline hover:text-primary">
              {s.title}
            </Link>
          </h2>
          <p className="text-sm text-muted">
            Chuyên đề: {s.topic} · Dạng: {s.format}
          </p>
          <p className="mt-auto pt-3 text-sm">
            {s._count.questions} câu
            {learner
              ? s.myAttempts > 0
                ? ` · bạn đã làm ${s.myAttempts} lần · cao nhất ${Math.round((s.myBest ?? 0) * 100)}%`
                : " · chưa làm"
              : ` · ${s._count.attempts} lượt làm · ${s.createdBy.fullName}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
