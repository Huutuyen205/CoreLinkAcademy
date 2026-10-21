import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/format";

/** `inverse` / `outline-inverse`: dùng trên nền xanh thương hiệu (khối giới thiệu, chân trang). */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "outline-inverse";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-strong",
  secondary: "border border-primary/30 bg-surface text-primary hover:border-primary hover:bg-primary-soft",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-white hover:brightness-90",
  inverse: "bg-white text-primary hover:bg-brand-tint",
  "outline-inverse": "border border-white/70 text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
