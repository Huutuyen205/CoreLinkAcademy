import { PublicShell } from "@/components/layout/public-shell";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell bare>{children}</PublicShell>;
}
