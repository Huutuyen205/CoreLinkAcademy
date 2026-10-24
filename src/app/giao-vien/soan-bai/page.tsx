import type { Metadata } from "next";
import { Generator } from "@/components/ai/generator";
import { Alert, EmptyState, PageHeader } from "@/components/ui/feedback";
import { aiStatus } from "@/server/ai/client";
import { listTeachableSessions } from "@/server/ai/generate/context";
import { requireRole } from "@/server/auth/guard";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Soạn bài với AI" };

// Gọi AI có thể mất vài chục giây (Vercel: giới hạn thời gian chạy hàm).
export const maxDuration = 60;

// DECISION-D34 — giáo án, slide, giáo trình, đề trắc nghiệm/bài tập/tự luận cho một buổi học.
export default async function ComposePage({ searchParams }: { searchParams: Promise<{ buoi?: string; lop?: string }> }) {
  const actor = await requireRole("TEACHER");
  const sp = await searchParams;
  const sessions = await listTeachableSessions(actor);
  const status = aiStatus();
  // `?buoi=` chọn đúng buổi; `?lop=` chọn buổi gần nhất chưa diễn ra của lớp (hoặc buổi cuối trong khoảng chọn được).
  const now = Date.now();
  const ofClass = sp.lop ? sessions.filter((s) => s.classId === sp.lop) : [];
  const picked = sessions.some((s) => s.id === sp.buoi) ? sp.buoi : (ofClass.find((s) => s.startsAt.getTime() >= now) ?? ofClass.at(-1))?.id;

  return (
    <>
      <PageHeader title="Soạn bài với AI" />
      {status.mock && (
        <Alert tone="warning" title="Đang ở chế độ mẫu (chưa kết nối AI)" className="mb-6">
          Nội dung trả về là dữ liệu mẫu cố định để thử luồng. Quản trị viên đặt biến môi trường <code>AI_PROVIDER</code> và <code>AI_API_KEY</code> để dùng AI thật.
        </Alert>
      )}
      {sessions.length === 0 ? (
        <EmptyState message="Bạn chưa có buổi dạy nào trong 14 ngày qua hoặc 45 ngày tới." />
      ) : (
        <Generator
          initialSessionId={picked ?? null}
          sessions={sessions.map((s) => ({ id: s.id, label: `${s.class.code} · buổi ${s.index} · ${formatDate(s.startsAt)} · ${s.class.course.title}` }))}
        />
      )}
    </>
  );
}
