import type { Metadata } from "next";
import Link from "next/link";
import { QuestionForm } from "@/components/assessment/question-form";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { PracticeForm } from "@/components/practice/practice-form";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { ActionButton, RowActions } from "@/components/ui/row-actions";
import { requireActor } from "@/server/auth/guard";
import { requireLearner } from "@/server/auth/learner";
import type { Actor } from "@/server/auth/session";
import { orNotFound } from "@/server/page";
import {
  deletePracticeQuestionAction,
  deletePracticeSetAction,
  savePracticeQuestionAction,
  setPracticeActiveAction,
  updatePracticeSetAction,
} from "@/server/practice/actions";
import { getPracticeSetForAuthor, openPracticeSet, practiceFilterOptions } from "@/server/practice/service";
import { PRACTICE_DIFFICULTY, QUESTION_TYPE } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";
import { practiceSetFields } from "../fields";

export const metadata: Metadata = { title: "Đề luyện tập" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> };

// HS: làm đề. GV/quản lý: soạn câu hỏi, lời giải, mở/đóng đề.
export default async function PracticeSetPage({ params, searchParams }: Props) {
  const actor = await requireActor();
  const { id } = await params;
  const { thongbao } = await searchParams;
  if (actor.role === "STUDENT" || actor.role === "PARENT") {
    // Phụ huynh làm thay con đang chọn (DECISION-D42).
    const learner = await requireLearner();
    return <StudentView id={id} actor={learner.student} base={learner.base} />;
  }
  return <AuthorView id={id} actor={actor} thongbao={thongbao} />;
}

async function StudentView({ id, actor, base }: { id: string; actor: Actor; base: string }) {
  const { set, questions, attempts } = await orNotFound(openPracticeSet(actor, id));
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`${base}/bai-tap?loai=on-luyen`}>← Tự ôn luyện</Link>
      </p>
      <PageHeader
        title={set.title}
        description={`${set.subject?.name ? `${set.subject.name} · ` : ""}Chuyên đề ${set.topic} · ${set.format} · ${questions.length} câu`}
        action={<Badge tone={PRACTICE_DIFFICULTY[set.difficulty].tone}>{PRACTICE_DIFFICULTY[set.difficulty].label}</Badge>}
      />
      {set.description && <p className="mb-6 whitespace-pre-line">{set.description}</p>}
      {attempts.length > 0 && (
        <Card title={`Các lần bạn đã làm (${attempts.length})`} className="mb-6">
          <ul className="flex flex-wrap gap-2 text-sm">
            {attempts.map((a) => (
              <li key={a.id}>
                <Link href={`/on-luyen/ket-qua/${a.id}`} className="inline-flex min-h-9 items-center rounded-full border border-line px-3 no-underline hover:bg-primary-soft">
                  {formatDateTime(a.submittedAt)} · {a.score}/{a.maxScore}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <PracticeForm setId={set.id} items={questions} />
    </>
  );
}

async function AuthorView({ id, actor, thongbao }: { id: string; actor: Actor; thongbao?: string }) {
  const [set, options] = await Promise.all([orNotFound(getPracticeSetForAuthor(actor, id)), practiceFilterOptions(actor)]);
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/on-luyen">← Tự ôn luyện</Link>
      </p>
      <Flash code={thongbao} />
      <PageHeader
        title={set.title}
        description={`Chuyên đề ${set.topic} · ${set.format} · ${set.questions.length} câu · ${set._count.attempts} lượt làm${set.avgPercent !== null ? ` · điểm TB ${set.avgPercent}%` : ""} · ${set.createdBy.fullName}`}
        action={
          <RowActions>
            <Badge tone={PRACTICE_DIFFICULTY[set.difficulty].tone}>{PRACTICE_DIFFICULTY[set.difficulty].label}</Badge>
            <Badge tone={set.isActive ? "success" : "neutral"}>{set.isActive ? "Đang mở cho HS" : "Nháp"}</Badge>
            {set.forStudent && <Badge tone="warning">{`Bổ sung: ${set.forStudent.fullName}${set.class ? ` · lớp ${set.class.code}` : ""}`}</Badge>}
            {set.canEdit && (
              <ActionButton action={setPracticeActiveAction} hidden={{ setId: set.id, active: set.isActive ? "0" : "1" }} icon={set.isActive ? "hide" : "show"} tone={set.isActive ? "default" : "primary"}>
                {set.isActive ? "Chuyển về nháp" : "Mở cho học sinh"}
              </ActionButton>
            )}
            {set.canEdit && (
              <ActionButton action={deletePracticeSetAction} hidden={{ setId: set.id }} icon="delete" tone="danger" confirm="Xóa đề cùng toàn bộ câu hỏi và lịch sử làm bài của học sinh? Không hoàn tác được.">
                Xóa đề
              </ActionButton>
            )}
          </RowActions>
        }
      />
      {!set.canEdit && <Alert className="mb-6">Đề của giáo viên khác — bạn chỉ xem.</Alert>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title={`Câu hỏi (${set.questions.length})`}>
            {set.questions.length === 0 ? (
              <EmptyState message="Chưa có câu hỏi." />
            ) : (
              <ol className="space-y-5">
                {set.questions.map((q) => (
                  <li key={q.id} className="rounded-control border border-line p-4">
                    <p className="text-sm text-muted">
                      Câu {q.order} · {QUESTION_TYPE[q.type]} · {q.points} điểm
                    </p>
                    <p className="mt-1 whitespace-pre-line">{q.prompt}</p>
                    {q.type === "MCQ" && (
                      <ol className="mt-2 list-decimal space-y-0.5 pl-6 text-sm">
                        {q.options?.map((o, i) => (
                          <li key={i} className={i === q.correctOption ? "font-semibold text-success" : ""}>
                            {o}
                            {i === q.correctOption && " (đúng)"}
                          </li>
                        ))}
                      </ol>
                    )}
                    {q.type === "SHORT" && <p className="mt-2 text-sm">Đáp án chấp nhận: {q.acceptedAnswers?.join(" · ")}</p>}
                    {q.explanation && <p className="mt-2 whitespace-pre-line rounded-control bg-paper p-2 text-sm">Lời giải: {q.explanation}</p>}
                    {set.canEdit && (
                      <details className="mt-3">
                        <summary className="cursor-pointer py-2.5 text-sm text-primary">Sửa hoặc xóa</summary>
                        <div className="mt-3 space-y-4">
                          <QuestionForm assignmentId={set.id} initial={q} practice={{ action: savePracticeQuestionAction, parentName: "setId" }} />
                          <ConfigForm action={deletePracticeQuestionAction} hidden={{ setId: set.id, questionId: q.id }} submitLabel="Xóa câu này" submitVariant="danger" confirm="Xóa câu hỏi này?" fields={[]} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
          {set.canEdit && (
            <Card title="Thêm câu hỏi">
              <QuestionForm assignmentId={set.id} practice={{ action: savePracticeQuestionAction, parentName: "setId" }} />
            </Card>
          )}
        </div>
        {set.canEdit && (
          <Card title="Thông tin đề">
            <ConfigForm action={updatePracticeSetAction} hidden={{ setId: set.id }} submitLabel="Lưu" submitVariant="secondary" fields={practiceSetFields(options, set)} />
          </Card>
        )}
      </div>
    </>
  );
}
