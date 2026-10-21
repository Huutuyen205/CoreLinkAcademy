import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BridgeArc } from "@/components/layout/brand";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import { getCurrentActor } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default async function LoginPage() {
  const actor = await getCurrentActor();
  if (actor) redirect(actor.mustChangePassword ? "/doi-mat-khau" : HOME_BY_ROLE[actor.role]);

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-block border border-line bg-surface md:grid-cols-[1fr_1.1fr]">
      <div className="on-brand relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-primary px-6 py-8 text-center md:py-12">
        <BridgeArc className="pointer-events-none absolute -bottom-6 left-1/2 w-[420px] -translate-x-1/2 text-white/10" />
        {/* Logo chính thức đã chứa chữ "CORE LINK ACADEMY" nên alt mô tả đầy đủ. */}
        <Image src="/brand/logo.png" alt="Logo Core Link Academy" width={180} height={180} priority className="relative size-32 md:size-44" />
        <p className="relative max-w-xs text-on-brand-muted">Cổng học tập dành cho nhân viên, giáo viên, học sinh và phụ huynh của học viện.</p>
      </div>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl text-primary sm:text-3xl">Đăng nhập</h1>
        <p className="mt-2 text-muted">Dùng email hoặc số điện thoại học viện đã cấp.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-sm text-muted">Quên mật khẩu? Vui lòng liên hệ giáo vụ của học viện để được cấp lại.</p>
      </div>
    </div>
  );
}
