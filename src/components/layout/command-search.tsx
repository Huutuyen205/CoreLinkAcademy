"use client";

import { CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/format";
import { globalSearchAction } from "@/server/search/actions";
import type { SearchGroup } from "@/server/search/service";

/**
 * Tìm nhanh toàn hệ thống (FEAT-B6): nút kính lúp hoặc Ctrl+K / ⌘K mở hộp tìm.
 * Gõ ≥ 2 ký tự → kết quả nhóm theo loại; ↑ ↓ chọn, Enter mở, Esc đóng.
 */
export function CommandSearch({ placeholder = "Tìm học sinh, phụ huynh, lớp, lead…", variant = "icon" }: { placeholder?: string; variant?: "icon" | "bar" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const seq = useRef(0);

  const flat = groups.flatMap((g) => g.items);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Có 2 nút (sidebar máy tính + thanh trên điện thoại): chỉ nút đang hiển thị xử lý phím tắt.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && buttonRef.current?.offsetParent) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups([]);
      return;
    }
    const id = ++seq.current;
    const t = window.setTimeout(() => {
      start(async () => {
        const result = await globalSearchAction(term);
        if (id === seq.current) {
          setGroups(result);
          setActive(0);
        }
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    setGroups([]);
    router.push(href);
  };

  let index = -1;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault(); // nằm trong <summary> của menu điện thoại: không mở menu
          setOpen(true);
        }}
        aria-label="Tìm nhanh (Ctrl+K)"
        title="Tìm nhanh (Ctrl+K)"
        className={
          variant === "bar"
            ? "flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-left text-sm text-on-brand-muted transition-colors hover:border-white/30 hover:bg-white/15"
            : "relative inline-flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white transition-all duration-200 hover:scale-105 hover:border-white/35 hover:bg-white/18"
        }
      >
        <Search className="size-4.5 shrink-0" aria-hidden="true" />
        {variant === "bar" && (
          <>
            <span className="flex-1">Tìm nhanh…</span>
            <kbd className="rounded border border-white/25 px-1.5 text-[10px] font-semibold">Ctrl K</kbd>
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/40 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tìm nhanh"
            className="animate-scale-in w-full max-w-xl overflow-hidden rounded-block border border-line bg-surface text-ink shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, flat.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter" && flat[active]) {
                    e.preventDefault();
                    go(flat[active]!.href);
                  }
                }}
                placeholder={placeholder}
                aria-label="Từ khóa tìm kiếm"
                className="min-h-14 w-full bg-transparent text-base outline-none"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="text-muted hover:text-ink">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
              {q.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">Gõ ít nhất 2 ký tự: tên, SĐT, email, mã học sinh hoặc mã lớp.</p>
              ) : pending && flat.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">Đang tìm…</p>
              ) : flat.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">Không tìm thấy “{q.trim()}”. Lưu ý gõ đúng dấu tiếng Việt.</p>
              ) : (
                groups.map((g) => (
                  <div key={g.title} className="mb-2">
                    <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</p>
                    <ul>
                      {g.items.map((it) => {
                        index += 1;
                        const i = index;
                        return (
                          <li key={it.href}>
                            <button
                              type="button"
                              onMouseEnter={() => setActive(i)}
                              onClick={() => go(it.href)}
                              className={cn("flex w-full items-center gap-3 rounded-control px-3 py-2 text-left", i === active ? "bg-primary-soft text-primary" : "hover:bg-paper")}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{it.label}</span>
                                {it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}
                              </span>
                              {i === active && <CornerDownLeft className="size-4 shrink-0" aria-hidden="true" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <p className="border-t border-line bg-paper px-4 py-2 text-xs text-muted">↑ ↓ để chọn · Enter để mở · Esc để đóng · Ctrl+K mở nhanh ở mọi trang</p>
          </div>
        </div>
      )}
    </>
  );
}
