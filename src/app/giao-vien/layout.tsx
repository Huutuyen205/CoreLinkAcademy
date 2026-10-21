import { AppShell } from "@/components/layout/app-shell";
import { teacherNav } from "@/components/layout/nav-config";
import { requireRole } from "@/server/auth/guard";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("TEACHER");
  return (
    <AppShell actor={actor} rootHref="/giao-vien" nav={teacherNav} bottomNav={teacherNav}>
      {children}
    </AppShell>
  );
}
