"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/format";

/** Trang soạn bài AI mở sẵn đúng ngữ cảnh: đang xem một buổi → buổi đó; đang xem một lớp → buổi gần nhất của lớp. */
export function composeHref(pathname: string): string {
  const session = /^\/giao-vien\/buoi\/([^/]+)/.exec(pathname)?.[1];
  if (session) return `/giao-vien/soan-bai?buoi=${encodeURIComponent(session)}`;
  const klass = /^\/giao-vien\/lop\/([^/]+)/.exec(pathname)?.[1];
  if (klass) return `/giao-vien/soan-bai?lop=${encodeURIComponent(klass)}`;
  return "/giao-vien/soan-bai";
}

const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Nút nổi + phím tắt Alt+A đưa giáo viên tới trang soạn bài AI (form mở sẵn). Đặt phía trên nút chatbot. */
export function ComposeShortcut({ hasBottomNav }: { hasBottomNav: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const href = composeHref(pathname);
  const onPage = pathname.startsWith("/giao-vien/soan-bai");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // `code` thay vì `key`: Alt+A trên macOS cho ký tự "å".
      if (e.code !== "KeyA" || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat || typing(e.target)) return;
      e.preventDefault();
      router.push(composeHref(window.location.pathname));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (onPage) return null;
  return (
    <Link
      href={href}
      aria-label="Soạn bài bằng AI (Alt+A)"
      title="Soạn bài bằng AI (Alt+A)"
      className={cn(
        "fixed right-[1.125rem] z-40 inline-flex size-11 items-center justify-center rounded-full border border-primary/30 bg-surface text-primary shadow-lg no-underline transition-transform hover:scale-105 active:scale-95 lg:right-[1.625rem]",
        hasBottomNav ? "bottom-[calc(9.25rem+env(safe-area-inset-bottom))]" : "bottom-[5rem]",
        "lg:bottom-[6.25rem]",
      )}
    >
      <Sparkles className="size-5" aria-hidden="true" />
      <span className="sr-only">Soạn bài bằng AI</span>
    </Link>
  );
}
