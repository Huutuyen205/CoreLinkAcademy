import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Brand, BridgeArc } from "./brand";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md focus:rounded-control">
        Bỏ qua tới nội dung
      </a>

      {/* Thanh thông báo nổi bật đầu trang */}
      <div className="border-b border-primary/20 bg-primary px-4 py-2 text-center text-xs font-medium text-white">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
          <p className="flex items-center gap-2 truncate">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate">Tuyển sinh các lớp Toán – Văn – Anh chuẩn quốc tế (Tiền tiểu học đến THPT)</span>
          </p>
          <div className="hidden sm:flex items-center gap-3 text-xs text-on-brand-muted shrink-0">
            <span>Sĩ số 7–12 HS/lớp</span>
            <span aria-hidden="true">•</span>
            <Link href="/dang-ky-hoc-thu" className="font-semibold text-white underline underline-offset-2 hover:text-brand-tint transition-colors">
              Đăng ký học thử miễn phí
            </Link>
          </div>
        </div>
      </div>

      {/* Header kính mờ dính đầu trang */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md shadow-xs transition-all">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Brand href="/" />
          <nav aria-label="Điều hướng chính" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/khoa-hoc"
              className="inline-flex min-h-10 items-center rounded-control px-3 font-medium text-ink/90 no-underline transition-all hover:bg-primary-soft/80 hover:text-primary active:scale-95"
            >
              Khóa học
            </Link>
            <Link
              href="/dang-ky-hoc-thu"
              className="inline-flex min-h-10 items-center rounded-control px-3 font-medium text-ink/90 no-underline transition-all hover:bg-primary-soft/80 hover:text-primary active:scale-95"
            >
              Học thử
            </Link>
            <ButtonLink href="/dang-nhap" size="sm" variant="secondary" className="transition-all hover:shadow-xs active:scale-95">
              Đăng nhập
            </ButtonLink>
            <ButtonLink
              href="/dang-ky-hoc-thu"
              size="sm"
              variant="primary"
              className="btn-shimmer shadow-xs hidden sm:inline-flex active:scale-95"
            >
              Đăng ký ngay
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main id="noi-dung" className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>

      {/* Chân trang giao diện thương hiệu */}
      <footer className="on-brand relative overflow-hidden bg-gradient-to-b from-primary-strong to-[#0b1348] border-t border-primary/40">
        <BridgeArc className="pointer-events-none absolute -bottom-6 right-0 w-[580px] max-w-[85%] text-white/10" />
        <div className="relative mx-auto flex max-w-[1120px] flex-col gap-8 px-4 py-12 text-sm sm:flex-row sm:justify-between">
          <div className="space-y-4 max-w-sm">
            <Brand href="/" tone="light" />
            <p className="text-on-brand-muted leading-relaxed">
              Trung tâm đào tạo và luyện thi Toán – Văn – Anh các cấp chuẩn quốc tế. Mô hình 7–12 học sinh/lớp, theo sát từng buổi học.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-white/80">
              <span className="rounded-control bg-white/10 px-2.5 py-1 backdrop-blur-xs">10+ năm kinh nghiệm</span>
              <span className="rounded-control bg-white/10 px-2.5 py-1 backdrop-blur-xs">Tối đa 7–12 HS/lớp</span>
              <span className="rounded-control bg-white/10 px-2.5 py-1 backdrop-blur-xs">Cam kết đầu ra</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-12">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Khám phá</p>
              <nav aria-label="Khám phá nhanh" className="flex flex-col gap-2">
                <Link href="/khoa-hoc" className="text-on-brand-muted hover:text-white transition-colors">
                  Danh mục khóa học
                </Link>
                <Link href="/dang-ky-hoc-thu" className="text-on-brand-muted hover:text-white transition-colors">
                  Đăng ký học thử
                </Link>
                <Link href="/dang-nhap" className="text-on-brand-muted hover:text-white transition-colors">
                  Cổng đăng nhập
                </Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Kết nối</p>
              <nav aria-label="Liên kết mạng xã hội" className="flex flex-col gap-2">
                <a
                  href="https://www.facebook.com/CoreLinkAcademy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-on-brand-muted hover:text-white transition-colors"
                >
                  <span>Facebook Fanpage</span>
                  <span aria-hidden="true" className="text-xs">↗</span>
                </a>
                <p className="text-xs text-on-brand-muted/80 max-w-[200px]">
                  Địa chỉ & hotline sẽ được cập nhật chính thức.
                </p>
              </nav>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 py-4 text-center text-xs text-on-brand-muted/70">
          <p>© {new Date().getFullYear()} Core Link Academy. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
