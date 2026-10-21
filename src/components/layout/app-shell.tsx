import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/server/auth/actions";
import { ROLE_LABELS } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { BottomNav, SideNav, type NavItem } from "./nav-links";

type Props = {
  actor: Actor;
  rootHref: string;
  nav: NavItem[];
  /** Mục cho thanh đáy trên điện thoại (GV/HS/PH); bỏ trống với khu quản lý. */
  bottomNav?: NavItem[];
  children: ReactNode;
};

/** Vỏ khu nội bộ: sidebar 240px trên ≥1024px; dưới đó là thanh trên + ngăn kéo (docs/08 §3). */
export function AppShell({ actor, rootHref, nav, bottomNav, children }: Props) {
  const account = (
    <div className="space-y-3 border-t border-line pt-4">
      <div>
        <p className="font-medium text-ink">{actor.fullName}</p>
        <p className="text-sm text-muted">{ROLE_LABELS[actor.role]}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/doi-mat-khau">Đổi mật khẩu</Link>
        <form action={logout}>
          <button type="submit" className="text-primary underline">
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href={rootHref} className="font-serif text-lg font-semibold text-ink no-underline">
      CoreLink <span className="text-primary">Academy</span>
    </Link>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:min-h-dvh lg:flex-col lg:gap-6 lg:p-5">
        {brand}
        <nav aria-label="Điều hướng nội bộ" className="flex-1">
          <SideNav items={nav} rootHref={rootHref} />
        </nav>
        {account}
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-surface lg:hidden">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
            {brand}
            <span className="rounded-control border border-line px-3 py-1.5 text-sm text-ink">
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Đóng</span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-line px-4 pb-5 pt-3">
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
