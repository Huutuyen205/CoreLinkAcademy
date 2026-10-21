"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { navIcon } from "./nav-icons";

/** `section`: tiêu đề nhóm hiện phía trên mục này trong sidebar. */
export type NavItem = { href: string; label: string; section?: string };

function isActive(pathname: string, href: string, rootHref: string) {
  return href === rootHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Danh sách liên kết dọc cho sidebar/ngăn kéo — đặt trên nền xanh thương hiệu (`.on-brand`). */
export function SideNav({ items, rootHref }: { items: NavItem[]; rootHref: string }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href, rootHref);
        const Icon = navIcon(item.href);
        return (
          <li key={item.href}>
            {item.section && <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-on-brand-muted first:mt-0">{item.section}</p>}
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group/nav flex min-h-11 items-center gap-3 rounded-control px-3 text-base no-underline transition-colors duration-200",
                // Mục đang chọn: ô trắng chữ xanh như ô nhấn trên banner (utilities thắng `.on-brand a` ở lớp base).
                active ? "bg-white font-semibold text-primary shadow-sm" : "text-white/90 hover:bg-white/10",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0 transition-transform duration-200", !active && "group-hover/nav:translate-x-0.5")} aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Ngăn kéo menu dưới 1024px. Layout dùng chung giữ nguyên khi chuyển trang nên `<details>` phải tự đóng
 * khi bấm liên kết / đổi đường dẫn, nếu không menu vẫn mở che nội dung trang mới.
 */
export function MobileMenu({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current?.removeAttribute("open");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <details
      ref={ref}
      className="group"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open");
      }}
    >
      {summary}
      {children}
    </details>
  );
}

/** Thanh điều hướng đáy trên điện thoại cho GV/HS/PH, tối đa 4 mục (docs/08 §3). */
export function BottomNav({ items, rootHref }: { items: NavItem[]; rootHref: string }) {
  const pathname = usePathname();
  const shown = items.slice(0, 4);
  return (
    <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((item) => {
          const active = isActive(pathname, item.href, rootHref);
          const Icon = navIcon(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-[3px] px-1 text-center text-xs no-underline transition-colors",
                  active ? "border-primary font-semibold text-primary" : "border-transparent text-muted",
                )}
              >
                <Icon className={cn("size-5 transition-transform", active && "-translate-y-0.5")} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
