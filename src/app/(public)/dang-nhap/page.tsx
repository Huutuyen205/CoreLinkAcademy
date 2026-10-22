import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default async function LoginPage() {
  const actor = await getCurrentActor();
  if (actor) redirect(actor.mustChangePassword ? "/doi-mat-khau" : HOME_BY_ROLE[actor.role]);

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-5xl items-center justify-center px-4 py-8 sm:py-14">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 grid w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-primary/15 lg:grid-cols-[1.05fr_1fr]">
        {/* Left Side: Academy Showcase & Visual Anchor (Desktop) */}
        <div className="on-brand relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c1550] via-[#192890] to-[#1f2f98] p-10 lg:flex">
          {/* Subtle Decorative Elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-primary-light/30 blur-2xl" />

          <div>
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 aspect-square overflow-hidden rounded-2xl ring-1 ring-white/30 shadow-md">
                <Image
                  src="/brand/logo.png"
                  alt="Logo Core Link Academy"
                  width={48}
                  height={48}
                  priority
                  className="size-full object-cover"
                />
              </div>
              <div>
                <span className="block font-serif text-lg font-bold tracking-wide text-white">CORE LINK</span>
                <span className="block text-[0.65rem] font-medium tracking-[0.32em] text-on-brand-muted">ACADEMY</span>
              </div>
            </div>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-brand-tint backdrop-blur-xs">
                <Sparkles className="size-3.5 text-accent" />
                Cổng Học Vụ Đa Môn Chuẩn GDPT 2018
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white">
                Đồng hành cùng học sinh bứt phá năng lực
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-on-brand-muted">
                Một hệ thống tích hợp duy nhất phục vụ toàn diện học sinh, phụ huynh, giáo viên và đội ngũ quản lý đào tạo.
              </p>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="my-8 space-y-3.5 border-y border-white/12 py-6 text-sm">
            <div className="flex items-center gap-3 text-white">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-tint">
                <CheckCircle2 className="size-4" />
              </div>
              <span>Theo dõi điểm số, bài tập và chuyên cần trực tuyến</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-tint">
                <BookOpen className="size-4" />
              </div>
              <span>Lộ trình đào tạo 6 môn trọng điểm từ Lớp 1 đến Lớp 12</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-tint">
                <Users className="size-4" />
              </div>
              <span>Kênh kết nối thông tin đa chiều minh bạch giữa Gia đình & Nhà trường</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-brand-muted">
            <span>© 2026 CoreLink Academy</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success-soft" />
              Bảo mật tiêu chuẩn
            </span>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="relative p-7 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Mobile Header Branding */}
            <div className="mb-6 text-center lg:text-left">
              <div className="lg:hidden mb-4 inline-block">
                <Link href="/" className="inline-block transition-transform hover:scale-105" title="Về trang chủ">
                  <div className="relative mx-auto size-16 shrink-0 aspect-square overflow-hidden rounded-2xl ring-1 ring-primary/20 shadow-md">
                    <Image
                      src="/brand/logo.png"
                      alt="Logo Core Link Academy"
                      width={64}
                      height={64}
                      priority
                      className="size-full object-cover"
                    />
                  </div>
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3 text-accent" />
                  Cổng học viện
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Đăng nhập</h1>
              <p className="mt-1 text-sm text-muted">
                Chào mừng bạn quay trở lại với CoreLink Academy
              </p>
            </div>

            {/* Form */}
            <LoginForm />
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 space-y-3.5 border-t border-line/70 pt-5 text-xs text-muted">
            <p className="text-center">
              <Link href="/cai-ung-dung" className="text-sm font-semibold text-primary hover:underline">
                📲 Cài ứng dụng CoreLink lên điện thoại
              </Link>
            </p>
            <p className="text-center">
              Quên mật khẩu? Vui lòng liên hệ <span className="font-semibold text-ink">Ban giáo vụ</span> để được cấp lại tức thời.
            </p>
            <div className="flex items-center justify-between pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-strong hover:underline"
              >
                <ArrowLeft className="size-4" />
                Về trang chủ
              </Link>
              <Link
                href="/dang-ky-hoc-thu"
                className="text-sm font-semibold text-accent hover:underline"
              >
                Đăng ký học thử →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
