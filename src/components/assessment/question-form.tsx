"use client";

import type { QuestionType } from "@prisma/client";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/config-form";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveQuestionAction } from "@/server/assessment/actions";
import { initialActionState, type ActionState } from "@/server/errors";

type Initial = {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options: string[] | null;
  correctOption: number | null;
  acceptedAnswers: string[] | null;
  explanation?: string | null;
};

/** Dùng lại cho đề luyện tập (Tự ôn luyện): action riêng, không có tự luận, thêm ô lời giải. */
type PracticeMode = { action: (state: ActionState, formData: FormData) => Promise<ActionState>; parentName: "setId" };

const TYPE_OPTIONS = [
  { value: "MCQ", label: "Trắc nghiệm (1 đáp án)" },
  { value: "SHORT", label: "Trả lời ngắn (tự chấm)" },
  { value: "ESSAY", label: "Tự luận (giáo viên chấm)" },
];

/** Thêm/sửa câu hỏi (FR-027). Lựa chọn và đáp án nhập mỗi dòng một giá trị. */
export function QuestionForm({ assignmentId, initial, practice }: { assignmentId: string; initial?: Initial; practice?: PracticeMode }) {
  const [state, action] = useActionState(practice?.action ?? saveQuestionAction, initialActionState);
  const typeOptions = practice ? TYPE_OPTIONS.filter((o) => o.value !== "ESSAY") : TYPE_OPTIONS;
  const v = state.ok ? {} : (state.values ?? {});
  const [type, setType] = useState<QuestionType>((v.type as QuestionType) || initial?.type || "MCQ");
  const e = state.fieldErrors ?? {};
  const prefix = initial ? `q-${initial.id}` : "q-new";

  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name={practice?.parentName ?? "assignmentId"} value={assignmentId} />
      <input type="hidden" name="questionId" value={initial?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <SelectField id={`${prefix}-type`} name="type" label="Dạng câu hỏi" options={typeOptions} value={type} onChange={(ev) => setType(ev.target.value as QuestionType)} error={e.type} />
        <TextField
          id={`${prefix}-points`}
          name="points"
          type="number"
          step="0.25"
          min="0.25"
          max="100"
          label="Điểm"
          required
          defaultValue={v.points ?? (initial ? String(initial.points) : "1")}
          error={e.points}
        />
      </div>
      <TextareaField id={`${prefix}-prompt`} name="prompt" label="Nội dung câu hỏi" required maxLength={5000} rows={3} defaultValue={v.prompt ?? initial?.prompt} error={e.prompt} />
      {type === "MCQ" && (
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <TextareaField
            id={`${prefix}-options`}
            name="options"
            label="Các lựa chọn (mỗi dòng một lựa chọn, 2–6 dòng)"
            required
            rows={4}
            maxLength={3000}
            defaultValue={v.options ?? initial?.options?.join("\n")}
            error={e.options}
          />
          <SelectField
            id={`${prefix}-correct`}
            name="correctOption"
            label="Đáp án đúng"
            required
            placeholder="Chọn"
            options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Lựa chọn ${n}` }))}
            defaultValue={v.correctOption ?? (initial?.correctOption != null ? String(initial.correctOption + 1) : "")}
            error={e.correctOption}
          />
        </div>
      )}
      {type === "SHORT" && (
        <TextareaField
          id={`${prefix}-accepted`}
          name="acceptedAnswers"
          label="Đáp án được chấp nhận (mỗi dòng một đáp án)"
          hint="So khớp không phân biệt hoa thường và khoảng trắng thừa."
          required
          rows={3}
          maxLength={2000}
          defaultValue={v.acceptedAnswers ?? initial?.acceptedAnswers?.join("\n")}
          error={e.acceptedAnswers}
        />
      )}
      {practice && (
        <TextareaField
          id={`${prefix}-explanation`}
          name="explanation"
          label="Lời giải / giải thích (hiện cho học sinh sau khi nộp)"
          rows={3}
          maxLength={5000}
          defaultValue={v.explanation ?? initial?.explanation ?? ""}
          error={e.explanation}
        />
      )}
      <SubmitButton variant={initial ? "secondary" : "primary"}>{initial ? "Lưu câu hỏi" : "Thêm câu hỏi"}</SubmitButton>
    </form>
  );
}
