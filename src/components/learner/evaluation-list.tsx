import { Card, EmptyState } from "@/components/ui/feedback";
import type { listEvaluationsOfStudent } from "@/server/evaluations/service";
import { formatDate } from "@/lib/time";

type Evaluations = Awaited<ReturnType<typeof listEvaluationsOfStudent>>;

/** Đánh giá định kỳ đã gửi (HS, PH, quản lý) — FR-049. */
export function EvaluationList({ evaluations, title = "Đánh giá định kỳ của giáo viên", hideWhenEmpty = false }: { evaluations: Evaluations; title?: string; hideWhenEmpty?: boolean }) {
  if (hideWhenEmpty && evaluations.length === 0) return null;
  return (
    <Card title={title}>
      {evaluations.length === 0 ? (
        <EmptyState message="Chưa có đánh giá định kỳ." />
      ) : (
        <ul className="space-y-4">
          {evaluations.map((ev) => (
            <li key={ev.id} className="rounded-control border border-line p-3">
              <p className="font-medium">
                {ev.period} · lớp {ev.class.code}
                <span className="text-sm font-normal text-muted">
                  {" "}
                  · GV {ev.teacher.fullName}
                  {ev.sentAt ? ` · ${formatDate(ev.sentAt)}` : ""}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-line">{ev.content}</p>
              {ev.strengths && (
                <p className="mt-1 text-sm">
                  <strong>Điểm mạnh:</strong> {ev.strengths}
                </p>
              )}
              {ev.improvements && (
                <p className="mt-1 text-sm">
                  <strong>Cần cải thiện:</strong> {ev.improvements}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
