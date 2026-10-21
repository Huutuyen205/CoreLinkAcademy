import type { ReactNode } from "react";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { unreadNotificationCount } from "@/server/notifications/service";
import { AppShell } from "./app-shell";
import { navForRole } from "./nav-config";

/** Vỏ khu nội bộ theo vai trò + số thông báo chưa đọc (chuông trên thanh đầu). */
export async function RoleShell({ actor, children }: { actor: Actor; children: ReactNode }) {
  const { nav, bottomNav } = navForRole(actor.role);
  const unread = await unreadNotificationCount(actor.id);
  return (
    <AppShell actor={actor} rootHref={HOME_BY_ROLE[actor.role]} nav={nav} bottomNav={bottomNav} unread={unread}>
      {children}
    </AppShell>
  );
}
