import { cn } from "@/lib/format";

/** Thanh tiến độ (đã học / tổng số buổi). Hiện cả số để không chỉ dựa vào màu. */
export function ProgressBar({ done, total, label, className }: { done: number; total: number; label: string; className?: string }) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-primary">
          {done}/{total} <span className="font-normal text-muted">({percent}%)</span>
        </span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-2 overflow-hidden rounded-full bg-primary-soft">
        <div className={cn("h-full rounded-full bg-primary transition-[width]")} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
