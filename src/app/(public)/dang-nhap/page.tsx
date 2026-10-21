import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default async function LoginPage() {
  const actor = await getCurrentActor();
  if (actor) redirect(actor.mustChangePassword ? "/doi-mat-khau" : HOME_BY_ROLE[actor.role]);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl sm:text-3xl">Đăng nhập</h1>
      <p className="mt-2 text-muted">Dành cho nhân viên, giáo viên, học sinh và phụ huynh của học viện.</p>
      <div className="mt-6 rounded-block border border-line bg-surface p-5 sm:p-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-muted">Quên mật khẩu? Vui lòng liên hệ giáo vụ của học viện để được cấp lại.</p>
    </div>
  );
}
