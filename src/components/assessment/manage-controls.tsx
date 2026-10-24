"use client";

import { BellRing, ClipboardCheck, Loader2, Lock, LockOpen, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import { initialActionState, type ActionState } from "@/server/errors";

// Tên icon (chuỗi) để trang server truyền được sang component client.
const ICONS = { grade: ClipboardCheck, ai: Sparkles, remind: BellRing } satisfies Record<string, LucideIcon>;
export type TileIcon = keyof typeof ICONS;

/** Mọi nút trong tab "Quản lý bài" dùng chung một khuôn: cùng cỡ, icon trên – chữ dưới. */
const TILE = "flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-control border px-3 py-3 text-center text-sm font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const TILE_IDLE = "border-primary/30 bg-surface text-primary hover:border-primary hover:bg-primary-soft";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Nút dạng liên kết (chuyển sang trang chấm bài). */
export function LinkTile({ href, icon, label, hint }: { href: string; icon: TileIcon; label: string; hint?: string }) {
  const Icon = ICONS[icon];
  return (
    <Link href={href} className={cn(TILE, TILE_IDLE)}>
      <Icon className="size-6" aria-hidden="true" />
      <span>
        {label}
        {hint && <span className="block text-xs font-normal text-muted">{hint}</span>}
      </span>
    </Link>
  );
}

/** Nút một-chạm chạy Server Action; kết quả hiện bằng toast (lỗi hiện thêm ngay dưới nút). */
export function ActionTile({
  action,
  hidden,
  icon,
  label,
  hint,
  pendingLabel = "Đang xử lý…",
  confirm,
  disabled,
}: {
  action: Action;
  hidden: Record<string, string>;
  icon: TileIcon;
  label: string;
  hint?: string;
  pendingLabel?: string;
  confirm?: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? "success" : "danger");
  }, [state]);
  const Icon = ICONS[icon];
  return (
    <form
      action={formAction}
      className="flex"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending || disabled} className={cn(TILE, TILE_IDLE)}>
        {pending ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Icon className="size-6" aria-hidden="true" />}
        <span>
          {pending ? pendingLabel : label}
          {hint && !pending && <span className="block text-xs font-normal text-muted">{hint}</span>}
        </span>
      </button>
    </form>
  );
}

/** Công tắc mở/đóng bài: bật = đang nhận bài nộp, tắt = đã đóng. Đổi trạng thái xong trang chuyển hướng kèm thông báo. */
export function StatusSwitch({ action, assignmentId, open }: { action: Action; assignmentId: string; open: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useEffect(() => {
    if (state.message && !state.ok) toast(state.message, "danger");
  }, [state]);
  return (
    <form action={formAction} className="flex">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="status" value={open ? "CLOSED" : "PUBLISHED"} />
      <button type="submit" role="switch" aria-checked={open} disabled={pending} className={cn(TILE, open ? "border-success/40 bg-success-soft text-success" : "border-line bg-paper text-muted hover:border-primary/40")}>
        {open ? <LockOpen className="size-6" aria-hidden="true" /> : <Lock className="size-6" aria-hidden="true" />}
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn("relative inline-block h-5 w-9 rounded-full transition-colors", open ? "bg-success" : "bg-line")}>
            <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", open ? "left-[1.125rem]" : "left-0.5")} />
          </span>
          {pending ? "Đang đổi…" : open ? "Đang mở bài" : "Đã đóng bài"}
        </span>
      </button>
    </form>
  );
}
