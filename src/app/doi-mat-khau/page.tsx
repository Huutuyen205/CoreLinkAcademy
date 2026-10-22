import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Alert } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Đổi mật khẩu", robots: { index: false } };

export default async function ChangePasswordPage() {
  const actor = await requireActor({ allowPasswordChange: true });

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-paper">
      <header className="on-brand bg-gradient-to-r from-primary-strong via-primary to-primary-light shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Brand href={HOME_BY_ROLE[actor.role]} tone="light" />
          <span className="text-xs font-semibold text-brand-tint">An toàn bảo mật</span>
        </div>
      </header>

      <main id="noi-dung" className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-9 shadow-xl shadow-primary/8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-2xs">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-ink">Đổi mật khẩu</h1>
              <p className="text-xs text-muted">Cập nhật mật khẩu bảo vệ tài khoản của bạn</p>
            </div>
          </div>

          {actor.mustChangePassword && (
            <Alert tone="warning" className="mb-5">
              Bạn đang sử dụng mật khẩu tạm do học viện cấp. Vui lòng thiết lập mật khẩu mới để bắt đầu sử dụng đầy đủ các tính năng.
            </Alert>
          )}

          <div className="mt-4">
            <ChangePasswordForm />
          </div>

          {!actor.mustChangePassword && (
            <div className="mt-6 border-t border-line/70 pt-4 text-center">
              <Link
                href={HOME_BY_ROLE[actor.role]}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="size-4" />
                <span>Quay lại trang tổng quan</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-subtle">
        <span>© 2026 CoreLink Academy • Hệ thống bảo mật 2 lớp Argon2id</span>
      </footer>
    </div>
  );
}
