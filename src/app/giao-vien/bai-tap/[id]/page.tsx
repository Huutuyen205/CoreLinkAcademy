import type { Metadata } from "next";
import Link from "next/link";
import { QuestionForm } from "@/components/assessment/question-form";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import {
  deleteQuestionAction,
  publishResultsAction,
  setAssignmentStatusAction,
  updateAssignmentAction,
} from "@/server/assessment/actions";
import { getAssignmentForTeacher } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { round2 } from "@/lib/grading";
import { ASSIGNMENT_STATUS, QUESTION_TYPE } from "@/lib/labels";
import { formatDateTime, formatVn } from "@/lib/time";

export const metadata: Metadata = { title: "Soạn bài tập" };

// UC-008 / UC-010 — FR-027, FR-028, FR-032.
export default async function TeacherAssignmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const a = await orNotFound(getAssignmentForTeacher(actor, id));
  const isDraft = a.status === "DRAFT";
  const total = round2(a.questions.reduce((s, q) => s + q.points, 0));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/lop/${a.class.id}`}>← Lớp {a.class.code}</Link>
      </p>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader
        title={a.title}
        description={`Hạn nộp ${formatDateTime(a.dueAt)} · ${a.questions.length} câu · tổng ${total} điểm${a.allowLate ? " · cho nộp muộn" : ""}`}
        action={
          <span className="flex flex-wrap gap-2">
            <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
            {a.resultsPublishedAt && <Badge tone="success">Đã công bố kết quả</Badge>}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title={`Câu hỏi (${a.questions.length})`}>
            {!isDraft && <Alert className="mb-4">Bài đã giao nên không sửa được câu hỏi.</Alert>}
            {a.questions.length === 0 ? (
              <EmptyState message="Chưa có câu hỏi. Thêm câu hỏi ở bên dưới." />
            ) : (
              <ol className="space-y-5">
                {a.questions.map((q) => (
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
                    {isDraft && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-primary">Sửa hoặc xóa</summary>
                        <div className="mt-3 space-y-4">
                          <QuestionForm assignmentId={a.id} initial={q} />
                          <ConfigForm
                            action={deleteQuestionAction}
                            hidden={{ assignmentId: a.id, questionId: q.id }}
                            submitLabel="Xóa câu này"
                            submitVariant="danger"
                            confirm="Xóa câu hỏi này?"
                            fields={[]}
                          />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
          {isDraft && (
            <Card title="Thêm câu hỏi">
              <QuestionForm assignmentId={a.id} />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Giao bài">
            {a.status === "DRAFT" && (
              <ConfigForm
                action={setAssignmentStatusAction}
                hidden={{ assignmentId: a.id, status: "PUBLISHED" }}
                submitLabel="Giao bài cho lớp"
                confirm="Sau khi giao sẽ không sửa được câu hỏi. Tiếp tục?"
                fields={[]}
              />
            )}
            {a.status === "PUBLISHED" && (
              <ConfigForm action={setAssignmentStatusAction} hidden={{ assignmentId: a.id, status: "CLOSED" }} submitLabel="Đóng bài" submitVariant="secondary" fields={[]} />
            )}
            {a.status === "CLOSED" && (
              <ConfigForm action={setAssignmentStatusAction} hidden={{ assignmentId: a.id, status: "PUBLISHED" }} submitLabel="Mở lại bài" submitVariant="secondary" fields={[]} />
            )}
            {!isDraft && (
              <div className="mt-4 space-y-4 border-t border-line pt-4">
                <ButtonLink href={`/giao-vien/bai-tap/${a.id}/bai-nop`} variant="secondary" className="w-full">
                  Bài nộp ({a._count.submissions})
                </ButtonLink>
                {!a.resultsPublishedAt && (
                  <ConfigForm
                    action={publishResultsAction}
                    hidden={{ assignmentId: a.id }}
                    submitLabel="Công bố kết quả"
                    confirm="Học sinh và phụ huynh sẽ thấy điểm, đáp án và nhận xét. Tiếp tục?"
                    fields={[]}
                  />
                )}
              </div>
            )}
          </Card>

          <Card title="Thông tin bài">
            <ConfigForm
              action={updateAssignmentAction}
              hidden={{ assignmentId: a.id }}
              submitLabel="Lưu"
              submitVariant="secondary"
              fields={[
                { type: "text", name: "title", label: "Tên bài", required: true, maxLength: 200, defaultValue: a.title },
                { type: "textarea", name: "instructions", label: "Hướng dẫn", maxLength: 5000, rows: 3, defaultValue: a.instructions },
                { type: "datetime-local", name: "dueAt", label: "Hạn nộp (giờ Việt Nam)", required: true, defaultValue: formatVn(a.dueAt, "yyyy-MM-dd'T'HH:mm") },
                { type: "checkbox", name: "allowLate", label: "Cho phép nộp muộn", defaultChecked: a.allowLate },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
