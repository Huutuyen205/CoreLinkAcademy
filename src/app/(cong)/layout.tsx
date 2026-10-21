import { RoleShell } from "@/components/layout/role-shell";
import { requireActor } from "@/server/auth/guard";

// Trang dùng chung mọi vai trò: tài liệu, thông báo, tin nhắn, tài khoản.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  return <RoleShell actor={actor}>{children}</RoleShell>;
}
