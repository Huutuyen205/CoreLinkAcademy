import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import type { getGradebook, listClassAssignments } from "@/server/assessment/service";
import type { listClassSupplementalSets } from "@/server/practice/service";
import { ASSIGNMENT_STATUS, PRACTICE_DIFFICULTY } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

type Assignments = Awaited<ReturnType<typeof listClassAssignments>>;
type Gradebook = NonNullable<Awaited<ReturnType<typeof getGradebook>>>;
type Supplemental = Awaited<ReturnType<typeof listClassSupplementalSets>>;

export function AssignmentsTab({
  classId,
  classCode,
  assignments,
  supplemental,
  gradebook,
  aiSessionId,
}: {
  classId: string;
  classCode: string;
  assignments: Assignments;
  supplemental: Supplemental;
  gradebook: Gradebook | null;
  aiSessionId: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card
        title={`Bài tập và đề (${assignments.length})`}
        action={
          <span className="flex flex-wrap gap-2">
            <ButtonLink href={`/giao-vien/bai-tap/moi?lop=${classId}`} size="sm">
              Tạo bài tập, đề
            </ButtonLink>
            <ButtonLink href={aiSessionId ? `/giao-vien/soan-bai?buoi=${aiSessionId}` : "/giao-vien/soan-bai"} variant="secondary" size="sm">
              Tạo bằng AI
            </ButtonLink>
          </span>
        }
      >
        {assignments.length === 0 ? (
          <EmptyState message="Chưa có bài tập nào." />
        ) : (
          <ul className="divide-y divide-line">
            {assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/giao-vien/bai-tap/${a.id}`} title={a.title} className="block truncate font-medium">
                    {a.title}
                  </Link>
                  <span className="block truncate text-sm text-muted">
                    Hạn {formatDateTime(a.dueAt)} · {a._count.questions} câu
                    {a._count.submissions > 0 ? ` · ${a._count.submissions} bài chờ chấm` : ""}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
                  {a.resultsPublishedAt && <Badge tone="success">Đã công bố</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {supplemental.length > 0 && (
        <Card title={`Đề bổ sung (${supplemental.length})`}>
          <ul className="divide-y divide-line">
            {supplemental.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <Link href={`/on-luyen/${s.id}`} className="font-medium">
                    {s.title}
                  </Link>
                  <span className="block text-sm text-muted">
                    {s.forStudent?.fullName} · {s.topic} · {s._count.questions} câu · {s._count.attempts} lượt làm
                  </span>
                </span>
                <span className="flex gap-2">
                  <Badge tone={PRACTICE_DIFFICULTY[s.difficulty].tone}>{PRACTICE_DIFFICULTY[s.difficulty].label}</Badge>
                  <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Đã mở" : "Nháp"}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {gradebook && gradebook.assignments.length > 0 && (
        <Card title="Bảng điểm" id="bang-diem" className="scroll-mt-24">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <caption className="sr-only">Bảng điểm lớp {classCode}</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Học sinh
                  </th>
                  {gradebook.assignments.map((a) => (
                    <th key={a.id} scope="col" className="px-2 py-2 font-medium">
                      {a.title}
                      <span className="block font-normal">/{a.maxScore}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradebook.rows.map((r) => (
                  <tr key={r.student.id} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {r.student.fullName}
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={gradebook.assignments[i]!.id} className="px-2 py-2">
                        {!c || c.status === "IN_PROGRESS" ? <span className="text-muted">—</span> : c.status === "SUBMITTED" ? "Chờ chấm" : c.score}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
