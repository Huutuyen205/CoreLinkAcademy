"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { phoneHref, SITE, zaloHref } from "@/data/site";

const round = "flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105";

export function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            aria-label="Lên đầu trang"
            className={`${round} bg-primary-strong`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
      <a
        href={phoneHref(SITE.hotline)}
        aria-label="Gọi điện cho trung tâm"
        className={`${round} bg-primary`}
      >
        <Phone className="size-5" aria-hidden="true" />
      </a>
      <a
        href={zaloHref(SITE.zalo)}
        target={zaloHref(SITE.zalo).startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-label="Nhắn tin Zalo với trung tâm"
        className={`${round} pulse-ring bg-accent`}
      >
        <MessageCircle className="size-5" aria-hidden="true" />
      </a>
    </div>
  );
}
