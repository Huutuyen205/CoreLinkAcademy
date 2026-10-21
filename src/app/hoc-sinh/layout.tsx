import { RoleShell } from "@/components/layout/role-shell";
import { requireRole } from "@/server/auth/guard";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("STUDENT");
  return <RoleShell actor={actor}>{children}</RoleShell>;
}
