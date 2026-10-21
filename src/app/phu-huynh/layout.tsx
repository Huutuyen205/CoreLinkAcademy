import { RoleShell } from "@/components/layout/role-shell";
import { requireRole } from "@/server/auth/guard";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("PARENT");
  return <RoleShell actor={actor}>{children}</RoleShell>;
}
