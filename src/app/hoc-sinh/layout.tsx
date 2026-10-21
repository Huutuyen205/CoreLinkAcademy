import { AppShell } from "@/components/layout/app-shell";
import { studentNav } from "@/components/layout/nav-config";
import { requireRole } from "@/server/auth/guard";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("STUDENT");
  return (
    <AppShell actor={actor} rootHref="/hoc-sinh" nav={studentNav} bottomNav={studentNav}>
      {children}
    </AppShell>
  );
}
