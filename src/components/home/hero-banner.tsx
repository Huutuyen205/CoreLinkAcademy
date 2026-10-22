"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Banner chính thức Core Link Academy:
 * - Ảnh độ nét cao 2560x975 đã qua xử lý lọc viền Lanczos và làm nét Unsharp Mask.
 * - Tỉ lệ khung hình aspect-[2560/975] khớp hoàn toàn với ảnh gốc để không méo hay cắt viền chữ.
 * - Gradient fade mỏng nhẹ ở chân để chuyển tiếp mượt mà vào nền trang mà không che mất chữ dưới banner.
 */
export function HeroBanner() {
  return (
    <section aria-label="Giới thiệu Core Link Academy" className="relative overflow-hidden bg-primary-strong">
      <h1 className="sr-only">Core Link Academy — Trung tâm đào tạo và luyện thi Toán, Văn, Anh chuẩn quốc tế</h1>
      <div className="relative mx-auto aspect-[2560/975] w-full max-w-[1920px] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.04 }}
          transition={{ duration: 16, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        >
          <Image
            src="/brand/banner.png"
            alt="Core Link Academy — Toán, Ngữ văn, Tiếng Anh từ Tiền tiểu học đến THPT, lớp tối đa 7–12 học sinh"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        {/* Gradient fade nhẹ nhàng ở chân banner */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 sm:h-14"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(244,246,254,0.75))" }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
