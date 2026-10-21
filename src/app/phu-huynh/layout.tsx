import { AppShell } from "@/components/layout/app-shell";
import { parentNav } from "@/components/layout/nav-config";
import { requireRole } from "@/server/auth/guard";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("PARENT");
  return (
    <AppShell actor={actor} rootHref="/phu-huynh" nav={parentNav} bottomNav={parentNav}>
      {children}
    </AppShell>
  );
}
