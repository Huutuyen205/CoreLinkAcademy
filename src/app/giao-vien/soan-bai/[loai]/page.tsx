import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComposeForm } from "@/components/ai/compose-form";
import { Alert, EmptyState, PageHeader } from "@/components/ui/feedback";
import { composeKindBySlug, pickSessionId } from "@/lib/ai-compose";
import { formatDate } from "@/lib/time";
import { aiStatus } from "@/server/ai/client";
import { listStudentOptionsByClass, listTeachableSessions } from "@/server/ai/generate/context";
import { requireRole } from "@/server/auth/guard";

// Gọi AI có thể mất vài chục giây (Vercel: giới hạn thời gian chạy hàm).
export const maxDuration = 60;

type Props = { params: Promise<{ loai: string }>; searchParams: Promise<{ buoi?: string; lop?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spec = composeKindBySlug((await params).loai);
  return { title: spec ? `Soạn ${spec.title.toLowerCase()} với AI` : "Soạn bài với AI" };
}

// DECISION-D34/D40 — mỗi loại nội dung một form riêng; soạn xong tự lưu nháp và mở trang chi tiết.
export default async function ComposeKindPage({ params, searchParams }: Props) {
  const actor = await requireRole("TEACHER");
  const spec = composeKindBySlug((await params).loai);
  if (!spec) notFound();
  const sp = await searchParams;
  const sessions = await listTeachableSessions(actor);
  const status = aiStatus();
  // Đề bổ sung chỉ cho lớp mình phụ trách (có học sinh để chọn).
  const studentsByClass = spec.forStudent ? await listStudentOptionsByClass(actor, [...new Set(sessions.map((s) => s.classId))]) : {};
  const available = spec.forStudent ? sessions.filter((s) => studentsByClass[s.classId]) : sessions;
  const picked = pickSessionId(available, sp);
  const back = sp.buoi ? `?buoi=${encodeURIComponent(sp.buoi)}` : sp.lop ? `?lop=${encodeURIComponent(sp.lop)}` : "";

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/giao-vien/soan-bai${back}`}>← Soạn bài với AI</Link>
      </p>
      <PageHeader title={`Soạn ${spec.title.toLowerCase()} với AI`} description={spec.description} />
      {status.mock && (
        <Alert tone="warning" title="Đang ở chế độ mẫu (chưa kết nối AI)" className="mb-6">
          Nội dung trả về là dữ liệu mẫu cố định để thử luồng. Quản trị viên đặt biến môi trường <code>AI_PROVIDER</code> và <code>AI_API_KEY</code> để dùng AI thật.
        </Alert>
      )}
      {available.length === 0 ? (
        <EmptyState
          message={spec.forStudent ? "Chỉ giáo viên phụ trách lớp mới tạo được đề bổ sung (buổi trong 14 ngày qua hoặc 45 ngày tới)." : "Bạn chưa có buổi dạy nào trong 14 ngày qua hoặc 45 ngày tới."}
        />
      ) : (
        <ComposeForm
          spec={spec}
          initialSessionId={picked ?? null}
          studentsByClass={studentsByClass}
          sessions={available.map((s) => ({ id: s.id, classId: s.classId, label: `${s.class.code} · buổi ${s.index} · ${formatDate(s.startsAt)} · ${s.class.course.title}` }))}
        />
      )}
    </>
  );
}
