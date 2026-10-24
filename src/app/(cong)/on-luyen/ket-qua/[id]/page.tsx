import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, PageHeader } from "@/components/ui/feedback";
import { requireLearner } from "@/server/auth/learner";
import { orNotFound } from "@/server/page";
import { getPracticeAttempt } from "@/server/practice/service";
import { cn } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Kết quả luyện tập" };

// Học sinh §5: xem kết quả bài luyện, đáp án và lời giải.
export default async function PracticeResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { student } = await requireLearner();
  const { attempt, set, items } = await orNotFound(getPracticeAttempt(student, (await params).id));
  const percent = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/on-luyen/lich-su">← Lịch sử luyện tập</Link>
      </p>
      <PageHeader
        title={`Kết quả: ${set.title}`}
        description={`${set.subject?.name ? `${set.subject.name} · ` : ""}Chuyên đề ${set.topic} · nộp lúc ${formatDateTime(attempt.submittedAt)}`}
        action={
          set.isActive && (
            <ButtonLink href={`/on-luyen/${set.id}`} size="sm">
              Làm lại
            </ButtonLink>
          )
        }
      />
      <Alert tone={percent >= 80 ? "success" : percent >= 50 ? "info" : "warning"} title={`${attempt.score}/${attempt.maxScore} điểm (${percent}%)`} className="mb-6">
        Đúng {attempt.correctCount}/{attempt.total} câu. {percent >= 80 ? "Rất tốt!" : percent >= 50 ? "Khá — xem lời giải các câu sai rồi làm lại nhé." : "Hãy đọc kỹ lời giải và thử lại."}
      </Alert>
      <ol className="space-y-5">
        {items.map(({ question: q, explanation, response, correct }) => {
          const shown = q.type === "MCQ" && response !== "" ? q.options?.[Number(response)] : response;
          return (
            <li key={q.id} className={cn("rounded-block border bg-surface p-4", correct ? "border-success/40" : "border-danger/30")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted">
                  Câu {q.order} · {q.points} điểm
                </p>
                <Badge tone={correct ? "success" : "danger"}>{correct ? "Đúng" : response ? "Sai" : "Bỏ trống"}</Badge>
              </div>
              <p className="mt-1 whitespace-pre-line font-medium">{q.prompt}</p>
              <p className="mt-2">
                <span className="text-sm text-muted">Bạn trả lời: </span>
                {shown || <span className="text-muted">(Bỏ trống)</span>}
              </p>
              {q.type === "MCQ" && q.correctOption !== null && <p className="mt-1 text-sm text-success">Đáp án đúng: {q.options?.[q.correctOption]}</p>}
              {q.type === "SHORT" && q.acceptedAnswers && <p className="mt-1 text-sm text-success">Đáp án: {q.acceptedAnswers.join(" · ")}</p>}
              {explanation && <p className="mt-2 whitespace-pre-line rounded-control bg-paper p-3 text-sm">Lời giải: {explanation}</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
