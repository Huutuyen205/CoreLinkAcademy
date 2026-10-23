"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { Alert, Badge, Card } from "@/components/ui/feedback";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { generateContentAction, saveGeneratedAction, type GenerateState } from "@/server/ai/generate/actions";
import { DIFFICULTY_LABELS } from "@/server/ai/generate/prompts";
import { GENERATE_KINDS, KIND_LABELS, type GeneratedContent } from "@/server/ai/generate/schemas";
import { initialActionState } from "@/server/errors";

type Props = {
  sessions: { id: string; label: string }[];
  initialSessionId: string | null;
};

const EXAM_KINDS = ["quiz", "exercises", "essay"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const initial: GenerateState = { ok: false };

function Preview({ content }: { content: GeneratedContent }) {
  switch (content.kind) {
    case "lesson_plan": {
      const p = content.data;
      return (
        <div className="space-y-3 text-sm">
          <h3 className="text-base font-semibold">{p.title}</h3>
          <div>
            <p className="font-semibold">Mục tiêu</p>
            <ul className="list-disc pl-5">{p.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
          {p.materials.length > 0 && (
            <div>
              <p className="font-semibold">Chuẩn bị</p>
              <ul className="list-disc pl-5">{p.materials.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
          <div>
            <p className="font-semibold">Tiến trình ({p.activities.reduce((s, a) => s + a.minutes, 0)} phút)</p>
            <ol className="space-y-2">
              {p.activities.map((a, i) => (
                <li key={i} className="rounded-control border border-line p-2.5">
                  <p className="font-medium">{i + 1}. {a.name} · {a.minutes} phút</p>
                  <p>{a.description}</p>
                  {a.teacherActions && <p className="text-muted">Giáo viên: {a.teacherActions}</p>}
                  {a.studentActions && <p className="text-muted">Học sinh: {a.studentActions}</p>}
                </li>
              ))}
            </ol>
          </div>
          <p><span className="font-semibold">Đánh giá:</span> {p.assessment}</p>
          {p.homework && <p><span className="font-semibold">Bài về nhà:</span> {p.homework}</p>}
        </div>
      );
    }
    case "slides":
      return (
        <ol className="space-y-2 text-sm">
          {content.data.slides.map((s, i) => (
            <li key={i} className="rounded-control border border-line p-2.5">
              <p className="font-semibold">Slide {i + 1}: {s.title}</p>
              <ul className="list-disc pl-5">{s.bullets.map((b, k) => <li key={k}>{b}</li>)}</ul>
              {s.notes && <p className="mt-1 text-muted">Ghi chú: {s.notes}</p>}
            </li>
          ))}
        </ol>
      );
    case "curriculum": {
      const c = content.data;
      return (
        <div className="space-y-3 text-sm">
          <h3 className="text-base font-semibold">{c.title}</h3>
          <p>{c.summary}</p>
          <ul className="list-disc pl-5">{c.outcomes.map((o, i) => <li key={i}>{o}</li>)}</ul>
          {c.sections.map((s, i) => (
            <div key={i}>
              <p className="font-semibold">{s.heading}</p>
              <p>{s.content}</p>
              <ul className="list-disc pl-5">{s.keyPoints.map((k, j) => <li key={j}>{k}</li>)}</ul>
            </div>
          ))}
        </div>
      );
    }
    case "essay":
      return (
        <ol className="space-y-3 text-sm">
          {content.data.questions.map((q, i) => (
            <li key={i} className="rounded-control border border-line p-2.5">
              <p className="font-medium">Câu {i + 1}. {q.prompt}</p>
              <p className="mt-1 text-success"><span className="font-semibold">Đáp án mẫu:</span> {q.sampleAnswer}</p>
              {q.rubric.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-muted">{q.rubric.map((r, k) => <li key={k}>{r.criterion}: {r.points} điểm</li>)}</ul>
              )}
            </li>
          ))}
        </ol>
      );
    default:
      return (
        <ol className="space-y-3 text-sm">
          {content.data.questions.map((q, i) => (
            <li key={i} className="rounded-control border border-line p-2.5">
              <p className="font-medium">Câu {i + 1}. {q.prompt}</p>
              {q.type === "MCQ" ? (
                <ul className="mt-1 space-y-0.5">
                  {q.options.map((o, k) => (
                    <li key={k} className={k === q.correctOption ? "font-semibold text-success" : ""}>
                      {LETTERS[k]}. {o}{k === q.correctOption && " ✓ (đáp án)"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-success"><span className="font-semibold">Đáp án chấp nhận:</span> {q.acceptedAnswers.join(" · ")}</p>
              )}
              {q.explanation && <p className="mt-1 text-muted">Giải thích: {q.explanation}</p>}
            </li>
          ))}
        </ol>
      );
  }
}

/** Soạn bài với AI: chọn buổi + loại nội dung → xem trước → lưu thành bài tập nháp hoặc tệp Word/PowerPoint. */
export function Generator({ sessions, initialSessionId }: Props) {
  const [state, action] = useActionState(generateContentAction, initial);
  const [saveState, saveAction] = useActionState(saveGeneratedAction, initialActionState);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const result = state.result;
  const isExam = result ? EXAM_KINDS.includes(result.content.kind) : false;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <Card title="Yêu cầu soạn bài">
        <form action={action} noValidate className="space-y-4">
          <FormMessage state={state.ok ? { ok: true } : state} />
          <SelectField id="sessionId" name="sessionId" label="Buổi học" required defaultValue={v.sessionId ?? initialSessionId ?? sessions[0]?.id ?? ""} options={sessions.map((s) => ({ value: s.id, label: s.label }))} error={e.sessionId} />
          <SelectField id="kind" name="kind" label="Loại nội dung" required defaultValue={v.kind ?? "lesson_plan"} options={GENERATE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} error={e.kind} hint="Đề tự luận có đáp án mẫu hiện hỗ trợ môn Toán và Tiếng Anh." />
          <TextField id="topic" name="topic" label="Chủ đề (tùy chọn)" maxLength={300} defaultValue={v.topic ?? ""} error={e.topic} hint="Bỏ trống: lấy theo khung chương trình/nhật ký của buổi." />
          <div className="grid grid-cols-2 gap-3">
            <TextField id="count" name="count" label="Số câu" type="number" min="1" max="30" inputMode="numeric" defaultValue={v.count ?? ""} error={e.count} hint="Cho đề/bài tập." />
            <SelectField id="difficulty" name="difficulty" label="Mức độ" defaultValue={v.difficulty ?? "mixed"} options={(Object.keys(DIFFICULTY_LABELS) as (keyof typeof DIFFICULTY_LABELS)[]).map((k) => ({ value: k, label: DIFFICULTY_LABELS[k] }))} />
          </div>
          <TextareaField id="notes" name="notes" label="Yêu cầu thêm (tùy chọn)" rows={3} maxLength={1000} defaultValue={v.notes ?? ""} error={e.notes} hint="Ví dụ: có 2 câu vận dụng cao, ngữ cảnh đời sống." />
          <SubmitButton className="w-full" pendingLabel="Đang soạn… (có thể mất 10–30 giây)">
            Soạn nội dung
          </SubmitButton>
        </form>
      </Card>

      <div className="min-w-0 space-y-4">
        {!result ? (
          <Card>
            <p className="text-muted">Chọn buổi học và loại nội dung rồi bấm &ldquo;Soạn nội dung&rdquo;. Kết quả hiện ở đây để bạn xem trước, chưa lưu gì cho tới khi bạn bấm lưu.</p>
          </Card>
        ) : (
          <Card
            title={KIND_LABELS[result.content.kind]}
            action={result.mock ? <Badge tone="warning">Bản mẫu — không phải AI thật</Badge> : <Badge tone="primary">{result.provider} · {result.model}</Badge>}
          >
            {result.mock && (
              <Alert tone="warning" className="mb-4">
                Chưa kết nối AI thật nên đây là nội dung <strong>mẫu cố định</strong> để thử luồng. Đừng giao cho học sinh.
              </Alert>
            )}
            <Alert className="mb-4">AI có thể sai (đặc biệt đáp án môn Toán). Hãy kiểm tra kỹ trước khi dùng.</Alert>
            <Preview content={result.content} />

            <form action={saveAction} className="mt-6 space-y-3 border-t border-line pt-4">
              <FormMessage state={saveState} />
              <input type="hidden" name="sessionId" value={result.sessionId} />
              <input type="hidden" name="kind" value={result.content.kind} />
              <input type="hidden" name="payload" value={JSON.stringify(result.content.data)} />
              <div className="flex flex-wrap gap-3">
                {isExam && (
                  <Button type="submit" name="mode" value="assignment">
                    Lưu thành bài tập nháp
                  </Button>
                )}
                <Button type="submit" name="mode" value="document" variant={isExam ? "secondary" : "primary"}>
                  {result.content.kind === "slides" ? "Lưu file PowerPoint (.pptx)" : isExam ? "Lưu file Word đề + đáp án (.docx)" : "Lưu file Word (.docx)"}
                </Button>
              </div>
              <p className="text-sm text-muted">
                {isExam
                  ? "Bài tập nháp: bạn xem, sửa từng câu rồi mới giao cho lớp. File Word chỉ giáo viên thấy, kèm trang đáp án riêng."
                  : "File lưu vào Tài liệu của bạn (chỉ giáo viên thấy). Muốn học sinh xem, hãy chia sẻ ở trang Tài liệu."}
              </p>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
