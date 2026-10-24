import type { ReactNode } from "react";
import { HOME_BY_ROLE } from "@/server/auth/policy";
import type { Actor } from "@/server/auth/session";
import { parentChildren } from "@/server/auth/learner";
import { unreadNotificationCount } from "@/server/notifications/service";
import { AppShell } from "./app-shell";
import { navForRole } from "./nav-config";

/** Vỏ khu nội bộ theo vai trò + số thông báo chưa đọc (chuông trên thanh đầu). */
export async function RoleShell({ actor, children }: { actor: Actor; children: ReactNode }) {
  const { nav, bottomNav } = navForRole(actor.role);
  const [unread, kids] = await Promise.all([unreadNotificationCount(actor.id), actor.role === "PARENT" ? parentChildren(actor) : null]);
  // Phụ huynh: ô chọn con ở thanh trên (DECISION-D42).
  const childSwitcher = kids?.selected ? { items: kids.children.map((c) => ({ id: c.id, fullName: c.fullName, gradeLevel: c.gradeLevel })), selectedId: kids.selected.id } : undefined;
  return (
    <AppShell actor={actor} rootHref={HOME_BY_ROLE[actor.role]} nav={nav} bottomNav={bottomNav} unread={unread} childSwitcher={childSwitcher}>
      {children}
    </AppShell>
  );
}
