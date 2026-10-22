"use client";

import type { QuestionType } from "@prisma/client";
import { useActionState } from "react";
import { PhotoGrid, type PhotoItem } from "@/components/assessment/essay-photos";
import { FormMessage } from "@/components/forms/config-form";
import { TextareaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { gradeSubmissionAction } from "@/server/assessment/actions";
import { initialActionState } from "@/server/errors";

export type GradingItem = {
  answerId: string | null;
  order: number;
  type: QuestionType;
  prompt: string;
  maxPoints: number;
  responseText: string;
  correctText: string | null;
  autoPoints: number | null;
  teacherPoints: number | null;
  feedback: string | null;
  /** Ảnh bài làm câu tự luận học sinh chụp gửi. */
  photos: PhotoItem[];
};

type Props = {
  submissionId: string;
  items: GradingItem[];
  comment: string | null;
  publishedWarning: boolean;
  /** FR-040: bài không có câu hỏi → một ô điểm tổng trong [0, manualMax]. */
  manualMax?: number | null;
  currentScore?: number | null;
};

/** UC-010: chấm tự luận, sửa điểm câu tự chấm (để trống = giữ điểm tự chấm), nhận xét. */
export function GradingForm({ submissionId, items, comment, publishedWarning, manualMax = null, currentScore = null }: Props) {
  const [state, action] = useActionState(gradeSubmissionAction, initialActionState);
  const e = state.fieldErrors ?? {};
  const v = state.ok ? {} : (state.values ?? {});

  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      {publishedWarning && (
        <p className="rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          Kết quả đã công bố. Mọi thay đổi điểm sẽ được ghi vào nhật ký.
        </p>
      )}
      <input type="hidden" name="submissionId" value={submissionId} />
      <ol className="space-y-5">
        {items.map((it) => (
          <li key={it.order} className="rounded-block border border-line bg-surface p-4">
            <p className="text-sm text-muted">
              Câu {it.order} · tối đa {it.maxPoints} điểm
              {it.autoPoints !== null && ` · tự chấm: ${it.autoPoints}`}
            </p>
            <p className="mt-1 whitespace-pre-line font-medium">{it.prompt}</p>
            <div className="mt-3 rounded-control bg-paper p-3">
              <p className="text-sm text-muted">Bài làm</p>
              <p className="whitespace-pre-line">{it.responseText || (it.photos.length === 0 ? <span className="text-muted">(Bỏ trống)</span> : null)}</p>
              {it.photos.length > 0 && <p className="mt-2 text-sm text-muted">{`Ảnh bài làm (${it.photos.length}) — bấm vào ảnh để xem cỡ lớn:`}</p>}
              <PhotoGrid photos={it.photos} />
            </div>
            {it.correctText && <p className="mt-2 text-sm text-success">Đáp án: {it.correctText}</p>}
            {it.answerId && (
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
                <input type="hidden" name="answerIds" value={it.answerId} />
                <TextField
                  id={`points-${it.answerId}`}
                  name={`points:${it.answerId}`}
                  type="number"
                  step="0.25"
                  min="0"
                  max={String(it.maxPoints)}
                  inputMode="decimal"
                  label={it.type === "ESSAY" ? "Điểm" : "Sửa điểm (tùy chọn)"}
                  required={it.type === "ESSAY"}
                  defaultValue={v[`points:${it.answerId}`] ?? (it.teacherPoints !== null ? String(it.teacherPoints) : "")}
                  error={e[`points:${it.answerId}`]}
                />
                <TextareaField
                  id={`feedback-${it.answerId}`}
                  name={`feedback:${it.answerId}`}
                  label="Nhận xét câu này"
                  rows={2}
                  maxLength={2000}
                  defaultValue={v[`feedback:${it.answerId}`] ?? it.feedback ?? ""}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
      {items.length === 0 && manualMax !== null && (
        <TextField
          name="manualScore"
          type="number"
          step="0.25"
          min="0"
          max={String(manualMax)}
          inputMode="decimal"
          label={`Điểm bài làm (tối đa ${manualMax})`}
          required
          className="max-w-xs"
          defaultValue={v.manualScore ?? (currentScore !== null ? String(currentScore) : "")}
          error={e.manualScore}
        />
      )}
      <TextareaField name="comment" label="Nhận xét chung" rows={3} maxLength={5000} defaultValue={v.comment ?? comment ?? ""} />
      <SubmitButton>Lưu điểm</SubmitButton>
    </form>
  );
}
