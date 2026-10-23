"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";

type Tone = "success" | "danger";
type Item = { id: number; message: string; tone: Tone };

const EVENT = "corelink:toast";

/** Hiện thông báo nổi (FEAT-B7). Gọi được từ bất kỳ component client nào. */
export function toast(message: string, tone: Tone = "success") {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent<Omit<Item, "id">>(EVENT, { detail: { message, tone } }));
}

let seq = 0;

/** Vùng hiển thị toast — đặt một lần ở layout gốc. Tự ẩn sau 4 giây. */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<Omit<Item, "id">>).detail;
      const id = ++seq;
      setItems((list) => [...list.slice(-3), { id, message, tone }]);
      window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "danger" ? "alert" : "status"}
          className={cn(
            "animate-rise-fast pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-block border px-4 py-3 text-sm font-medium shadow-lg",
            t.tone === "success" ? "border-success/30 bg-surface text-success" : "border-danger/30 bg-surface text-danger",
          )}
        >
          {t.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          <span className="min-w-0 flex-1 text-ink">{t.message}</span>
          <button type="button" onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))} aria-label="Đóng thông báo" className="text-muted hover:text-ink">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
