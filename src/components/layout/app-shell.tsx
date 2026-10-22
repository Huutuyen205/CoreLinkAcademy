import { Bell, KeyRound, LogOut, User } from "lucide-react";
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
      className="relative inline-flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white no-underline transition-all duration-200 hover:bg-white/18 hover:border-white/35 hover:scale-105"
    >
      <Bell className="size-4.5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white shadow-sm ring-2 ring-primary-strong animate-pulse">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

/**
 * Vỏ khu nội bộ v3.3 WOW: sidebar gradient xanh sâu với glow shadow trên ≥1024px;
 * dưới đó là thanh trên xanh + ngăn kéo menu (docs/08 §5).
 */
export function AppShell({ actor, rootHref, nav, bottomNav, unread = 0, children }: Props) {
  const initials = actor.fullName.trim().split(" ").slice(-1)[0]?.[0] ?? "U";

  const account = (
    <div className="space-y-3 rounded-2xl border border-white/12 bg-white/6 p-3.5 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-accent-light font-heading text-sm font-bold text-white shadow-sm ring-2 ring-white/20">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-primary-strong" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white leading-tight">{actor.fullName}</p>
          <span className="inline-block mt-0.5 rounded-full bg-white/15 px-2 py-0.2 text-[10px] font-semibold text-brand-tint">
            {ROLE_LABELS[actor.role]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
        <Link
          href="/tai-khoan"
          className="inline-flex items-center gap-1.5 text-on-brand-muted no-underline transition-colors hover:text-white"
          title="Thông tin tài khoản"
        >
          <User className="size-3.5" />
          <span>Hồ sơ</span>
        </Link>
        <Link
          href="/doi-mat-khau"
          className="inline-flex items-center gap-1.5 text-on-brand-muted no-underline transition-colors hover:text-white"
          title="Đổi mật khẩu"
        >
          <KeyRound className="size-3.5" />
          <span>Mật khẩu</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-on-brand-muted no-underline transition-colors hover:text-danger-soft cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="size-3.5" />
            <span>Thoát</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
      >
        Bỏ qua tới nội dung
      </a>

      {/* ─── Sidebar (desktop ≥1024px) ─── */}
      <aside className="on-brand sidebar-bg sidebar-glow relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-5 lg:p-5">
        {/* Họa tiết vòm cầu */}
        <BridgeArc className="pointer-events-none absolute -bottom-6 -left-8 w-[320px] text-white/8" />
        {/* Orb trang trí */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-2 pb-1 border-b border-white/10">
          <Brand href={rootHref} tone="light" />
          <BellLink unread={unread} />
        </div>

        <nav aria-label="Điều hướng nội bộ" className="relative flex-1 overflow-y-auto pr-1">
          <SideNav items={nav} rootHref={rootHref} />
        </nav>

        <div className="relative pt-1">{account}</div>
      </aside>

      {/* ─── Header mobile (<1024px) ─── */}
      <header className="on-brand sticky top-0 z-30 bg-primary-strong/95 backdrop-blur-sm lg:hidden">
        <MobileMenu
          summary={
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
              <Brand href={rootHref} tone="light" />
              <span className="ml-auto mr-2">
                <BellLink unread={unread} />
              </span>
              <span className="inline-flex min-h-10 items-center rounded-xl border border-white/30 bg-white/8 px-3.5 text-sm font-medium">
                <span className="group-open:hidden">Menu</span>
                <span className="hidden group-open:inline">Đóng</span>
              </span>
            </summary>
          }
        >
          <div className="max-h-[calc(100dvh-4rem)] space-y-4 overflow-y-auto overscroll-contain border-t border-white/12 px-4 pb-5 pt-3">
            <nav aria-label="Điều hướng nội bộ">
              <SideNav items={nav} rootHref={rootHref} />
            </nav>
            {account}
          </div>
        </MobileMenu>
      </header>

      {/* ─── Main content ─── */}
      <main
        id="noi-dung"
        className={bottomNav ? "px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 lg:p-8" : "px-4 py-6 lg:p-8"}
      >
        <div className="mx-auto max-w-[1140px]">{children}</div>
      </main>

      {bottomNav && bottomNav.length > 0 && <BottomNav items={bottomNav} rootHref={rootHref} />}
    </div>
  );
}
