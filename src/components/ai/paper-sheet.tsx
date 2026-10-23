"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card } from "@/components/ui/feedback";
import { readSheetAction, saveSheetAction } from "@/server/ai/grading/actions";
import type { SheetReadResult } from "@/server/ai/grading/service";

type Student = { id: string; name: string; code: string | null };
type Question = { id: string; order: number; prompt: string; options: string[]; correctOption: number; points: number };

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Props = { assignmentId: string; students: Student[]; questions: Question[] };

/**
 * Chấm bài làm trên giấy (phiếu trắc nghiệm): chụp phiếu → AI đọc đáp án → giáo viên đối chiếu, sửa → lưu.
 * Điểm do hệ thống tính từ đáp án đúng đã soạn (không phải AI), và bài vẫn chỉ hiện cho học sinh sau khi công bố.
 */
export function PaperSheet({ assignmentId, students, questions }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [read, setRead] = useState<SheetReadResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const score = questions.reduce((s, q) => s + (answers[q.id] === q.correctOption ? q.points : 0), 0);
  const unread = questions.filter((q) => answers[q.id] === null || answers[q.id] === undefined).length;

  function reset() {
    setFile(null);
    setRead(null);
    setAnswers({});
    setStudentId("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function doRead() {
    if (!file) {
      setMessage({ ok: false, text: "Chọn ảnh phiếu trả lời trước." });
      return;
    }
    setMessage(null);
    const fd = new FormData();
    fd.set("assignmentId", assignmentId);
    fd.set("photo", file);
    startTransition(async () => {
      const res = await readSheetAction(fd);
      if (res.ok) {
        setRead(res.read);
        setAnswers(res.read.answers);
      } else setMessage({ ok: false, text: res.message });
    });
  }

  function doSave() {
    if (!studentId) {
      setMessage({ ok: false, text: "Chọn học sinh của phiếu này." });
      return;
    }
    const fd = new FormData();
    fd.set("assignmentId", assignmentId);
    fd.set("studentId", studentId);
    fd.set("aiRead", JSON.stringify(read?.answers ?? {}));
    for (const q of questions) fd.set(`ans:${q.id}`, answers[q.id] === null || answers[q.id] === undefined ? "" : String(answers[q.id]));
    if (file) fd.set("photo", file);
    startTransition(async () => {
      const res = await saveSheetAction(fd);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) reset();
    });
  }

  return (
    <div className="space-y-6">
      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <Card title="1. Chụp phiếu trả lời">
        <div className="space-y-3">
          <p className="text-sm text-muted">Chụp thẳng, đủ sáng, thấy rõ cả tờ phiếu. Mỗi lần một phiếu của một học sinh. AI đọc ảnh JPG, PNG, WEBP. Ảnh phiếu (không kèm tên học sinh) được gửi tới nhà cung cấp AI mà trung tâm đã cấu hình.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setRead(null);
              setMessage(null);
            }}
            aria-label="Ảnh phiếu trả lời"
            className="block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:font-semibold file:text-primary"
          />
          <Button type="button" onClick={doRead} disabled={pending || !file}>
            {pending && !read ? "AI đang đọc phiếu…" : read ? "Đọc lại" : "AI đọc đáp án"}
          </Button>
        </div>
      </Card>

      {read && (
        <Card title="2. Đối chiếu và xác nhận" action={read.mock ? <Badge tone="warning">Đáp án giả lập</Badge> : <Badge tone="primary">AI đã đọc</Badge>}>
          <div className="space-y-4">
            {read.mock && <Alert tone="warning">Chưa kết nối AI thật nên đáp án dưới đây là giả lập. Hãy chọn lại đúng theo phiếu.</Alert>}
            {read.note && <Alert>{read.note}</Alert>}
            {unread > 0 && <Alert tone="warning">{unread} câu AI không đọc rõ (hoặc để trống) — hãy chọn tay theo phiếu. Câu bỏ trống tính 0 điểm.</Alert>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="py-2 pr-2">Câu</th>
                    <th className="py-2 pr-2">Học sinh chọn</th>
                    <th className="py-2 pr-2">Đáp án đúng</th>
                    <th className="py-2">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const chosen = answers[q.id];
                    const ok = chosen === q.correctOption;
                    return (
                      <tr key={q.id} className="border-b border-line/60">
                        <td className="py-2 pr-2 align-top">
                          <p className="font-semibold">{q.order}</p>
                        </td>
                        <td className="py-2 pr-2">
                          <label className="sr-only" htmlFor={`sheet-${q.id}`}>
                            Câu {q.order}: lựa chọn của học sinh
                          </label>
                          <select
                            id={`sheet-${q.id}`}
                            value={chosen === null || chosen === undefined ? "" : String(chosen)}
                            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value === "" ? null : Number(e.target.value) }))}
                            className="min-h-10 rounded-control border border-line-strong bg-surface px-2"
                          >
                            <option value="">— không rõ / bỏ trống</option>
                            {q.options.map((_, i) => (
                              <option key={i} value={i}>
                                {LETTERS[i]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2 font-medium">{LETTERS[q.correctOption]}</td>
                        <td className="py-2">{chosen === null || chosen === undefined ? <span className="text-muted">Trống · 0</span> : ok ? <span className="font-semibold text-success">Đúng · {q.points}</span> : <span className="text-danger">Sai · 0</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-base font-semibold">Điểm dự kiến: {Math.round(score * 100) / 100}</p>

            <div className="space-y-1.5">
              <label htmlFor="sheet-student" className="block text-sm font-medium">
                Phiếu này của học sinh <span className="text-danger">*</span>
              </label>
              <select
                id="sheet-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="block min-h-11 w-full max-w-sm rounded-control border border-line-strong bg-surface px-3 text-base"
              >
                <option value="">— Chọn học sinh —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ""}
                  </option>
                ))}
              </select>
              {students.length === 0 && <p className="text-sm text-muted">Tất cả học sinh của lớp đã có bài nộp trên hệ thống.</p>}
            </div>

            <Button type="button" onClick={doSave} disabled={pending}>
              {pending ? "Đang lưu…" : "Xác nhận và lưu điểm"}
            </Button>
            <p className="text-sm text-muted">Ảnh phiếu được lưu kèm bài nộp làm bằng chứng. Điểm chỉ hiện với học sinh/phụ huynh sau khi bạn công bố kết quả.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
