"use client";

import type { QuestionType } from "@prisma/client";
import { Plus, X } from "lucide-react";
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
  /** Câu có hình minh họa do AI vẽ (DECISION-D43) → cho phép bỏ hình. */
  hasFigure?: boolean;
};

/** Dùng lại cho đề luyện tập (Tự ôn luyện): action riêng, không có tự luận, thêm ô lời giải. */
type PracticeMode = { action: (state: ActionState, formData: FormData) => Promise<ActionState>; parentName: "setId" };

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Danh sách ô đáp án ban đầu: giá trị gửi lại khi lỗi → đáp án đã lưu → 4 ô trống. */
function initialOptions(sent: string | undefined, saved: string[] | null | undefined): string[] {
  const list = sent !== undefined ? sent.split("\n") : (saved ?? []);
  const trimmed = list.length > 0 ? list : ["", "", "", ""];
  return trimmed.length >= MIN_OPTIONS ? trimmed.slice(0, MAX_OPTIONS) : [...trimmed, ...Array<string>(MIN_OPTIONS - trimmed.length).fill("")];
}

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
  const [options, setOptions] = useState(() => initialOptions(v.options, initial?.options));
  const [correct, setCorrect] = useState<number | null>(() => {
    const raw = v.correctOption ?? (initial?.correctOption != null ? String(initial.correctOption + 1) : "");
    return raw === "" ? null : Number(raw) - 1;
  });
  // Server nhận danh sách mỗi dòng một lựa chọn và số thứ tự (từ 1) của đáp án đúng; ô trống bị bỏ nên đánh số lại.
  const filled = options.map((text, index) => ({ text: text.trim(), index })).filter((o) => o.text);
  const sentCorrect = correct === null ? -1 : filled.findIndex((o) => o.index === correct);

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
        <fieldset className="space-y-2" aria-describedby={e.options || e.correctOption ? `${prefix}-options-error` : undefined}>
          <legend className="text-sm font-medium">
            Các đáp án <span className="font-normal text-muted">(tích ô tròn ở đáp án đúng, 2–6 đáp án)</span>
          </legend>
          <input type="hidden" name="options" value={filled.map((o) => o.text).join("\n")} />
          <input type="hidden" name="correctOption" value={sentCorrect >= 0 ? String(sentCorrect + 1) : ""} />
          <ol className="space-y-2">
            {options.map((text, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`${prefix}-correct-pick`}
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  aria-label={`Đáp án ${LETTERS[i]} là đáp án đúng`}
                  className="size-5 shrink-0 accent-primary"
                />
                <span className="w-5 shrink-0 text-sm font-semibold text-muted" aria-hidden="true">
                  {LETTERS[i]}.
                </span>
                <input
                  value={text}
                  onChange={(ev) => setOptions((list) => list.map((o, j) => (j === i ? ev.target.value : o)))}
                  maxLength={500}
                  placeholder={`Đáp án ${LETTERS[i]}`}
                  aria-label={`Nội dung đáp án ${LETTERS[i]}`}
                  className="block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-base text-ink focus-visible:border-primary"
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptions((list) => list.filter((_, j) => j !== i));
                      setCorrect((c) => (c === null || c === i ? null : c > i ? c - 1 : c));
                    }}
                    aria-label={`Xóa đáp án ${LETTERS[i]}`}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
          {options.length < MAX_OPTIONS && (
            <button type="button" onClick={() => setOptions((list) => [...list, ""])} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary">
              <Plus className="size-4" aria-hidden="true" />
              Thêm đáp án
            </button>
          )}
          {(e.options || e.correctOption) && (
            <p id={`${prefix}-options-error`} className="text-sm text-danger">
              {e.options ?? e.correctOption}
            </p>
          )}
        </fieldset>
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
      {initial?.hasFigure && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="removeFigure" value="1" className="size-5 accent-primary" />
          Bỏ hình minh họa của câu này (hình vẽ sai hoặc không cần)
        </label>
      )}
      <SubmitButton variant={initial ? "secondary" : "primary"}>{initial ? "Lưu câu hỏi" : "Thêm câu hỏi"}</SubmitButton>
    </form>
  );
}
