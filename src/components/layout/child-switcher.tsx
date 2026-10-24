"use client";

import { Check, ChevronDown, GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/format";
import { pathAfterSwitch, switchChildHref } from "@/lib/child";

export type SwitcherChild = { id: string; fullName: string; gradeLevel: number | null };

/**
 * Ô chọn con của phụ huynh ở thanh trên (DECISION-D42): rê chuột vào là xổ danh sách con (bấm / phím Tab cũng mở được trên điện thoại).
 * Mỗi con là một liên kết `<a>` tới `/phu-huynh/chon-con` (không dùng `<Link>` để khỏi prefetch một route có đặt cookie).
 */
export function ChildSwitcher({ items, selectedId, tone = "dark" }: { items: SwitcherChild[]; selectedId: string; tone?: "dark" | "light" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const selected = items.find((c) => c.id === selectedId) ?? items[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!selected) return null;
  const den = pathAfterSwitch(pathname);

  return (
    // stopPropagation: ô nằm trong thanh đầu điện thoại, không để bấm vào danh sách làm đóng/mở menu khác.
    <span ref={root} className="group relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          "inline-flex min-h-10 max-w-[10.5rem] cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-sm font-semibold transition-colors sm:max-w-[16rem] sm:gap-2 sm:px-3.5",
          tone === "dark" ? "border-white/25 bg-white/10 text-white hover:bg-white/18" : "border-primary bg-primary text-white shadow-sm hover:bg-primary-strong",
        )}
      >
        <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Đang xem học sinh: </span>
        <span className="truncate">{selected.fullName}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180", "group-hover:rotate-180")} aria-hidden="true" />
      </button>

      {/* pt-2 lấp khe giữa nút và bảng để rê chuột xuống không bị đóng */}
      <div
        className={cn(
          "absolute right-0 top-full z-50 w-[min(24rem,calc(100vw-1.5rem))] pt-2 transition-opacity",
          open ? "visible opacity-100" : "invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
        )}
      >
        <div className="overflow-hidden rounded-block border border-line bg-surface p-2 text-ink shadow-xl">
          <p className="px-2 pb-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-muted">Chọn con để xem và làm bài</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1.5">
            {items.map((c) => {
              const on = c.id === selected.id;
              return (
                <li key={c.id}>
                  <a
                    href={switchChildHref(c.id, den)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "relative flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center no-underline transition-colors",
                      on ? "bg-primary-soft text-primary" : "text-ink hover:bg-paper",
                    )}
                  >
                    <Avatar name={c.fullName} size="md" />
                    <span className="line-clamp-2 text-sm font-semibold leading-tight">{c.fullName}</span>
                    {c.gradeLevel && <span className="text-xs text-muted">Lớp {c.gradeLevel}</span>}
                    {on && <Check className="absolute right-2 top-2 size-4 text-primary" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </span>
  );
}
