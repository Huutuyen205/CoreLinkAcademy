import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/format";

type Tone = "primary" | "success" | "warning" | "danger";

const tones: Record<Tone, { icon: string; value: string; border: string }> = {
  primary: { icon: "bg-primary-soft text-primary", value: "text-primary", border: "border-line" },
  success: { icon: "bg-success-soft text-success", value: "text-success", border: "border-line" },
  warning: { icon: "bg-warning-soft text-warning", value: "text-warning", border: "border-warning/50" },
  danger: { icon: "bg-danger-soft text-danger", value: "text-danger", border: "border-danger/40" },
};

/** Thẻ số liệu có icon; `index` để xuất hiện lần lượt (animation-delay). Có `href` → cả thẻ là liên kết. */
export function StatCard({ icon: Icon, label, value, href, tone = "primary", index = 0 }: { icon: LucideIcon; label: string; value: number | string; href?: string; tone?: Tone; index?: number }) {
  const t = tones[tone];
  const body = (
    <>
      <span className={cn("flex size-10 shrink-0 sm:size-11 items-center justify-center rounded-xl", t.icon)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={cn("block font-heading text-2xl font-bold leading-tight sm:text-3xl", t.value)}>{value}</span>
        <span className="block text-sm text-muted">{label}</span>
      </span>
    </>
  );
  const cls = cn("animate-rise flex h-full flex-col items-start gap-2 rounded-block border bg-surface p-3 text-ink no-underline sm:flex-row sm:items-center sm:gap-3 sm:p-4", t.border);
  const style = { animationDelay: `${index * 60}ms` };
  return href ? (
    <Link href={href} className={cn(cls, "card-interactive")} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}
