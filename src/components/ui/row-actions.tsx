"use client";

import {
  Ban,
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LockOpen,
  MessageCircle,
  Pencil,
  RotateCcw,
  Trash2,
  UserRound,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { initialActionState, type ActionState } from "@/server/errors";

// Tên icon (chuỗi) để trang server truyền được sang component client.
const ICONS = {
  view: Eye,
  edit: Pencil,
  profile: UserRound,
  password: KeyRound,
  lock: Lock,
  unlock: LockOpen,
  delete: Trash2,
  cancel: Ban,
  hide: EyeOff,
  show: Eye,
  restore: RotateCcw,
  schedule: CalendarDays,
  message: MessageCircle,
  unlink: UserRoundX,
} satisfies Record<string, LucideIcon>;

export type ActionIcon = keyof typeof ICONS;
type Tone = "default" | "primary" | "danger" | "success";

const TONES: Record<Tone, string> = {
  default: "border-line bg-surface text-ink hover:border-primary/40 hover:bg-primary-soft hover:text-primary",
  primary: "border-primary/30 bg-primary-soft text-primary hover:border-primary",
  danger: "border-danger/25 bg-surface text-danger hover:border-danger hover:bg-danger-soft",
  success: "border-success/25 bg-surface text-success hover:border-success hover:bg-success-soft",
};

const BASE = "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border px-2.5 text-xs font-semibold no-underline transition-colors disabled:opacity-50";

/** Hàng nút thao tác của một dòng: cùng cỡ, nằm một hàng (xuống dòng gọn khi hẹp). */
export function RowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-1.5", className)}>{children}</div>;
}

export function ActionLink({ href, icon, children, tone = "default", title }: { href: string; icon?: ActionIcon; children: ReactNode; tone?: Tone; title?: string }) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <Link href={href} title={title} className={cn(BASE, TONES[tone])}>
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </Link>
  );
}

type ButtonProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  children: ReactNode;
  icon?: ActionIcon;
  tone?: Tone;
  /** Hỏi xác nhận trước khi chạy. */
  confirm?: string;
  /** Hỏi thêm một ô chữ (vd. lý do) → gửi trong trường `name`. */
  prompt?: { name: string; message: string; required?: boolean };
  /** Chỉ hiện icon tròn nhỏ (dùng trong chip); `children` thành nhãn cho trình đọc màn hình + tooltip. */
  iconOnly?: boolean;
};

/** Nút một-chạm chạy Server Action (khóa, xóa, hủy…). Lỗi hiện ngay dưới nút. */
export function ActionButton({ action, hidden, children, icon, tone = "default", confirm, prompt, iconOnly }: ButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const promptRef = useRef<HTMLInputElement>(null);
  const Icon = icon ? ICONS[icon] : null;
  return (
    <form
      action={formAction}
      className="inline-flex flex-col"
      onSubmit={(e) => {
        if (prompt) {
          const value = window.prompt(prompt.message);
          if (value === null || (prompt.required && !value.trim())) {
            e.preventDefault();
            return;
          }
          if (promptRef.current) promptRef.current.value = value.trim();
        }
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {prompt && <input ref={promptRef} type="hidden" name={prompt.name} defaultValue="" />}
      {iconOnly ? (
        <button
          type="submit"
          disabled={pending}
          title={typeof children === "string" ? children : undefined}
          className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50", TONES[tone])}
        >
          {Icon && <Icon className="size-3.5" aria-hidden="true" />}
          <span className="sr-only">{children}</span>
        </button>
      ) : (
        <button type="submit" disabled={pending} className={cn(BASE, TONES[tone])}>
          {Icon && <Icon className="size-3.5" aria-hidden="true" />}
          {pending ? "Đang xử lý…" : children}
        </button>
      )}
      {state.message && !state.ok && (
        <span role="alert" className="mt-1 max-w-48 text-xs text-danger">
          {state.message}
        </span>
      )}
    </form>
  );
}
