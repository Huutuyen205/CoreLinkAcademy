import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Đã nhận đăng ký", robots: { index: false } };

export default function ThankYouPage() {
  return (
    <section className="mx-auto max-w-xl py-6 text-center">
      <h1 className="text-3xl">Cảm ơn quý phụ huynh</h1>
      <p className="mt-3 text-lg text-muted">
        Học viện đã nhận thông tin đăng ký học thử. Giáo vụ sẽ gọi lại trong giờ làm việc để tư vấn và hẹn lịch.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/khoa-hoc" variant="secondary">
          Xem thêm khóa học
        </ButtonLink>
        <ButtonLink href="/">Về trang chủ</ButtonLink>
      </div>
    </section>
  );
}
