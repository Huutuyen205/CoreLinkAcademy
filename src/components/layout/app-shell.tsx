import { Bell } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/server/auth/actions";
import { ROLE_LABELS } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { Brand, BridgeArc } from "./brand";
import { BottomNav, MobileMenu, SideNav, type NavItem } from "./nav-links";

type Props = {
  actor: Actor;
  rootHref: string;
  nav: NavItem[];
  /** Mục cho thanh đáy trên điện thoại (GV/HS/PH); bỏ trống với khu quản lý. */
  bottomNav?: NavItem[];
  /** Số thông báo chưa đọc — chuông ở thanh đầu/sidebar. */
  unread?: number;
  children: ReactNode;
};

function BellLink({ unread }: { unread: number }) {
  return (
    <Link
      href="/thong-bao"
      aria-label={unread > 0 ? `Thông báo: ${unread} chưa đọc` : "Thông báo"}
      className="relative inline-flex size-11 items-center justify-center rounded-control border border-white/40 text-white no-underline hover:bg-white/10"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-xs font-bold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>
      )}
    </Link>
  );
}

/**
 * Vỏ khu nội bộ: sidebar 240px nền xanh thương hiệu trên ≥1024px; dưới đó là thanh trên xanh + ngăn kéo (docs/08 §5).
 */
export function AppShell({ actor, rootHref, nav, bottomNav, unread = 0, children }: Props) {
  const account = (
    <div className="space-y-3 border-t border-white/15 pt-4">
      <div>
        <p className="font-semibold text-white">{actor.fullName}</p>
        <p className="text-sm text-on-brand-muted">{ROLE_LABELS[actor.role]}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 text-sm">
        <Link href="/tai-khoan" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Tài khoản
        </Link>
        <Link href="/doi-mat-khau" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Đổi mật khẩu
        </Link>
        <form action={logout}>
          <button type="submit" className="inline-flex min-h-11 items-center text-white underline underline-offset-2">
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      <aside className="on-brand relative hidden overflow-hidden bg-primary lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:p-5">
        <BridgeArc className="pointer-events-none absolute -bottom-4 -left-10 w-[340px] text-white/10" />
        <div className="relative flex items-center justify-between gap-2">
          <Brand href={rootHref} tone="light" />
          <BellLink unread={unread} />
        </div>
        <nav aria-label="Điều hướng nội bộ" className="relative flex-1 overflow-y-auto">
          <SideNav items={nav} rootHref={rootHref} />
        </nav>
        <div className="relative">{account}</div>
      </aside>

      <header className="on-brand sticky top-0 z-30 bg-primary lg:hidden">
        <MobileMenu
          summary={
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
              <Brand href={rootHref} tone="light" />
              <span className="ml-auto mr-2">
                <BellLink unread={unread} />
              </span>
              <span className="inline-flex min-h-11 items-center rounded-control border border-white/40 px-4 text-sm font-medium">
                <span className="group-open:hidden">Menu</span>
                <span className="hidden group-open:inline">Đóng</span>
              </span>
            </summary>
          }
        >
          <div className="max-h-[calc(100dvh-4rem)] space-y-4 overflow-y-auto overscroll-contain border-t border-white/15 px-4 pb-5 pt-3">
            <nav aria-label="Điều hướng nội bộ">
              <SideNav items={nav} rootHref={rootHref} />
            </nav>
            {account}
          </div>
        </MobileMenu>
      </header>

      <main id="noi-dung" className={bottomNav ? "px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 lg:p-8" : "px-4 py-6 lg:p-8"}>
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>

      {bottomNav && bottomNav.length > 0 && <BottomNav items={bottomNav} rootHref={rootHref} />}
    </div>
  );
}
