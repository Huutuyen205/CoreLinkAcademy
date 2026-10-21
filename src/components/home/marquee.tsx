"use client";

import { motion } from "framer-motion";
import { MARQUEE_ITEMS } from "@/data/home";

/** Dải chữ chạy vô hạn liền mạch: nhân đôi nội dung rồi dịch translateX 0 → -50% trong 28 giây. */
export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {MARQUEE_ITEMS.map((text) => (
        <li key={text} className="flex items-center whitespace-nowrap text-sm font-medium text-white sm:text-base">
          <span className="px-6">{text}</span>
          <span aria-hidden="true" className="text-accent">
            •
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Cam kết của CoreLink Academy" className="overflow-hidden bg-primary-strong py-4">
      <motion.div className="flex w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, ease: "linear", repeat: Infinity }}>
        {row(false)}
        {row(true)}
      </motion.div>
    </section>
  );
}
