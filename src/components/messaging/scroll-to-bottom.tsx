"use client";

import { useEffect, useRef } from "react";

/** Mở cuộc trò chuyện → cuộn xuống tin mới nhất; có tin mới khi đang ở gần cuối → cuộn theo (không giật khi đang đọc tin cũ). */
export function ScrollToBottom({ marker }: { marker: string }) {
  const first = useRef(true);
  useEffect(() => {
    const doc = document.documentElement;
    const nearBottom = doc.scrollHeight - (window.scrollY + window.innerHeight) < 240;
    if (first.current || nearBottom) window.scrollTo({ top: doc.scrollHeight, behavior: first.current ? "instant" : "smooth" });
    first.current = false;
  }, [marker]);
  return null;
}
