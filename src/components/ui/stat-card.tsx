import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/format";

type Tone = "primary" | "success" | "warning" | "danger";

const tones: Record<Tone, { icon: string; value: string; border: string; glow: string }> = {
  primary: {
    icon: "bg-primary-soft text-primary",
    value: "text-primary",
    border: "border-line hover:border-primary/40",
    glow: "hover:shadow-primary/10",
  },
  success: {
    icon: "bg-success-soft text-success",
    value: "text-success",
    border: "border-line hover:border-success/40",
    glow: "hover:shadow-success/10",
  },
  warning: {
    icon: "bg-warning-soft text-warning",
    value: "text-warning",
    border: "border-warning/40 hover:border-warning",
    glow: "hover:shadow-warning/15",
  },
  danger: {
    icon: "bg-danger-soft text-danger",
    value: "text-danger",
    border: "border-danger/40 hover:border-danger",
    glow: "hover:shadow-danger/15",
  },
};

/**
 * Thẻ số liệu premium WOW: icon trong ô màu, số lớn, glow top-border khi hover,
 * mũi tên trỏ góc trên phải khi là link tương tác.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "primary",
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  href?: string;
  tone?: Tone;
  index?: number;
}) {
  const t = tones[tone];
  const body = (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:size-12",
            t.icon,
          )}
        >
          <Icon className="size-5 sm:size-6" aria-hidden="true" />
        </span>
        {href && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-subtle opacity-60 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
      <div className="min-w-0 mt-3">
        <span className={cn("block font-heading text-2xl font-black leading-tight tracking-tight sm:text-3xl", t.value)}>
          {value}
        </span>
        <span className="mt-1 block text-sm font-medium text-muted line-clamp-2 leading-snug">{label}</span>
      </div>
    </>
  );

  const cls = cn(
    "group stat-card-premium animate-rise relative flex h-full flex-col justify-between rounded-2xl border bg-surface p-4 text-ink no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5",
    t.border,
    t.glow
  );
  const style = { animationDelay: `${index * 60}ms` };

  return href ? (
    <Link href={href} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}
