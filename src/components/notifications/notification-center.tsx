"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { markAllReadAction, openNotificationAction } from "@/server/notifications/actions";
import { cn } from "@/lib/format";
import { kindIcon, relativeTime, STICKY_KINDS } from "./kind-icon";

export type LiveNotification = { id: string; kind: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

type Ctx = { unread: number; items: LiveNotification[] };
const NotificationContext = createContext<Ctx>({ unread: 0, items: [] });

const POLL_MS = 30_000;
const MAX_POPUPS = 4;
const AUTO_HIDE_MS = 14_000;
const SEEN_CAP = 300;

function readSeen(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(key: string, seen: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...seen].slice(-SEEN_CAP)));
  } catch {
    // Trình duyệt chặn lưu trữ: popup có thể hiện lại ở lần tải sau, không ảnh hưởng nghiệp vụ.
  }
}

/**
 * Bộ nhận thông báo trong ứng dụng (mount một lần ở vỏ khu nội bộ):
 * - hỏi `/api/thong-bao/moi` ngay khi vào và mỗi 30 giây (tạm dừng khi tab ẩn);
 * - thông báo chưa đọc mà trình duyệt này chưa từng hiện → popup góc phải trên, không cần bấm chuông;
 * - chia sẻ số chưa đọc + danh sách gần nhất cho các chuông.
 */
export function NotificationProvider({ userId, initialUnread, children }: { userId: string; initialUnread: number; children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ unread: initialUnread, items: [] });
  const [popups, setPopups] = useState<LiveNotification[]>([]);
  const [extra, setExtra] = useState(0);
  const [mounted, setMounted] = useState(false);
  const seenKey = `cl_notif_seen_${userId}`;
  const stopped = useRef(false);

  useEffect(() => setState((s) => ({ ...s, unread: initialUnread })), [initialUnread]);

  const poll = useCallback(async () => {
    if (stopped.current) return;
    try {
      const res = await fetch("/api/thong-bao/moi", { cache: "no-store" });
      if (res.status === 401) {
        stopped.current = true;
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; items: LiveNotification[] };
      setState({ unread: data.unread, items: data.items });
      const seen = readSeen(seenKey);
      const fresh = data.items.filter((n) => !n.readAt && !seen.has(n.id));
      if (fresh.length === 0) return;
      for (const n of fresh) seen.add(n.id);
      writeSeen(seenKey, seen);
      // `fresh` mới → cũ; hiện tối đa MAX_POPUPS cái mới nhất (cũ ở trên), phần còn lại gộp thành một dòng.
      const shown = fresh.slice(0, MAX_POPUPS).reverse();
      setPopups((list) => [...list, ...shown].slice(-(MAX_POPUPS + 2)));
      if (fresh.length > MAX_POPUPS) setExtra((n) => n + fresh.length - MAX_POPUPS);
    } catch {
      // Mất mạng: lần sau hỏi lại.
    }
  }, [seenKey]);

  useEffect(() => {
    setMounted(true);
    void poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    const timer = window.setInterval(onVisible, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [poll]);

  const dismiss = useCallback((id: string) => setPopups((list) => list.filter((p) => p.id !== id)), []);

  return (
    <NotificationContext.Provider value={state}>
      {children}
      {mounted &&
        createPortal(
          <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:w-[24rem] lg:top-20">
            {popups.map((n) => (
              <PopupCard key={n.id} n={n} onClose={dismiss} />
            ))}
            {extra > 0 && popups.length > 0 && (
              <Link href="/thong-bao?chua=1" onClick={() => setExtra(0)} className="pointer-events-auto rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white no-underline shadow-lg">
                Còn {extra} thông báo mới khác — xem tất cả
              </Link>
            )}
          </div>,
          document.body,
        )}
    </NotificationContext.Provider>
  );
}

function PopupCard({ n, onClose }: { n: LiveNotification; onClose: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const sticky = STICKY_KINDS.has(n.kind);
  const Icon = kindIcon(n.kind);
  useEffect(() => {
    if (sticky || hover) return;
    const t = window.setTimeout(() => onClose(n.id), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [sticky, hover, onClose, n.id]);

  return (
    <div
      role="status"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="animate-rise-fast pointer-events-auto relative w-full overflow-hidden rounded-block border border-line bg-surface shadow-xl ring-1 ring-primary/10"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", sticky ? "bg-warning" : "bg-accent")} aria-hidden="true" />
      <form action={openNotificationAction}>
        <input type="hidden" name="id" value={n.id} />
        <button type="submit" className="flex w-full cursor-pointer gap-3 py-3 pl-4 pr-10 text-left hover:bg-paper">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{n.title}</span>
            <span className="mt-0.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{n.body}</span>
            <span className="mt-1 block text-xs text-subtle">{relativeTime(n.createdAt)} · Bấm để xem</span>
          </span>
        </button>
      </form>
      <button type="button" onClick={() => onClose(n.id)} aria-label="Đóng thông báo" className="absolute right-2 top-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Chuông: số chưa đọc + bảng thả xuống các thông báo gần nhất. `tone` theo nền (xanh đậm hoặc sáng). */
export function NotificationBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { unread, items } = useContext(NotificationContext);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

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

  return (
    // stopPropagation: chuông ở trong <summary> của menu điện thoại, không để bấm vào bảng thả xuống mở/đóng menu.
    <span ref={root} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Thông báo: ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        className={cn(
          "relative inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105",
          tone === "dark" ? "border-white/20 bg-white/8 text-white hover:border-white/35 hover:bg-white/18" : "border-line bg-surface text-primary hover:bg-primary-soft",
        )}
      >
        <Bell className="size-4.5" aria-hidden="true" />
        {unread > 0 && (
          <span className={cn("absolute -right-1 -top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white shadow-sm ring-2", tone === "dark" ? "ring-primary-strong" : "ring-paper")}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-block border border-line bg-surface text-ink shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-sm font-bold">Thông báo{unread > 0 ? ` (${unread} mới)` : ""}</p>
            {unread > 0 && (
              <form action={markAllReadAction}>
                <button type="submit" className="cursor-pointer text-xs font-semibold text-primary hover:underline">
                  Đánh dấu đã đọc tất cả
                </button>
              </form>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Chưa có thông báo nào.</p>
          ) : (
            <ul className="max-h-[min(26rem,60dvh)] divide-y divide-line overflow-y-auto">
              {items.map((n) => {
                const Icon = kindIcon(n.kind);
                return (
                  <li key={n.id} className={cn(!n.readAt && "bg-primary-soft/40")}>
                    <form action={openNotificationAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="flex w-full cursor-pointer gap-3 px-4 py-2.5 text-left hover:bg-paper">
                        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.readAt ? "bg-paper text-muted" : "bg-primary text-white")}>
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-sm", !n.readAt && "font-semibold")}>{n.title}</span>
                          <span className="line-clamp-2 whitespace-pre-line text-xs text-muted">{n.body}</span>
                          <span className="mt-0.5 block text-[11px] text-subtle">{relativeTime(n.createdAt)}</span>
                        </span>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/thong-bao" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-sm font-semibold text-primary no-underline hover:bg-paper">
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </span>
  );
}
