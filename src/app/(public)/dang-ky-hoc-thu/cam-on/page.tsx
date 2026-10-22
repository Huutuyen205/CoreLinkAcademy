import type { Metadata } from "next";
import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Đã nhận đăng ký", robots: { index: false } };

export default function ThankYouPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-line bg-surface p-8 sm:p-12 text-center shadow-2xl shadow-primary/8">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-success-soft text-success shadow-md shadow-success/15 ring-4 ring-success/20">
          <CheckCircle2 className="size-11" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary mb-3">
          <Sparkles className="size-3.5 text-accent" />
          Đăng ký thành công
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Cảm ơn quý phụ huynh!
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-md mx-auto">
          CoreLink Academy đã ghi nhận thông tin đăng ký học thử. Đội ngũ giáo vụ sẽ liên hệ lại với gia đình trong thời gian sớm nhất để hẹn lịch kiểm tra đầu vào.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/khoa-hoc" variant="secondary" className="rounded-full px-5">
            Xem thêm các khóa học
          </ButtonLink>
          <ButtonLink href="/" className="rounded-full px-6 flex items-center gap-1.5">
            <Home className="size-4" />
            <span>Về trang chủ</span>
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
