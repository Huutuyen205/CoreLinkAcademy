import { RoleShell } from "@/components/layout/role-shell";
import { requireRole } from "@/server/auth/guard";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("TEACHER");
  return <RoleShell actor={actor}>{children}</RoleShell>;
}
