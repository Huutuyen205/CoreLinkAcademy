import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { QUICK_ACCESS } from "@/data/home";
import { Stagger, StaggerItem } from "./motion";

/** 4 thẻ truy cập nhanh đè lên mép dưới banner (margin âm) từ sm; điện thoại banner chỉ cao ~140px nên không đè để khỏi che chữ trên ảnh. */
export function QuickAccess() {
  return (
    <section aria-label="Truy cập nhanh" className="relative z-10 mt-4 px-4 sm:-mt-12">
      <Stagger as="ul" className="mx-auto grid max-w-[1200px] gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {QUICK_ACCESS.map((q) => (
          <StaggerItem key={q.no} as="li" className="list-none">
            <Link
              href={q.href}
              className="group flex h-full items-center gap-4 rounded-2xl bg-white p-4 text-ink no-underline shadow-lg ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-heading text-lg font-bold text-primary">
                {q.no}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-bold text-ink">{q.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{q.detail}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
