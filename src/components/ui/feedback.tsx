import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "info" | "success" | "warning" | "danger";

const alertTones: Record<Tone, { wrap: string; bar: string }> = {
  info:    { wrap: "border-primary/25 bg-primary-soft text-primary-strong",  bar: "bg-primary" },
  success: { wrap: "border-success/25 bg-success-soft text-success",         bar: "bg-success" },
  warning: { wrap: "border-warning/25 bg-warning-soft text-warning",         bar: "bg-warning" },
  danger:  { wrap: "border-danger/25 bg-danger-soft text-danger",            bar: "bg-danger" },
};

/** Alert với dải màu bên trái cho visual weight rõ hơn. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = alertTones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("relative overflow-hidden rounded-control border pl-5 pr-4 py-3 text-sm", t.wrap, className)}
    >
      {/* Dải màu trái */}
      <span className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-control", t.bar)} aria-hidden="true" />
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-line bg-paper text-muted",
  primary: "border-primary/25 bg-primary-soft text-primary",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger:  "border-danger/25 bg-danger-soft text-danger",
};

/** Nhãn trạng thái — luôn có chữ, không chỉ dùng màu (docs/08 §6). */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Card với shadow mềm và hover lift effect khi `interactive`. */
export function Card({
  title,
  action,
  children,
  className,
  interactive = false,
  id,
}: {
  id?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-block border border-line bg-surface p-4 shadow-[0_2px_8px_rgba(14,20,51,0.06)] sm:p-5",
        interactive && "card-interactive",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {title && <h2 className="min-w-0 text-lg font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-block border border-dashed border-line bg-paper/50 px-5 py-10 text-center">
      <Sparkles className="mx-auto mb-3 size-7 text-primary/30" aria-hidden="true" />
      <p className="text-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** PageHeader với divider accent và animate-rise. */
export function PageHeader({
  title,
  description,
  action,
  showDivider = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  showDivider?: boolean;
}) {
  return (
    <div className="animate-rise mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {showDivider && <div className="section-divider" aria-hidden="true" />}
        <h1 className="text-2xl text-primary sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

