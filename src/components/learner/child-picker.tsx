import Link from "next/link";
import { cn } from "@/lib/format";

/** Chọn con đang theo dõi (Phụ huynh §1). Ẩn khi chỉ có một con. */
export function ChildPicker({ items, currentId, basePath }: { items: { id: string; fullName: string }[]; currentId: string; basePath: string }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Chọn con" className="mb-6 flex flex-wrap gap-2">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?con=${c.id}`}
          aria-current={c.id === currentId ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-4 no-underline transition-colors",
            c.id === currentId ? "border-primary bg-primary-soft font-medium text-primary" : "border-line bg-surface text-ink hover:border-primary",
          )}
        >
          {c.fullName}
        </Link>
      ))}
    </nav>
  );
}
