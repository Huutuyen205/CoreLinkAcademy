"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { PROGRAMS, SUBJECT_TABS, type SubjectKey } from "@/data/home";
import { cn } from "@/lib/format";
import { Reveal } from "./motion";

export function Programs() {
  const [active, setActive] = useState<SubjectKey>("toan");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : SUBJECT_TABS.length - 1)) % SUBJECT_TABS.length;
    const tab = SUBJECT_TABS[next];
    if (!tab) return;
    setActive(tab.key);
    tabRefs.current[tab.key]?.focus();
  }

  return (
    <section id="chuong-trinh" aria-labelledby="tieu-de-chuong-trinh" className="mt-14 scroll-mt-24 bg-paper px-4 py-14 sm:mt-20 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Chương trình đào tạo</p>
          <h2 id="tieu-de-chuong-trinh" className="mt-2 text-2xl text-ink sm:text-4xl">
            Lộ trình học từ Tiền tiểu học đến THPT
          </h2>
        </Reveal>

        <Reveal className="mt-8 flex justify-center">
          <div role="tablist" aria-label="Chọn môn học" className="inline-flex gap-1 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-line">
            {SUBJECT_TABS.map((t, i) => (
              <button
                key={t.key}
                ref={(el) => {
                  tabRefs.current[t.key] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={active === t.key}
                aria-controls="khung-chuong-trinh"
                tabIndex={active === t.key ? 0 : -1}
                onClick={() => setActive(t.key)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "relative min-h-11 rounded-full px-5 text-sm font-semibold transition-colors sm:px-7 sm:text-base",
                  active === t.key ? "text-white" : "text-ink hover:text-primary",
                )}
              >
                {active === t.key && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div id="khung-chuong-trinh" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-8">
          <AnimatePresence mode="wait">
            <motion.ul
              key={active}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {PROGRAMS[active].map((p) => (
                <li key={p.level} className="list-none">
                  <article className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-md ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                    <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      {p.level}
                      <span className="font-normal text-muted">· {p.age}</span>
                    </p>
                    <h3 className="mt-4 text-lg text-ink">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted">{p.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-ink">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={p.href}
                      className="group mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary no-underline hover:underline"
                    >
                      Xem chi tiết khóa học
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </article>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
