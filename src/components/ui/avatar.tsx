import { cn } from "@/lib/format";

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-xl", xl: "size-24 text-3xl" } as const;

export function initialOf(fullName: string): string {
  return fullName.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? "U";
}

/** Ảnh đại diện (FR-051) hoặc chữ cái đầu của tên nếu chưa có ảnh. Ảnh tải qua `/tep/<id>` (kiểm tra đăng nhập). */
export function Avatar({ name, fileId, size = "md", className }: { name: string; fileId?: string | null; size?: keyof typeof SIZES; className?: string }) {
  const box = cn("shrink-0 overflow-hidden rounded-full", SIZES[size], className);
  if (fileId) {
    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ route có kiểm tra phiên, không qua Image Optimization
    return <img src={`/tep/${fileId}`} alt="" className={cn(box, "bg-paper object-cover")} loading="lazy" />;
  }
  return (
    <span aria-hidden="true" className={cn(box, "inline-flex items-center justify-center bg-gradient-to-tr from-primary to-accent font-bold text-white")}>
      {initialOf(name)}
    </span>
  );
}
