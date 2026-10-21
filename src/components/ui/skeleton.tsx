/** Khung xám tĩnh cho `loading.tsx` (docs/08 §5) — không có animation. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="h-8 w-2/3 max-w-sm rounded-control bg-line" />
      <div className="h-4 w-1/2 max-w-xs rounded-control bg-line/70" />
      <div className="h-40 rounded-block bg-line/50" />
    </div>
  );
}
