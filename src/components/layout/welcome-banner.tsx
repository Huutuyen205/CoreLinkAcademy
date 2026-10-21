import Link from "next/link";
import type { ReactNode } from "react";
import { BridgeArc } from "./brand";
import { formatVn } from "@/lib/time";

function greeting(now: Date): string {
  const h = Number(formatVn(now, "H"));
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/**
 * Banner chào ở trang tổng quan mỗi cổng: màu thương hiệu, vòm cầu từ logo, ngày theo giờ Việt Nam.
 * `children` = các nút/lối tắt; `summary` = một câu tóm tắt việc hôm nay.
 */
export function WelcomeBanner({ name, roleLabel, summary, children }: { name: string; roleLabel: string; summary?: ReactNode; children?: ReactNode }) {
  const now = new Date();
  return (
    <section className="on-brand animate-rise relative mb-6 overflow-hidden rounded-block bg-gradient-to-br from-primary via-primary to-primary-strong p-5 shadow-lg sm:p-7">
      <BridgeArc className="pointer-events-none absolute -bottom-6 -right-16 w-[420px] text-white/10 sm:-right-6" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative">
        <p className="text-sm text-on-brand-muted first-letter:uppercase">
          {formatVn(now, "EEEE, dd/MM/yyyy")} · {roleLabel}
        </p>
        <h1 className="mt-1 text-2xl text-white sm:text-3xl">
          {greeting(now)}, {name}!
        </h1>
        {summary && <p className="mt-2 max-w-2xl text-on-brand-muted">{summary}</p>}
        {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
      </div>
    </section>
  );
}

/** Nút lối tắt trắng-trong suốt dùng trong banner. */
export function BannerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 text-sm font-semibold text-white no-underline backdrop-blur transition-colors hover:bg-white hover:text-primary"
    >
      {children}
    </Link>
  );
}
