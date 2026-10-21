"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NEWS, STARS } from "@/data/home";
import { Reveal, Stagger, StaggerItem } from "./motion";

type Star = (typeof STARS)[number];

export function NewsAndStars() {
  const [selected, setSelected] = useState<Star | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <section id="tin-tuc" aria-label="Tin tức và học viên tiêu biểu" className="scroll-mt-24 bg-paper px-4 py-14 sm:py-20">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        <div>
          <Reveal>
            <h2 className="text-2xl text-ink sm:text-3xl">Tin tức – Sự kiện</h2>
          </Reveal>
          <Stagger as="ul" className="mt-6 space-y-3">
            {NEWS.map((n) => {
              const [, month, day] = n.date.split("-");
              return (
                <StaggerItem key={n.title} as="li" className="list-none">
                  <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                    <time dateTime={n.date} className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-white">
                      <span className="font-heading text-2xl font-bold leading-none">{day}</span>
                      <span className="mt-1 text-xs leading-none text-on-brand-muted">Th{Number(month)}</span>
                    </time>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{n.category}</p>
                      <h3 className="mt-1 text-base font-semibold leading-snug text-ink">{n.title}</h3>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        <div>
          <Reveal>
            <h2 className="text-2xl text-ink sm:text-3xl">Học viên tiêu biểu</h2>
          </Reveal>
          <Stagger as="ul" className="mt-6 space-y-3">
            {STARS.map((s, i) => (
              <StaggerItem key={i} as="li" className="list-none">
                <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
                    <UserRound className="size-8" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base text-ink">{s.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <Trophy className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {s.result}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="min-h-11 shrink-0 rounded-full border border-primary/30 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                    onClick={(e) => {
                      triggerRef.current = e.currentTarget;
                      setSelected(s);
                    }}
                  >
                    Xem thêm<span className="sr-only"> về {s.name}</span>
                  </button>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      <StarModal
        star={selected}
        onClose={() => {
          setSelected(null);
          triggerRef.current?.focus();
        }}
      />
    </section>
  );
}

function StarModal({ star, onClose }: { star: Star | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!star) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [star, onClose]);

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-strong/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tieu-de-hoc-vien"
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
              <UserRound className="size-10" strokeWidth={1.5} />
            </span>
            <h3 id="tieu-de-hoc-vien" className="mt-4 text-xl text-ink">
              {star.name}
            </h3>
            <p className="mt-1 text-sm text-muted">{star.detail}</p>
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 font-semibold text-primary">
              <Trophy className="size-5 shrink-0" aria-hidden="true" />
              {star.result}
            </p>
            <p className="mt-4 text-muted">{star.story}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
