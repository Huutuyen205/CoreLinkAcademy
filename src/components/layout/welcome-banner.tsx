import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles, CalendarDays } from "lucide-react";
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
 * Banner chào premium ở trang tổng quan mỗi cổng: gradient thương hiệu sâu, vòm cầu, orb trang trí,
 * lời chào theo giờ VN.
 * `children` = nút lối tắt (BannerLink); `summary` = câu tóm tắt việc hôm nay.
 */
export function WelcomeBanner({
  name,
  roleLabel,
  summary,
  children,
}: {
  name: string;
  roleLabel: string;
  summary?: ReactNode;
  children?: ReactNode;
}) {
  const now = new Date();
  return (
    <section
      className="on-brand animate-rise relative mb-6 overflow-hidden rounded-[22px] p-6 shadow-xl sm:p-8"
      style={{
        background: "linear-gradient(135deg, #09103a 0%, #101a5e 35%, #192890 70%, #2f6bff 100%)",
      }}
    >
      {/* Vòm cầu logo */}
      <BridgeArc className="pointer-events-none absolute -bottom-10 -right-8 w-[420px] text-white/8 sm:-right-2" />
      {/* Orbs trang trí */}
      <div className="pointer-events-none absolute -left-16 -top-20 size-60 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-10 right-28 size-36 rounded-full bg-primary-light/35 blur-2xl" aria-hidden="true" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-brand-tint backdrop-blur-xs">
            <CalendarDays className="size-3.5 text-accent" />
            <span className="first-letter:uppercase">{formatVn(now, "EEEE, dd/MM/yyyy")}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="size-3 text-accent-light" />
            {roleLabel}
          </span>
        </div>

        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {greeting(now)}, <span className="text-brand-tint">{name}</span>!
        </h1>

        {summary && (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-on-brand-muted sm:text-base">
            {summary}
          </p>
        )}

        {children && (
          <div className="mt-5 flex flex-wrap gap-2.5 pt-1">{children}</div>
        )}
      </div>
    </section>
  );
}

/** Nút lối tắt glass effect dùng trong WelcomeBanner. */
export function BannerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white no-underline backdrop-blur-xs transition-all duration-200 hover:bg-white hover:text-primary hover:shadow-md hover:scale-102"
    >
      {children}
    </Link>
  );
}
