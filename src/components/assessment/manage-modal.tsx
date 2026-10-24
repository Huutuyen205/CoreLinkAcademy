"use client";

import { Settings2, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";

type TabKey = "chi-tiet" | "quan-ly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "chi-tiet", label: "Chi tiết" },
  { key: "quan-ly", label: "Quản lý bài" },
];

/**
 * Hộp thoại quản lý bài tập của giáo viên (thay hai thẻ "Giao bài" + "Thông tin bài" nằm cuối trang khi màn hình hẹp).
 * Hai tab giữ nguyên trong DOM (ẩn bằng `hidden`) để không mất chữ đang nhập khi chuyển tab.
 * Chỉ đóng bằng nút ×, phím Esc hoặc khi trang chuyển hướng — bấm ra ngoài không đóng, tránh mất form đang sửa.
 */
export function ManageModal({ title, details, manage }: { title: string; details: ReactNode; manage: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("quan-ly");
  const [mounted, setMounted] = useState(false);
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => setMounted(true), []);

  // Giao/đóng bài chuyển hướng kèm `?thongbao=…` → đóng hộp để giáo viên thấy thông báo.
  useEffect(() => setOpen(false), [pathname, search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <Button ref={triggerRef} variant="primary" size="md" onClick={() => setOpen(true)} aria-haspopup="dialog" className="w-full sm:w-auto">
        <Settings2 className="size-4" aria-hidden="true" />
        Quản lý bài
      </Button>
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${uid}-title`}
              tabIndex={-1}
              className="animate-scale-in flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-block border border-line bg-surface text-ink shadow-2xl outline-none sm:max-w-2xl sm:rounded-block"
            >
              <header className="flex items-start justify-between gap-3 border-b border-line px-4 pt-4 sm:px-5">
                <h2 id={`${uid}-title`} className="min-w-0 pb-3 text-lg font-semibold">
                  <span className="block truncate">{title}</span>
                </h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:text-ink">
                  <X className="size-5" aria-hidden="true" />
                </button>
              </header>
              <div role="tablist" aria-label="Quản lý bài" className="flex border-b border-line px-2 sm:px-3">
                {TABS.map((t) => {
                  const on = t.key === tab;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      id={`${uid}-tab-${t.key}`}
                      aria-selected={on}
                      aria-controls={`${uid}-panel-${t.key}`}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "-mb-px min-h-12 flex-1 border-b-2 px-3 text-sm sm:flex-none sm:px-6",
                        on ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-ink",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                <div role="tabpanel" id={`${uid}-panel-chi-tiet`} aria-labelledby={`${uid}-tab-chi-tiet`} hidden={tab !== "chi-tiet"}>
                  {details}
                </div>
                <div role="tabpanel" id={`${uid}-panel-quan-ly`} aria-labelledby={`${uid}-tab-quan-ly`} hidden={tab !== "quan-ly"}>
                  {manage}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
