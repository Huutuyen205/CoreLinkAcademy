import Link from "next/link";
import { cn } from "@/lib/format";
import { CLASS_TABS, type ClassTab } from "./tabs";

/**
 * Điện thoại: lưới 2×2 nút lớn (cả 4 mục hiện đủ, không phải vuốt ngang để tìm).
 * ≥ sm: tab gạch chân trên một hàng.
 */
export function TabNav({ classId, active }: { classId: string; active: ClassTab }) {
  return (
    <nav aria-label="Mục của lớp" className="mb-6 sm:border-b sm:border-line">
      <ul className="grid grid-cols-2 gap-2 sm:-mb-px sm:flex sm:gap-0">
        {CLASS_TABS.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key} className="sm:shrink-0">
              <Link
                href={`/giao-vien/lop/${classId}?tab=${t.key}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-control border px-3 text-center text-sm leading-snug no-underline",
                  "sm:inline-flex sm:justify-start sm:rounded-none sm:border-0 sm:border-b-2 sm:px-4 sm:whitespace-nowrap",
                  on
                    ? "border-primary bg-primary-soft font-semibold text-primary sm:bg-transparent"
                    : "border-line bg-surface text-ink hover:border-primary/40 sm:border-transparent sm:bg-transparent sm:text-muted sm:hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
