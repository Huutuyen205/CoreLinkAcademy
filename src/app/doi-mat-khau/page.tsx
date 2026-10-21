import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/feedback";
import { requireActor } from "@/server/auth/guard";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Đổi mật khẩu", robots: { index: false } };

export default async function ChangePasswordPage() {
  const actor = await requireActor({ allowPasswordChange: true });

  return (
    <main id="noi-dung" className="mx-auto max-w-md px-4 py-10">
      <p className="font-serif text-lg font-semibold">
        CoreLink <span className="text-primary">Academy</span>
      </p>
      <h1 className="mt-6 text-2xl sm:text-3xl">Đổi mật khẩu</h1>
      {actor.mustChangePassword && (
        <Alert tone="info" className="mt-4">
          Bạn đang dùng mật khẩu tạm do học viện cấp. Hãy đặt mật khẩu mới để tiếp tục.
        </Alert>
      )}
      <div className="mt-6 rounded-block border border-line bg-surface p-5 sm:p-6">
        <ChangePasswordForm />
      </div>
      {!actor.mustChangePassword && (
        <p className="mt-4 text-sm">
          <Link href={HOME_BY_ROLE[actor.role]}>Quay lại trang tổng quan</Link>
        </p>
      )}
    </main>
  );
}
