import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" className="font-serif text-xl font-semibold text-ink no-underline">
            CoreLink <span className="text-primary">Academy</span>
          </Link>
          <nav aria-label="Điều hướng chính" className="flex items-center gap-1 sm:gap-2">
            <Link href="/khoa-hoc" className="inline-flex min-h-11 items-center px-2 text-ink no-underline hover:text-primary sm:px-3">
              Khóa học
            </Link>
            <Link href="/dang-ky-hoc-thu" className="inline-flex min-h-11 items-center px-2 text-ink no-underline hover:text-primary sm:px-3">
              Học thử
            </Link>
            <ButtonLink href="/dang-nhap" variant="secondary" size="sm">
              Đăng nhập
            </ButtonLink>
          </nav>
        </div>
      </header>
      <main id="noi-dung" className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <div>
            <p className="font-serif text-base text-ink">CoreLink Academy</p>
            {/* QUESTION-Q02: địa chỉ, hotline, giờ làm việc thật chưa có */}
            <p className="mt-1">Địa chỉ và số điện thoại liên hệ sẽ được cập nhật.</p>
          </div>
          <nav aria-label="Liên kết cuối trang" className="flex gap-4">
            <Link href="/khoa-hoc">Khóa học</Link>
            <Link href="/dang-ky-hoc-thu">Đăng ký học thử</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
