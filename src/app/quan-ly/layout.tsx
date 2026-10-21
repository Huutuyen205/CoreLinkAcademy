import { RoleShell } from "@/components/layout/role-shell";
import { requireRole } from "@/server/auth/guard";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("ADMIN", "STAFF");
  return <RoleShell actor={actor}>{children}</RoleShell>;
}
