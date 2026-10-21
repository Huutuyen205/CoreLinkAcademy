import { AppShell } from "@/components/layout/app-shell";
import { managementNav } from "@/components/layout/nav-config";
import { requireRole } from "@/server/auth/guard";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("ADMIN", "STAFF");
  return (
    <AppShell actor={actor} rootHref="/quan-ly" nav={managementNav(actor.role)}>
      {children}
    </AppShell>
  );
}
