import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

/**
 * Nhận diện thương hiệu: ô logo (ảnh chính thức, nền #1C2D95) + wordmark "CORE LINK / ACADEMY" như logo.
 * `tone="light"` dùng trên nền xanh thương hiệu (chữ trắng).
 */
export function Brand({ href, tone = "dark", className }: { href: string; tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3 no-underline transition-transform duration-200", className)} aria-label="Core Link Academy — trang chủ">
      <div className="relative overflow-hidden rounded-[10px] ring-1 ring-primary/20 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:ring-accent/50">
        <Image src="/brand/logo.png" alt="" width={44} height={44} priority className="size-11 shrink-0 object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <span className="leading-none" aria-hidden="true">
        <span className={cn("block font-serif text-lg font-bold tracking-wide transition-colors duration-200", tone === "light" ? "text-white group-hover:text-brand-tint" : "text-primary group-hover:text-accent")}>CORE LINK</span>
        <span className={cn("mt-1 block text-[0.65rem] font-medium tracking-[0.32em] transition-colors duration-200", tone === "light" ? "text-on-brand-muted" : "text-muted group-hover:text-ink")}>ACADEMY</span>
      </span>
    </Link>
  );
}

/** Họa tiết vòm cầu lấy từ logo — trang trí, ẩn với trình đọc màn hình. */
export function BridgeArc({ className }: { className?: string }) {
  const hangers = [60, 120, 180, 240, 360, 420, 480, 540];
  return (
    <svg viewBox="0 0 600 120" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M0 110 Q300 60 600 110" stroke="currentColor" strokeWidth="3" />
      <path d="M30 20 Q300 120 570 20" stroke="currentColor" strokeWidth="2" />
      {hangers.map((x) => {
        // Bezier bậc 2 có điểm điều khiển ở giữa → x tuyến tính theo t: cáp y = 20 + 200t(1−t), mặt cầu y = 110 − 100t(1−t).
        const tc = (x - 30) / 540;
        const td = x / 600;
        return <line key={x} x1={x} y1={20 + 200 * tc * (1 - tc)} x2={x} y2={110 - 100 * td * (1 - td)} stroke="currentColor" strokeWidth="1.5" />;
      })}
      <rect x="22" y="8" width="16" height="104" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="562" y="8" width="16" height="104" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
