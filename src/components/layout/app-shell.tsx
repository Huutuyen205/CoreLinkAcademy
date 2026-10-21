import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/server/auth/actions";
import { ROLE_LABELS } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { Brand, BridgeArc } from "./brand";
import { BottomNav, SideNav, type NavItem } from "./nav-links";

type Props = {
  actor: Actor;
  rootHref: string;
  nav: NavItem[];
  /** Mục cho thanh đáy trên điện thoại (GV/HS/PH); bỏ trống với khu quản lý. */
  bottomNav?: NavItem[];
  children: ReactNode;
};

/**
 * Vỏ khu nội bộ: sidebar 240px nền xanh thương hiệu trên ≥1024px; dưới đó là thanh trên xanh + ngăn kéo (docs/08 §5).
 */
export function AppShell({ actor, rootHref, nav, bottomNav, children }: Props) {
  const account = (
    <div className="space-y-3 border-t border-white/15 pt-4">
      <div>
        <p className="font-semibold text-white">{actor.fullName}</p>
        <p className="text-sm text-on-brand-muted">{ROLE_LABELS[actor.role]}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/doi-mat-khau" className="underline underline-offset-2">
          Đổi mật khẩu
        </Link>
        <form action={logout}>
          <button type="submit" className="text-white underline underline-offset-2">
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
        <Brand href={rootHref} tone="light" className="relative" />
        <nav aria-label="Điều hướng nội bộ" className="relative flex-1 overflow-y-auto">
          <SideNav items={nav} rootHref={rootHref} />
        </nav>
        <div className="relative">{account}</div>
      </aside>

      <header className="on-brand sticky top-0 z-30 bg-primary lg:hidden">
        <details className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
            <Brand href={rootHref} tone="light" />
            <span className="rounded-control border border-white/40 px-3 py-1.5 text-sm font-medium">
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Đóng</span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-white/15 px-4 pb-5 pt-3">
            <nav aria-label="Điều hướng nội bộ">
              <SideNav items={nav} rootHref={rootHref} />
            </nav>
            {account}
          </div>
        </details>
      </header>

      <main id="noi-dung" className={bottomNav ? "px-4 pb-24 pt-6 lg:p-8" : "px-4 py-6 lg:p-8"}>
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>

      {bottomNav && bottomNav.length > 0 && <BottomNav items={bottomNav} rootHref={rootHref} />}
    </div>
  );
}
