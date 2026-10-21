"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

export type NavItem = { href: string; label: string };

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
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-control px-3 text-base no-underline",
                // Mục đang chọn: ô trắng chữ xanh như ô nhấn trên banner (utilities thắng `.on-brand a` ở lớp base).
                active ? "bg-white font-semibold text-primary" : "text-white/90 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Thanh điều hướng đáy trên điện thoại cho GV/HS/PH, tối đa 4 mục (docs/08 §3). */
export function BottomNav({ items, rootHref }: { items: NavItem[]; rootHref: string }) {
  const pathname = usePathname();
  const shown = items.slice(0, 4);
  return (
    <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((item) => {
          const active = isActive(pathname, item.href, rootHref);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 items-center justify-center border-t-[3px] px-2 text-center text-sm no-underline",
                  active ? "border-primary font-semibold text-primary" : "border-transparent text-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
