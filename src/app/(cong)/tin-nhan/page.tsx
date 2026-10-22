import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { AutoRefresh } from "@/components/messaging/auto-refresh";
import { requireActor } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Tin nhắn" };

// FR-050: danh sách nằm ở layout (cột trái). Cột phải trống tới khi chọn một cuộc trò chuyện (chỉ hiện trên màn hình rộng).
export default async function MessagesPage() {
  await requireActor();
  return (
    <>
      <AutoRefresh seconds={10} />
      <div className="hidden min-h-96 flex-col items-center justify-center gap-3 rounded-block border border-dashed border-line bg-surface p-8 text-center text-muted lg:flex">
        <MessagesSquare className="size-12 text-primary/40" aria-hidden="true" />
        <p>Chọn một cuộc trò chuyện ở bên trái, hoặc bấm “Tin nhắn mới”.</p>
        <p className="text-sm">Gửi được chữ, ảnh (chụp hoặc chọn từ máy) và tệp PDF/Word/Excel.</p>
      </div>
    </>
  );
}
