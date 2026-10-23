"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { suggestGradesAction } from "@/server/ai/grading/actions";
import type { SuggestResult } from "@/server/ai/grading/service";

const CONFIDENCE = {
  low: { label: "Độ tin cậy thấp — hãy chấm lại", tone: "danger" },
  medium: { label: "Độ tin cậy vừa", tone: "warning" },
  high: { label: "Độ tin cậy cao", tone: "success" },
} as const;

/** Điền giá trị vào ô của form chấm (ô không điều khiển bằng state) và báo cho trình duyệt biết đã đổi. */
function fill(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** AI GỢI Ý điểm các câu tự luận. Không tự lưu: giáo viên bấm "Áp dụng" rồi tự bấm "Lưu điểm" ở form chấm. */
export function GradeAssist({ submissionId, essayCount }: { submissionId: string; essayCount: number }) {
  const [rubric, setRubric] = useState("");
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  if (essayCount === 0) return null;

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await suggestGradesAction({ submissionId, rubric });
      if (res.ok) {
        setResult(res.result);
        setApplied(new Set());
      } else setError(res.message);
    });
  }

  function apply(s: SuggestResult["suggestions"][number]) {
    fill(`points-${s.answerId}`, String(s.points));
    if (s.feedback) fill(`feedback-${s.answerId}`, s.feedback);
    setApplied((a) => new Set(a).add(s.answerId));
  }

  return (
    <section className="space-y-3 rounded-block border border-primary/25 bg-primary-soft/50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-semibold">AI gợi ý điểm tự luận</h2>
      </div>
      <p className="text-sm text-muted">
        AI đọc bài (cả ảnh chụp bài viết tay) và gợi ý điểm + nhận xét cho {essayCount} câu tự luận. Điểm chỉ được ghi khi bạn bấm &ldquo;Lưu điểm&rdquo; ở cuối trang.
      </p>
      <p className="text-xs text-muted">Khi bấm, bài làm của học sinh (không kèm tên) được gửi tới nhà cung cấp AI mà trung tâm đã cấu hình.</p>
      <div className="space-y-1.5">
        <label htmlFor="ai-rubric" className="block text-sm font-medium">
          Đáp án mẫu / thang điểm (tùy chọn, giúp AI chấm sát hơn)
        </label>
        <textarea
          id="ai-rubric"
          value={rubric}
          onChange={(e) => setRubric(e.target.value)}
          rows={3}
          maxLength={4000}
          className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-base focus-visible:border-primary"
          placeholder="Dán đáp án mẫu hoặc tiêu chí chấm của đề này…"
        />
      </div>
      <Button type="button" onClick={run} disabled={pending} variant="secondary">
        {pending ? "AI đang đọc bài… (10–30 giây)" : result ? "Gợi ý lại" : "Nhờ AI gợi ý điểm"}
      </Button>

      {error && <Alert tone="danger">{error}</Alert>}

      {result && (
        <div className="space-y-3">
          {result.mock && <Alert tone="warning">Đây là gợi ý giả lập (chưa kết nối AI thật), không phản ánh chất lượng bài làm.</Alert>}
          {result.skipped.map((s) => (
            <p key={s.order} className="text-sm text-muted">
              Câu {s.order}: bỏ qua — {s.reason}
            </p>
          ))}
          <ul className="space-y-3">
            {result.suggestions.map((s) => (
              <li key={s.answerId} className="rounded-control border border-line bg-surface p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    Câu {s.order}: gợi ý {s.points}/{s.maxPoints} điểm
                  </p>
                  <Badge tone={CONFIDENCE[s.confidence].tone}>{CONFIDENCE[s.confidence].label}</Badge>
                </div>
                {s.feedback && <p className="mt-1 whitespace-pre-line">{s.feedback}</p>}
                {s.transcript && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-primary">Nội dung AI đọc từ ảnh ({s.photos} ảnh) — đối chiếu với ảnh gốc</summary>
                    <p className="mt-1 whitespace-pre-line rounded-control bg-paper p-2 text-muted">{s.transcript}</p>
                  </details>
                )}
                <Button type="button" size="sm" variant={applied.has(s.answerId) ? "ghost" : "primary"} className="mt-2" onClick={() => apply(s)}>
                  {applied.has(s.answerId) ? "Đã điền vào form — bấm để điền lại" : "Áp dụng vào form"}
                </Button>
              </li>
            ))}
          </ul>
          {result.suggestions.length > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                for (const s of result.suggestions) apply(s);
              }}
            >
              Áp dụng tất cả vào form
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
