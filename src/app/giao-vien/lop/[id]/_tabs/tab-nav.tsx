"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/format";
import { CLASS_TABS, type ClassTab } from "./tabs";

/** Tab gạch chân; thanh cuộn ngang trên màn nhỏ và tự đưa tab đang chọn vào giữa. */
export function TabNav({ classId, active }: { classId: string; active: ClassTab }) {
  const current = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    current.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);

  return (
    <nav aria-label="Mục của lớp" className="relative mb-6 border-b border-line">
      <ul className="no-scrollbar -mb-px flex overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CLASS_TABS.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key} className="shrink-0">
              <Link
                ref={on ? current : undefined}
                href={`/giao-vien/lop/${classId}?tab=${t.key}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-3 text-sm no-underline sm:px-4",
                  on ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Gợi ý còn tab ẩn ở mép phải khi thanh cuộn được */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-paper to-transparent sm:hidden" />
    </nav>
  );
}
