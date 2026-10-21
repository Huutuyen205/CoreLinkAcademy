"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Tải lại dữ liệu trang định kỳ khi tab đang hiển thị (tin nhắn không realtime — FR-050). */
export function AutoRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
