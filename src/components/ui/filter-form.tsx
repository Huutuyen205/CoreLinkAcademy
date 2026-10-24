"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useEffect, useRef, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/format";

/** `SearchSelect` đọc cờ này để tự gửi form lọc ngay khi chọn xong. */
export const InFilterForm = createContext(false);

// Giữ con trỏ ở ô tìm kiếm sau khi trang tải lại kết quả (kể cả khi form được dựng lại).
let restoreFocus: { path: string; name: string } | null = null;

/**
 * Form lọc danh sách: chọn ô (select/ngày/checkbox) là lọc ngay, gõ chữ thì lọc sau 0,5 giây ngừng gõ.
 * Kết quả đưa vào URL (`?…`) như form GET thường — luôn về trang 1 vì `page` không nằm trong form.
 */
export function FilterForm({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const timer = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (restoreFocus?.path !== pathname || !formRef.current) return;
    const el = formRef.current.elements.namedItem(restoreFocus.name);
    if (el instanceof HTMLInputElement && document.activeElement !== el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const apply = (form: HTMLFormElement) => {
    window.clearTimeout(timer.current);
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value.trim() !== "") params.append(key, value.trim());
    }
    const qs = params.toString();
    const active = document.activeElement;
    restoreFocus = active instanceof HTMLInputElement && form.contains(active) && (active.type === "text" || active.type === "search") ? { path: pathname, name: active.name } : null;
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Ô tìm trong `SearchSelect` (data-no-filter) không có `name`: chọn xong ô ẩn mới gửi form, gõ chữ chưa phải là lọc.
  const isTyping = (el: EventTarget) => el instanceof HTMLInputElement && (el.type === "text" || el.type === "search") && !("noFilter" in el.dataset);
  const ignored = (el: EventTarget) => el instanceof HTMLElement && "noFilter" in el.dataset;

  return (
    <form
      ref={formRef}
      method="get"
      role="search"
      aria-busy={pending}
      className={cn(className, pending && "opacity-75 transition-opacity")}
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if (!isTyping(e.target) && !ignored(e.target)) apply(e.currentTarget);
      }}
      onInput={(e) => {
        if (!isTyping(e.target)) return;
        const form = e.currentTarget;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => apply(form), 500);
      }}
    >
      <InFilterForm.Provider value>{children}</InFilterForm.Provider>
    </form>
  );
}
