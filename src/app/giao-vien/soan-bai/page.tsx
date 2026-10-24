import type { Metadata } from "next";
import { BookOpen, ClipboardList, FileText, ListChecks, PencilLine, Presentation, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Alert, PageHeader } from "@/components/ui/feedback";
import { COMPOSE_KINDS, composeHrefFor, pickSessionId } from "@/lib/ai-compose";
import { aiStatus } from "@/server/ai/client";
import { listTeachableSessions } from "@/server/ai/generate/context";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Soạn bài với AI" };

const ICONS: Record<string, LucideIcon> = {
  "giao-an": FileText,
  slide: Presentation,
  "giao-trinh": BookOpen,
  "trac-nghiem": ListChecks,
  "bai-tap": ClipboardList,
  "bo-sung": UserRound,
  "tu-luan": PencilLine,
};

// DECISION-D34/D40 — chọn loại nội dung; mỗi loại có trang và form riêng, soạn xong tự lưu nháp.
export default async function ComposeHubPage({ searchParams }: { searchParams: Promise<{ buoi?: string; lop?: string }> }) {
  const actor = await requireRole("TEACHER");
  const sp = await searchParams;
  const sessions = await listTeachableSessions(actor);
  const status = aiStatus();
  // Sang form với đúng buổi đang xem (đang xem lớp → buổi gần nhất của lớp).
  const buoi = pickSessionId(sessions, sp);

  return (
    <>
      <PageHeader title="Soạn bài với AI" description="Chọn loại nội dung cần soạn. Soạn xong hệ thống tự lưu bản nháp và mở trang chi tiết." />
      {status.mock && (
        <Alert tone="warning" title="Đang ở chế độ mẫu (chưa kết nối AI)" className="mb-6">
          Nội dung trả về là dữ liệu mẫu cố định để thử luồng. Quản trị viên đặt biến môi trường <code>AI_PROVIDER</code> và <code>AI_API_KEY</code> để dùng AI thật.
        </Alert>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPOSE_KINDS.map((k) => {
          const Icon = ICONS[k.slug] ?? FileText;
          return (
            <li key={k.slug}>
              <Link href={composeHrefFor(k.slug, { buoi })} className="card-interactive block h-full rounded-block border border-line bg-surface p-4 no-underline">
                <span className="flex items-center gap-2 font-semibold text-primary">
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {k.title}
                </span>
                <span className="mt-1.5 block text-sm text-muted">{k.description}</span>
                <span className="mt-2 inline-block rounded-control bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{k.preview ? "Xem trước rồi lưu" : k.forStudent ? "Lưu đề bổ sung nháp" : k.exam ? "Lưu bài tập nháp" : "Lưu vào Tài liệu"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
