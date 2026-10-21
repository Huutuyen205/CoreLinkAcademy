import type { Metadata } from "next";
import Link from "next/link";
import { GradingForm } from "@/components/assessment/grading-form";
import { FileList } from "@/components/files/file-list";
import { Badge, Card, PageHeader } from "@/components/ui/feedback";
import { getSubmissionForGrading } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { SUBMISSION_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Chấm bài" };

export default async function GradeSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const { submission, items, maxScore } = await orNotFound(getSubmissionForGrading(actor, (await params).id));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/bai-tap/${submission.assignmentId}/bai-nop`}>← Bài nộp</Link>
      </p>
      <PageHeader
        title={`${submission.student.fullName} — ${submission.assignment.title}`}
        description={submission.submittedAt ? `Nộp lúc ${formatDateTime(submission.submittedAt)}${submission.isLate ? " (muộn)" : ""}` : "Chưa nộp"}
        action={
          <span className="flex gap-2">
            <Badge tone={SUBMISSION_STATUS[submission.status].tone}>{SUBMISSION_STATUS[submission.status].label}</Badge>
            {submission.score !== null && (
              <Badge tone="primary">
                {submission.score}/{maxScore} điểm
              </Badge>
            )}
          </span>
        }
      />
      {(submission.files.length > 0 || submission.assignment.acceptsFiles) && (
        <Card title={`Tệp bài làm (${submission.files.length})`} className="mb-6">
          <FileList files={submission.files} empty="Học sinh không gửi tệp." />
        </Card>
      )}
      {submission.status === "IN_PROGRESS" ? (
        <p className="text-muted">Học sinh chưa nộp bài.</p>
      ) : (
        <GradingForm
          submissionId={submission.id}
          manualMax={items.length === 0 ? maxScore : null}
          currentScore={submission.score}
          comment={submission.teacherComment}
          publishedWarning={Boolean(submission.assignment.resultsPublishedAt)}
          items={items.map(({ question: q, answer }) => ({
            answerId: answer?.id ?? null,
            order: q.order,
            type: q.type,
            prompt: q.prompt,
            maxPoints: q.points,
            responseText:
              q.type === "MCQ" && answer?.response != null ? `${Number(answer.response) + 1}. ${q.options?.[Number(answer.response)] ?? ""}` : (answer?.response ?? ""),
            correctText:
              q.type === "MCQ" && q.correctOption !== null ? `${q.correctOption + 1}. ${q.options?.[q.correctOption] ?? ""}` : q.type === "SHORT" ? (q.acceptedAnswers ?? []).join(" · ") : null,
            autoPoints: answer?.autoPoints ?? null,
            teacherPoints: answer?.teacherPoints ?? null,
            feedback: answer?.feedback ?? null,
          }))}
        />
      )}
    </>
  );
}
