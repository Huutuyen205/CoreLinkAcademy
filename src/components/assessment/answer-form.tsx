"use client";

import type { QuestionType } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EssayPhotos, type PhotoItem } from "@/components/assessment/essay-photos";
import { FormMessage } from "@/components/forms/config-form";
import { Button } from "@/components/ui/button";
import { studentAnswerAction } from "@/server/assessment/actions";
import { initialActionState } from "@/server/errors";

// Chỉ nhận câu hỏi KHÔNG có đáp án (toStudentQuestion) — T-06.
type Item = { id: string; order: number; type: QuestionType; prompt: string; options: string[] | null; points: number; response: string | null; photos: PhotoItem[] };

/** Câu tự luận chưa có chữ lẫn ảnh → nhắc trước khi nộp (vẫn cho nộp). */
function emptyEssays(form: HTMLFormElement | null, essays: { id: string; order: number; hasPhotos: boolean }[]): number[] {
  if (!form) return [];
  return essays.filter((q) => !q.hasPhotos && !String(new FormData(form).get(`answer:${q.id}`) ?? "").trim()).map((q) => q.order);
}

function Buttons({ essays }: { essays: { id: string; order: number; hasPhotos: boolean }[] }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap gap-3 border-t border-line bg-paper py-3 lg:bottom-0">
      <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu nháp"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="submit"
        disabled={pending}
        onClick={(e) => {
          const empty = emptyEssays(e.currentTarget.form, essays);
          const warn = empty.length > 0 ? `Câu ${empty.join(", ")} (tự luận) chưa có bài làm hoặc ảnh. ` : "";
          if (!window.confirm(`${warn}Nộp bài? Sau khi nộp sẽ không sửa được.`)) e.preventDefault();
        }}
      >
        Nộp bài
      </Button>
    </div>
  );
}

export function AnswerForm({ assignmentId, items }: { assignmentId: string; items: Item[] }) {
  const [state, action] = useActionState(studentAnswerAction, initialActionState);
  const v = state.values ?? {};
  const value = (it: Item) => v[`answer:${it.id}`] ?? it.response ?? "";

  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
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
                <div className="mt-3 space-y-2">
                  {(it.options ?? []).map((o, i) => (
                    <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                      <input type="radio" name={`answer:${it.id}`} value={String(i)} defaultChecked={value(it) === String(i)} className="size-5 accent-primary" />
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : it.type === "SHORT" ? (
              <label className="block">
                <span className="text-sm text-muted">
                  Câu {it.order} · {it.points} điểm
                </span>
                <span className="mt-1 block whitespace-pre-line font-medium">{it.prompt}</span>
                <input
                  name={`answer:${it.id}`}
                  defaultValue={value(it)}
                  maxLength={500}
                  className="mt-3 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3"
                />
              </label>
            ) : (
              <div>
                <label className="block">
                  <span className="text-sm text-muted">
                    Câu {it.order} · {it.points} điểm · tự luận
                  </span>
                  <span className="mt-1 block whitespace-pre-line font-medium">{it.prompt}</span>
                  <textarea
                    name={`answer:${it.id}`}
                    defaultValue={value(it)}
                    maxLength={20000}
                    rows={6}
                    placeholder="Gõ bài làm tại đây, hoặc chụp ảnh bài làm trên giấy bên dưới."
                    className="mt-3 block w-full rounded-control border border-line-strong bg-surface px-3 py-2"
                  />
                </label>
                <EssayPhotos assignmentId={assignmentId} questionId={it.id} photos={it.photos} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <Buttons essays={items.filter((it) => it.type === "ESSAY").map((it) => ({ id: it.id, order: it.order, hasPhotos: it.photos.length > 0 }))} />
    </form>
  );
}
