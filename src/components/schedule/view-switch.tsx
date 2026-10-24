import Link from "next/link";
import { cn } from "@/lib/format";

/** Chuyển giữa lịch tuần và lịch tháng. */
export function ViewSwitch({ monthView, weekHref, monthHref }: { monthView: boolean; weekHref: string; monthHref: string }) {
  const tab = (active: boolean) =>
    cn("inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline", active ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line bg-surface text-ink");
  return (
    <nav aria-label="Kiểu xem" className="mb-4 flex gap-2">
      <Link href={weekHref} aria-current={!monthView ? "page" : undefined} className={tab(!monthView)}>
        Tuần
      </Link>
      <Link href={monthHref} aria-current={monthView ? "page" : undefined} className={tab(monthView)}>
        Tháng
      </Link>
    </nav>
  );
}
