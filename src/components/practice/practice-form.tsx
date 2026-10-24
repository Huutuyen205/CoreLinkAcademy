"use client";

import type { QuestionType } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage } from "@/components/forms/config-form";
import { Button } from "@/components/ui/button";
import { QuestionFigure } from "@/components/ui/question-figure";
import { submitPracticeAction } from "@/server/practice/actions";
import { initialActionState } from "@/server/errors";
import type { FigureView } from "@/server/figures/render";

// Chỉ nhận câu hỏi KHÔNG có đáp án/lời giải (openPracticeSet).
type Item = { id: string; order: number; type: QuestionType; prompt: string; options: string[] | null; points: number; figure?: FigureView | null };

function SubmitBar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-paper py-3 lg:bottom-0">
      <Button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          const answered = new Set([...new FormData(form).entries()].filter(([k, v]) => k.startsWith("answer:") && String(v).trim()).map(([k]) => k));
          const missing = total - answered.size;
          if (missing > 0 && !window.confirm(`Còn ${missing} câu chưa trả lời. Vẫn nộp bài?`)) e.preventDefault();
        }}
      >
        {pending ? "Đang chấm…" : "Nộp bài và xem kết quả"}
      </Button>
    </div>
  );
}

/** Làm đề luyện tập: nộp một lần, chấm ngay (Học sinh §5). */
export function PracticeForm({ setId, items }: { setId: string; items: Item[] }) {
  const [state, action] = useActionState(submitPracticeAction, initialActionState);
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="setId" value={setId} />
      <ol className="space-y-5">
        {items.map((it) => (
          <li key={it.id} className="rounded-block border border-line bg-surface p-4">
            {it.type === "MCQ" ? (
              <fieldset>
                <legend className="font-medium">
                  <span className="text-sm font-normal text-muted">
                    Câu {it.order} · {it.points} điểm
                  </span>
                  <span className="mt-1 block whitespace-pre-line">{it.prompt}</span>
                </legend>
                <QuestionFigure figure={it.figure} />
                <div className="mt-3 space-y-2">
                  {(it.options ?? []).map((o, i) => (
                    <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                      <input type="radio" name={`answer:${it.id}`} value={String(i)} className="size-5 accent-primary" />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              // Đề + hình nằm ngoài <label> (hình là khối <figure>); ô nhập trỏ tới đề bằng aria-labelledby.
              <div>
                <p id={`pq-${it.id}`}>
                  <span className="text-sm text-muted">
                    Câu {it.order} · {it.points} điểm
                  </span>
                  <span className="mt-1 block whitespace-pre-line font-medium">{it.prompt}</span>
                </p>
                <QuestionFigure figure={it.figure} />
                <input name={`answer:${it.id}`} aria-labelledby={`pq-${it.id}`} maxLength={500} autoComplete="off" className="mt-3 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-base" placeholder="Nhập đáp án" />
              </div>
            )}
          </li>
        ))}
      </ol>
      <SubmitBar total={items.length} />
    </form>
  );
}
