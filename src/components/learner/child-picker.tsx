import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/format";

/** Chọn con đang theo dõi (Phụ huynh §1). Ẩn khi chỉ có một con. */
export function ChildPicker({
  items,
  currentId,
  basePath,
}: {
  items: { id: string; fullName: string; studentCode?: string | null; gradeLevel?: number | null }[];
  currentId: string;
  basePath: string;
}) {
  if (items.length < 2) return null;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Đang theo dõi học sinh:
        </span>
        <span className="text-xs text-subtle">{items.length} học sinh liên kết</span>
      </div>
      <nav aria-label="Chọn con" className="flex flex-wrap gap-2.5">
        {items.map((c) => {
          const active = c.id === currentId;
          const initials = c.fullName.trim().split(" ").slice(-1)[0]?.[0] ?? "H";
          return (
            <Link
              key={c.id}
              href={`${basePath}?con=${c.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative inline-flex min-h-12 items-center gap-3 rounded-xl border px-3.5 py-1.5 no-underline transition-all duration-200",
                active
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-102"
                  : "border-line bg-surface text-ink hover:border-primary/50 hover:bg-paper hover:shadow-xs",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  active ? "bg-white/20 text-white" : "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors"
                )}
              >
                {active ? <Check className="size-3.5" /> : initials}
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-sm font-bold leading-tight">{c.fullName}</span>
                {c.gradeLevel && (
                  <span className={cn("block text-[11px]", active ? "text-on-brand-muted" : "text-muted")}>
                    Lớp {c.gradeLevel}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
