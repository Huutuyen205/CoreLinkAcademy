import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/hero-banner";
import { Marquee } from "@/components/home/marquee";
import { NewsAndStars } from "@/components/home/news-and-stars";
import { Programs } from "@/components/home/programs";
import { QuickAccess } from "@/components/home/quick-access";
import { RegisterForm } from "@/components/home/register-form";
import { Stats } from "@/components/home/stats";
import { Teachers } from "@/components/home/teachers";
import { WhyUs } from "@/components/home/why-us";

export const metadata: Metadata = {
  title: { absolute: "Core Link Academy — Đào tạo và luyện thi Toán, Văn, Anh chuẩn quốc tế" },
  description:
    "Core Link Academy đào tạo và luyện thi Toán – Ngữ văn – Tiếng Anh từ Tiền tiểu học đến THPT, lớp nhỏ 7–12 học sinh. Đăng ký học thử miễn phí.",
};

// FR-001. Nội dung tĩnh lấy từ src/data/home.ts; chỉ form đăng ký ghi dữ liệu (FR-004, FR-005).
export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <QuickAccess />
      <Stats />
      <Programs />
      <WhyUs />
      <Teachers />
      <Marquee />
      <NewsAndStars />
      <RegisterForm />
    </>
  );
}
