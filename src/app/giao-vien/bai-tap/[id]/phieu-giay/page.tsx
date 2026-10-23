import type { Metadata } from "next";
import Link from "next/link";
import { PaperSheet } from "@/components/ai/paper-sheet";
import { Alert, PageHeader } from "@/components/ui/feedback";
import { aiStatus } from "@/server/ai/client";
import { listSheetCandidates } from "@/server/ai/grading/service";
import { getAssignmentForTeacher } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";

export const metadata: Metadata = { title: "Chấm phiếu giấy" };

export const maxDuration = 60;

// DECISION-D34 — bài làm trên giấy: AI đọc phiếu trắc nghiệm, giáo viên xác nhận.
export default async function PaperSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("TEACHER");
  const { id } = await params;
  const a = await orNotFound(getAssignmentForTeacher(actor, id));
  const supported = a.status !== "DRAFT" && a.questions.length > 0 && a.questions.every((q) => q.type === "MCQ");
  const students = supported ? await orNotFound(listSheetCandidates(actor, id)) : [];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/bai-tap/${a.id}`}>← {a.title}</Link>
      </p>
      <PageHeader title="Chấm phiếu trả lời trên giấy" description={`${a.title} · lớp ${a.class.code}`} />
      {!supported ? (
        <Alert tone="warning">{a.status === "DRAFT" ? "Hãy giao bài trước rồi mới nhập bài làm trên giấy." : "Chỉ bài gồm toàn câu trắc nghiệm mới chấm được bằng phiếu giấy. Bài có câu tự luận hãy chấm ở mục Bài nộp."}</Alert>
      ) : (
        <>
          {aiStatus().mock && (
            <Alert tone="warning" title="Đang ở chế độ mẫu (chưa kết nối AI)" className="mb-6">
              AI sẽ trả đáp án giả lập; bạn chọn lại đúng theo phiếu trước khi lưu.
            </Alert>
          )}
          <PaperSheet
            assignmentId={a.id}
            students={students.map((s) => ({ id: s.id, name: s.fullName, code: s.studentCode }))}
            questions={a.questions.map((q) => ({ id: q.id, order: q.order, prompt: q.prompt, options: q.options ?? [], correctOption: q.correctOption ?? 0, points: q.points }))}
          />
        </>
      )}
    </>
  );
}
