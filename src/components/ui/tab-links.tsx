import Link from "next/link";
import { cn } from "@/lib/format";

export type TabLink = { key: string; label: string; href: string; count?: number };

/** Thanh tab gạch chân điều hướng bằng liên kết (trạng thái nằm trong URL). */
export function TabLinks({ tabs, active, label }: { tabs: TabLink[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 border-b border-line">
      <ul className="-mb-px flex">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key} className="min-w-0 flex-1 sm:flex-none">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm no-underline sm:px-5",
                  on ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t.label}
                {t.count ? <span className="rounded-full bg-warning-soft px-1.5 text-xs font-bold text-warning">{t.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
