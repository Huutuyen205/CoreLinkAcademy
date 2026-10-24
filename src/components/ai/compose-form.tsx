"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PptxPreview } from "@/components/ai/pptx-preview";
import { FormMessage } from "@/components/forms/config-form";
import { Alert, Badge, Card } from "@/components/ui/feedback";
import { TextareaField, TextField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ComposeKind } from "@/lib/ai-compose";
import { composeWithAiAction, saveSlidesAction, type ComposeState } from "@/server/ai/generate/actions";
import { DIFFICULTY_LABELS } from "@/server/ai/generate/prompts";
import { initialActionState } from "@/server/errors";

type Props = {
  spec: ComposeKind;
  sessions: { id: string; classId: string; label: string }[];
  initialSessionId: string | null;
  /** Học sinh theo lớp — chỉ dùng cho đề bổ sung cá nhân. */
  studentsByClass: Record<string, { value: string; label: string }[]>;
};

const DIFFICULTY_OPTIONS = (Object.keys(DIFFICULTY_LABELS) as (keyof typeof DIFFICULTY_LABELS)[]).map((k) => ({ value: k, label: DIFFICULTY_LABELS[k] }));
const initial: ComposeState = { ok: false };

/**
 * Form soạn bài của MỘT loại nội dung. Gửi xong: AI soạn → tự lưu nháp → máy chủ chuyển sang trang chi tiết.
 * Slide: soạn xong hiện bản xem trước như PowerPoint, bấm lưu mới tạo file.
 */
export function ComposeForm({ spec, sessions, initialSessionId, studentsByClass }: Props) {
  const [state, action] = useActionState(composeWithAiAction, initial);
  const [saveState, saveAction] = useActionState(saveSlidesAction, initialActionState);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const [sessionId, setSessionId] = useState(v.sessionId ?? initialSessionId ?? sessions[0]?.id ?? "");
  const classId = sessions.find((s) => s.id === sessionId)?.classId ?? "";
  const students = spec.forStudent ? (studentsByClass[classId] ?? []) : [];
  const result = state.result;
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-4">
        <Alert>AI có thể sai (đặc biệt đáp án môn Toán). Hãy kiểm tra kỹ trước khi dùng.</Alert>
        <Card title="Yêu cầu soạn bài">
          <form action={action} noValidate className="space-y-4">
            <FormMessage state={state} />
            <input type="hidden" name="kind" value={spec.kind} />
            {spec.forStudent && <input type="hidden" name="forStudent" value="1" />}
            <SearchSelect
              name="sessionId"
              label="Buổi học"
              required
              placeholder="Gõ tên lớp, số buổi hoặc ngày để tìm…"
              defaultValue={sessionId}
              options={sessions.map((s) => ({ value: s.id, label: s.label }))}
              error={e.sessionId}
              onChange={setSessionId}
            />
            {spec.forStudent && (
              <SearchSelect
                key={classId}
                name="studentId"
                label="Học sinh nhận đề"
                required
                placeholder={students.length === 0 ? "Lớp này chưa có học sinh đang học" : "Gõ tên học sinh để tìm…"}
                defaultValue={v.studentId && students.some((s) => s.value === v.studentId) ? v.studentId : ""}
                options={students}
                error={e.studentId}
              />
            )}
            <TextField id="topic" name="topic" label="Chủ đề (tùy chọn)" maxLength={300} defaultValue={v.topic ?? ""} error={e.topic} hint={spec.topicHint} />
            {spec.count && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="count"
                  name="count"
                  label="Số câu"
                  type="number"
                  min="1"
                  max={spec.count.max}
                  inputMode="numeric"
                  defaultValue={v.count ?? ""}
                  placeholder={String(spec.count.default)}
                  error={e.count}
                  hint={`Bỏ trống: ${spec.count.default} câu. Tối đa ${spec.count.max}.`}
                />
                <SearchSelect name="difficulty" label="Mức độ" required defaultValue={v.difficulty ?? "mixed"} options={DIFFICULTY_OPTIONS} />
              </div>
            )}
            <TextareaField id="notes" name="notes" label="Yêu cầu thêm (tùy chọn)" rows={3} maxLength={1000} defaultValue={v.notes ?? ""} error={e.notes} hint={spec.notesHint} />
            <SubmitButton className="w-full sm:w-auto" pendingLabel={spec.preview ? "Đang soạn slide… (có thể mất 10–30 giây)" : "Đang soạn và lưu nháp… (có thể mất 10–30 giây)"}>
              {spec.preview ? "Soạn slide và xem trước" : "Soạn và lưu nháp"}
            </SubmitButton>
            <p className="text-sm text-muted">
              {spec.preview
                ? "Soạn xong hiện bản xem trước như trong PowerPoint. Chưa lưu gì cho tới khi bạn bấm lưu file."
                : spec.forStudent
                  ? "Soạn xong, hệ thống tự lưu thành đề bổ sung NHÁP (học sinh chưa thấy) và mở trang đề để bạn xem, sửa từng câu rồi mới mở cho học sinh."
                  : spec.exam
                    ? "Soạn xong, hệ thống tự lưu thành bài tập NHÁP (chưa giao cho lớp) và mở trang chi tiết để bạn xem, sửa từng câu rồi mới giao."
                    : "Soạn xong, hệ thống tự lưu vào Tài liệu của bạn (chỉ giáo viên thấy) và mở trang chi tiết để bạn tải về, kiểm tra và chia sẻ khi cần."}
            </p>
          </form>
        </Card>
      </div>

      {result?.content.kind === "slides" && (
        <div ref={previewRef} className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Xem trước PowerPoint</h2>
            {result.mock ? (
              <Badge tone="warning">Bản mẫu — không phải AI thật</Badge>
            ) : (
              <Badge tone="primary">
                {result.provider} · {result.model}
              </Badge>
            )}
          </div>
          {result.mock && (
            <Alert tone="warning">
              Chưa kết nối AI thật nên đây là nội dung <strong>mẫu cố định</strong> để thử luồng. Đừng dùng giảng dạy.
            </Alert>
          )}
          <PptxPreview deck={result.content.data} meta={result.meta} fileName={`Slide-${result.meta.classCode}-buoi${result.meta.sessionIndex}.pptx`} />
          <form action={saveAction} className="space-y-3">
            <FormMessage state={saveState} />
            <input type="hidden" name="sessionId" value={result.sessionId} />
            <input type="hidden" name="kind" value="slides" />
            <input type="hidden" name="payload" value={JSON.stringify(result.content.data)} />
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel="Đang tạo file…">Lưu file PowerPoint (.pptx)</SubmitButton>
              <span className="text-sm text-muted">Lưu vào Tài liệu của bạn (chỉ giáo viên thấy). Không ưng ý thì chỉnh yêu cầu ở trên rồi soạn lại.</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
