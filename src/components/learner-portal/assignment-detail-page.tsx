import Link from "next/link";
import { AnswerForm } from "@/components/assessment/answer-form";
import { PhotoGrid } from "@/components/assessment/essay-photos";
import { FileList } from "@/components/files/file-list";
import { ConfigForm } from "@/components/forms/config-form";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/feedback";
import { deleteSubmissionFileAction, uploadSubmissionFilesAction } from "@/server/assessment/actions";
import { askAboutAssignmentAction } from "@/server/messaging/actions";
import { openAssignmentForStudent } from "@/server/assessment/service";
import { requireLearner } from "@/server/auth/learner";
import { ACCEPT_ATTRIBUTE, ACCEPT_LABEL } from "@/server/files/rules";
import { orNotFound } from "@/server/page";
import { SUBMISSION_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

// UC-009 — FR-029..FR-032. Trước khi công bố, trang không nhận đáp án đúng từ server.
// Phụ huynh làm/nộp thay con (DECISION-D42): bài vẫn lưu dưới tên học sinh.
export async function LearnerAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { student, base, isParent } = await requireLearner();
  const data = await orNotFound(openAssignmentForStudent(student, (await params).id));
  const { assignment: a, submission, canWork, pastDueBlocked, resultsPublished, awaitingGrade, items } = data;
  const maxScore = a.maxScore;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`${base}/bai-tap`}>← Bài tập</Link>
      </p>
      <PageHeader
        title={a.title}
        description={`Lớp ${a.classCode} · hạn nộp ${formatDateTime(a.dueAt)}${a.allowLate ? " (nhận nộp muộn)" : ""} · ${items.length > 0 ? `${items.length} câu` : "nộp bài bằng tệp/ảnh"} · ${maxScore} điểm`}
        action={
          submission && (
            <span className="flex flex-wrap gap-2">
              {a.isTest && <Badge tone="warning">Bài kiểm tra</Badge>}
              <Badge tone={SUBMISSION_STATUS[submission.status].tone}>{submission.status === "GRADED" && !resultsPublished ? "Đã nộp" : SUBMISSION_STATUS[submission.status].label}</Badge>
              {submission.isLate && <Badge tone="warning">Nộp muộn</Badge>}
            </span>
          )
        }
      />
      {submission?.returnNote !== null && submission?.returnNote !== undefined && (
        <Alert tone="warning" title="Giáo viên yêu cầu nộp lại" className="mb-6">
          {submission.returnNote ? <p className="whitespace-pre-line">Lời nhắn: {submission.returnNote}</p> : <p>Sửa bài rồi bấm &ldquo;Nộp bài&rdquo; lại.</p>}
        </Alert>
      )}
      {a.instructions && <p className="mb-6 whitespace-pre-line">{a.instructions}</p>}
      {a.files.length > 0 && (
        <Card title="Tệp đề bài / tài liệu" className="mb-6">
          <FileList files={a.files} />
        </Card>
      )}
      {a.acceptsFiles && submission && (
        <Card title={`Bài làm dạng tệp/ảnh (${submission.files.length})`} className="mb-6">
          {canWork ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Chụp ảnh bài làm trên giấy hoặc chọn tệp PDF/Word{items.length === 0 ? ", rồi bấm \"Nộp bài\" ở cuối trang." : ". Tệp được gửi kèm khi bạn nộp bài."}
              </p>
              <FileList files={submission.files} empty="Chưa có tệp bài làm." deleteAction={deleteSubmissionFileAction} deleteHidden={{ assignmentId: a.id }} />
              <ConfigForm
                action={uploadSubmissionFilesAction}
                hidden={{ assignmentId: a.id }}
                submitLabel="Tải lên"
                submitVariant="secondary"
                fields={[{ type: "file", name: "files", label: "Chọn ảnh hoặc tệp", hint: ACCEPT_LABEL, accept: `image/*,${ACCEPT_ATTRIBUTE}`, multiple: true }]}
              />
            </div>
          ) : (
            <FileList files={submission.files} empty="Không có tệp bài làm." />
          )}
        </Card>
      )}

      {canWork ? (
        <AnswerForm
          assignmentId={a.id}
          items={items.map((i) => ({ id: i.question.id, order: i.question.order, type: i.question.type, prompt: i.question.prompt, options: i.question.options, points: i.question.points, response: i.response, photos: i.photos }))}
        />
      ) : (
        <>
          {!submission && pastDueBlocked && <Alert tone="warning">Đã quá hạn nộp và bài không nhận nộp muộn.</Alert>}
          {!submission && !pastDueBlocked && <Alert>Bài đã đóng hoặc bạn không còn đang học lớp này.</Alert>}
          {submission && submission.status !== "IN_PROGRESS" && !resultsPublished && !awaitingGrade && (
            <Alert tone="success">Đã nộp bài{submission.submittedAt ? ` lúc ${formatDateTime(submission.submittedAt)}` : ""}. Điểm sẽ hiển thị khi giáo viên công bố kết quả.</Alert>
          )}
          {awaitingGrade && <Alert tone="info">Bài của bạn đang chờ giáo viên chấm.</Alert>}
          {submission && submission.status === "IN_PROGRESS" && <Alert tone="warning">Bài chưa được nộp và không còn nhận bài.</Alert>}

          {resultsPublished && submission && (
            <Alert tone="info" title={`Điểm: ${submission.score ?? 0}/${Math.round(maxScore * 100) / 100}`} className="mb-6">
              {submission.teacherComment && <p className="whitespace-pre-line">Nhận xét: {submission.teacherComment}</p>}
            </Alert>
          )}

          <ol className="mt-6 space-y-5">
            {items.map((i) => {
              const q = i.question;
              const r = i.result;
              const shown = q.type === "MCQ" && i.response != null ? q.options?.[Number(i.response)] : i.response;
              return (
                <li key={q.id} className="rounded-block border border-line bg-surface p-4">
                  <p className="text-sm text-muted">
                    Câu {q.order} · {r ? `${r.points}/${q.points}` : q.points} điểm
                  </p>
                  <p className="mt-1 whitespace-pre-line font-medium">{q.prompt}</p>
                  <p className="mt-2 whitespace-pre-line">
                    <span className="text-sm text-muted">Bài làm: </span>
                    {shown || (i.photos.length === 0 && <span className="text-muted">(Bỏ trống)</span>)}
                  </p>
                  <PhotoGrid photos={i.photos} />
                  {r && q.type === "MCQ" && r.correctOption !== null && <p className="mt-1 text-sm text-success">Đáp án đúng: {q.options?.[r.correctOption]}</p>}
                  {r && q.type === "SHORT" && r.acceptedAnswers && <p className="mt-1 text-sm text-success">Đáp án: {r.acceptedAnswers.join(" · ")}</p>}
                  {r?.feedback && <p className="mt-1 text-sm">Nhận xét: {r.feedback}</p>}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {a.solution && (
        <Card title="Bài chữa / lời giải của giáo viên" className="mt-6">
          <p className="whitespace-pre-line">{a.solution}</p>
        </Card>
      )}

      {!isParent && (
        <details className="mt-6 rounded-block border border-line bg-surface p-4">
          <summary className="cursor-pointer font-semibold text-primary">Hỏi giáo viên về bài này</summary>
          <p className="mt-2 text-sm text-muted">Câu hỏi gửi riêng cho giáo viên phụ trách lớp, tự gắn thẻ bài &ldquo;{a.title}&rdquo;. Có thể kèm ảnh bài làm.</p>
          <ConfigForm
            className="mt-3 space-y-3"
            action={askAboutAssignmentAction}
            hidden={{ assignmentId: a.id }}
            submitLabel="Gửi câu hỏi"
            fields={[
              { type: "textarea", name: "body", label: "Câu hỏi", required: true, maxLength: 2000, rows: 3 },
              { type: "file", name: "files", label: "Ảnh / tệp kèm theo (tùy chọn)", accept: "image/*,.pdf", multiple: true },
            ]}
          />
        </details>
      )}
    </>
  );
}
