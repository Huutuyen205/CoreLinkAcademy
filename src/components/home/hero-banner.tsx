"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/** Banner đã có sẵn chữ nên không chèn chữ đè lên; `h1` ẩn để trình đọc màn hình và công cụ tìm kiếm có tiêu đề trang. */
export function HeroBanner() {
  return (
    <section aria-label="Giới thiệu Core Link Academy" className="relative overflow-hidden bg-primary">
      <h1 className="sr-only">Core Link Academy — Trung tâm đào tạo và luyện thi Toán, Văn, Anh chuẩn quốc tế</h1>
      <div className="relative mx-auto aspect-[1640/626] w-full max-w-[1920px] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 14, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        >
          <Image
            src="/brand/banner.png"
            alt="Core Link Academy — Toán, Ngữ văn, Tiếng Anh từ Tiền tiểu học đến THPT, lớp tối đa 7–12 học sinh"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
