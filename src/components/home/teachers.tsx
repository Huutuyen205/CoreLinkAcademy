"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, Eye, GraduationCap, Sparkles, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TEACHERS, type Teacher } from "@/data/home";
import { Reveal, Stagger, StaggerItem } from "./motion";

export function Teachers() {
  const [selectedPoster, setSelectedPoster] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPoster(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section id="giao-vien" aria-labelledby="tieu-de-giao-vien" className="scroll-mt-24 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Đội ngũ giáo viên</p>
          <h2 id="tieu-de-giao-vien" className="mt-2 text-2xl font-bold text-ink sm:text-4xl">
            Thầy cô tận tâm, theo sát từng em
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">
            Giảng viên và giáo viên ưu tú từ các trường chuyên và đại học hàng đầu, đồng hành tận tình cùng học sinh trên từng chặng đường học tập.
          </p>
        </Reveal>

        <Stagger as="ul" className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 max-w-5xl mx-auto">
          {TEACHERS.map((t: Teacher, i: number) => {
            const isEnglish = t.subject.toLowerCase().includes("anh");
            return (
              <StaggerItem
                key={i}
                as="li"
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-md ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7"
              >
                <div>
                  {/* Header info */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div
                      className="relative mx-auto size-36 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-primary-soft shadow-md ring-2 ring-primary/20 transition-transform duration-300 group-hover:ring-primary/40 sm:mx-0 sm:size-36"
                      onClick={() => t.poster && setSelectedPoster({ url: t.poster, name: t.name })}
                      title="Bấm để xem poster chính thức"
                    >
                      {t.photo ? (
                        <>
                          <Image
                            src={t.photo}
                            alt={t.name}
                            fill
                            sizes="(min-width:640px) 160px, 144px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-primary-strong/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                              <Eye className="size-3.5" aria-hidden="true" />
                              Xem poster
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-b from-primary-soft to-brand-tint text-primary/40">
                          <UserRound className="size-1/2" strokeWidth={1.25} aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isEnglish
                              ? "bg-accent/15 text-accent"
                              : "bg-danger/15 text-danger"
                          }`}
                        >
                          {t.subject}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                          <GraduationCap className="size-3.5" aria-hidden="true" />
                          {t.workplace}
                        </span>
                      </div>

                      <h3 className="mt-2.5 font-heading text-xl font-bold text-ink sm:text-2xl">{t.name}</h3>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-muted">{t.degree}</p>
                    </div>
                  </div>

                  {/* Highlights section */}
                  {t.highlights && t.highlights.length > 0 && (
                    <div className="mt-6 rounded-2xl bg-paper/60 p-4 ring-1 ring-line/60">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        <Award className="size-4 text-amber-500" aria-hidden="true" />
                        Thành tích & Kinh nghiệm nổi bật
                      </p>
                      <ul className="mt-3 space-y-2 text-xs sm:text-sm text-ink/85">
                        {t.highlights.map((h, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <Sparkles className="mt-1 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                  {t.poster ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPoster({ url: t.poster!, name: t.name })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-strong hover:underline"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      Xem poster chính thức
                    </button>
                  ) : <span />}

                  <Link
                    href="/#dang-ky"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white no-underline shadow-xs transition-colors hover:bg-primary-strong"
                  >
                    <span>Đăng ký học cùng cô</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

      {/* Lightbox Modal hiển thị poster gốc */}
      <AnimatePresence>
        {selectedPoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <motion.div
              className="fixed inset-0 bg-primary-strong/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPoster(null)}
            />
            <motion.div
              className="relative z-10 max-h-[92vh] max-w-[90vw] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20 sm:max-w-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="font-semibold text-ink text-sm sm:text-base">Poster giới thiệu: {selectedPoster.name}</p>
                <button
                  type="button"
                  onClick={() => setSelectedPoster(null)}
                  className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors"
                  aria-label="Đóng"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <div className="relative aspect-square w-full max-h-[80vh] overflow-hidden bg-primary-strong">
                <Image
                  src={selectedPoster.url}
                  alt={selectedPoster.name}
                  fill
                  quality={95}
                  sizes="(max-width: 768px) 90vw, 672px"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
