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
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href, rootHref);
        const Icon = navIcon(item.href);
        return (
          <li key={item.href}>
            {item.section && (
              <p className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-widest text-on-brand-muted/70 first:mt-0">
                {item.section}
              </p>
            )}
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group/nav flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm no-underline transition-colors duration-200",
                active
                  ? "bg-white/14 font-semibold text-white shadow-sm"
                  : "text-white/80 hover:bg-white/8 hover:text-white",
              )}
              style={active ? { boxShadow: "inset 3px 0 0 rgba(255,255,255,0.7)" } : undefined}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-transform duration-200",
                  active ? "text-white" : "text-white/70 group-hover/nav:text-white",
                  !active && "group-hover/nav:translate-x-0.5",
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Ngăn kéo menu dưới 1024px. Tự đóng khi bấm liên kết / đổi đường dẫn / Esc.
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

/** Thanh điều hướng đáy premium: gradient border + dot indicator cho mục active. */
export function BottomNav({ items, rootHref }: { items: NavItem[]; rootHref: string }) {
  const pathname = usePathname();
  const shown = items.slice(0, 4);
  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
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
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-center text-xs no-underline transition-colors",
                  active ? "font-semibold text-primary" : "text-muted hover:text-ink",
                )}
              >
                {/* Gradient top border for active */}
                {active && (
                  <span
                    className="absolute inset-x-2 top-0 h-0.5 rounded-b-full"
                    style={{ background: "linear-gradient(90deg, #2f6bff, #1f2f98)" }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn("size-5 transition-transform", active && "-translate-y-0.5 scale-110")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

