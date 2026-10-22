import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { QUICK_ACCESS } from "@/data/home";
import { Stagger, StaggerItem } from "./motion";

/** 4 thẻ truy cập nhanh premium: số gradient, hover lift + shadow, arrow animation. */
export function QuickAccess() {
  return (
    <section aria-label="Truy cập nhanh" className="relative z-10 mt-4 px-4 sm:-mt-12">
      <Stagger as="ul" className="mx-auto grid max-w-[1200px] gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {QUICK_ACCESS.map((q) => (
          <StaggerItem key={q.no} as="li" className="list-none">
            <Link
              href={q.href}
              className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 text-ink no-underline shadow-[0_4px_20px_rgba(14,20,51,0.08)] ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(28,45,149,0.14)] hover:ring-primary/25 sm:p-5"
            >
              {/* Gradient left border on hover */}
              <span
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "linear-gradient(180deg,#2f6bff,#1f2f98)" }}
                aria-hidden="true"
              />
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-xl font-heading text-lg font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg,#1f2f98,#2f6bff)" }}
              >
                {q.no}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-bold text-ink">{q.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{q.detail}</span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

