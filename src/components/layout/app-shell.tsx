import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { ROLE_LABELS } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { Assistant } from "@/components/ai/assistant";
import { ComposeShortcut } from "@/components/ai/compose-shortcut";
import { NotificationBell, NotificationProvider } from "@/components/notifications/notification-center";
import { canGlobalSearch } from "@/server/search/service";
import { Brand, BridgeArc } from "./brand";
import { ChildSwitcher, type SwitcherChild } from "./child-switcher";
import { CommandSearch } from "./command-search";
import { UserMenu } from "./user-menu";
import { BottomNav, MobileMenu, SideNav, type NavItem } from "./nav-links";

type Props = {
  actor: Actor;
  rootHref: string;
  nav: NavItem[];
  /** Mục cho thanh đáy trên điện thoại (GV/HS/PH); bỏ trống với khu quản lý. */
  bottomNav?: NavItem[];
  /** Số thông báo chưa đọc — chuông ở thanh đầu/sidebar. */
  unread?: number;
  /** Phụ huynh: các con liên kết + con đang chọn → ô chọn con trên thanh đầu. */
  childSwitcher?: { items: SwitcherChild[]; selectedId: string };
  children: ReactNode;
};

/**
 * Vỏ khu nội bộ v3.3 WOW: sidebar gradient xanh sâu với glow shadow trên ≥1024px;
 * dưới đó là thanh trên xanh + ngăn kéo menu (docs/08 §5).
 */
export function AppShell({ actor, rootHref, nav, bottomNav, unread = 0, childSwitcher, children }: Props) {
  const hasBottomNav = Boolean(bottomNav && bottomNav.length > 0);
  // Mục không có trên thanh đáy: thông báo đã có chuông, hồ sơ đã có trong menu avatar.
  const extraNav = hasBottomNav
    ? nav.filter((i) => !bottomNav!.some((b) => b.href === i.href) && i.href !== "/thong-bao" && i.href !== "/tai-khoan")
    : [];
  const roleLabel = ROLE_LABELS[actor.role];

  return (
    <NotificationProvider userId={actor.id} initialUnread={unread}>
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
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
          </div>
        {canGlobalSearch(actor.role) && (
          <div className="relative -mt-2">
            <CommandSearch variant="bar" placeholder={actor.role === "TEACHER" ? "Tìm lớp hoặc học sinh của tôi…" : undefined} />
          </div>
        )}

        <nav aria-label="Điều hướng nội bộ" className="relative flex-1 overflow-y-auto pr-1">
          <SideNav items={nav} rootHref={rootHref} />
        </nav>

      </aside>

      {/* ─── Header mobile (<1024px): avatar mở menu cá nhân; điều hướng chính nằm ở thanh đáy ─── */}
      <header className="on-brand sticky top-0 z-30 bg-primary-strong/95 backdrop-blur-sm lg:hidden">
        <div className="flex min-h-16 items-center gap-2 px-4">
          <Brand href={rootHref} tone="light" />
          <span className="ml-auto flex items-center gap-1.5">
            {canGlobalSearch(actor.role) && <CommandSearch placeholder={actor.role === "TEACHER" ? "Tìm lớp hoặc học sinh của tôi…" : undefined} />}
            {childSwitcher && <ChildSwitcher {...childSwitcher} tone="dark" />}
            <NotificationBell />
            <UserMenu compact fullName={actor.fullName} roleLabel={roleLabel} avatarFileId={actor.avatarFileId} extraNav={extraNav} />
            {/* Khu quản lý chưa có thanh đáy: giữ ngăn kéo điều hướng. */}
            {!hasBottomNav && (
              <MobileMenu
                summary={
                  <summary
                    aria-label="Menu điều hướng"
                    className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-white/30 bg-white/8 [&::-webkit-details-marker]:hidden"
                  >
                    <Menu className="size-5 group-open:hidden" aria-hidden="true" />
                    <X className="hidden size-5 group-open:block" aria-hidden="true" />
                  </summary>
                }
              >
                <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/12 bg-primary-strong px-4 pb-5 pt-3">
                  <nav aria-label="Điều hướng nội bộ">
                    <SideNav items={nav} rootHref={rootHref} />
                  </nav>
                </div>
              </MobileMenu>
            )}
          </span>
        </div>
      </header>

      {/* ─── Cột nội dung: thanh trên (desktop) chứa chuông + người dùng ở góc phải ─── */}
      <div className="min-w-0">
        <div className="sticky top-0 z-30 hidden items-center justify-end gap-3 border-b border-line bg-paper/85 px-8 py-2.5 backdrop-blur-md lg:flex">
          {childSwitcher && <ChildSwitcher {...childSwitcher} tone="light" />}
          <NotificationBell tone="light" />
          <UserMenu fullName={actor.fullName} roleLabel={roleLabel} avatarFileId={actor.avatarFileId} />
        </div>
        {/* min-w-0: cột nội dung không bị bảng/email dài kéo rộng hơn màn hình (gây kéo ngang trang). */}
        <main
          id="noi-dung"
          className={bottomNav ? "min-w-0 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 lg:px-8 lg:pb-8 lg:pt-6" : "min-w-0 px-4 py-6 lg:p-8 lg:pt-6"}
        >
          <div className="mx-auto max-w-[1140px]">{children}</div>
        </main>
      </div>

      {hasBottomNav && <BottomNav items={bottomNav!} rootHref={rootHref} />}
      <Assistant actor={actor} hasBottomNav={hasBottomNav} />
      {actor.role === "TEACHER" && <ComposeShortcut hasBottomNav={hasBottomNav} />}
    </div>
    </NotificationProvider>
  );
}
