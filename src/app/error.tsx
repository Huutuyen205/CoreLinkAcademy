"use client";

import { Button } from "@/components/ui/button";

// Không hiển thị chi tiết lỗi/stack trace cho người dùng (docs/09 §5).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="noi-dung" className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl">Đã có lỗi xảy ra</h1>
      <p className="mt-2 text-muted">Hệ thống tạm thời không xử lý được yêu cầu. Vui lòng thử lại sau ít phút.</p>
      <div className="mt-6">
        <Button onClick={reset}>Thử lại</Button>
      </div>
    </main>
  );
}
