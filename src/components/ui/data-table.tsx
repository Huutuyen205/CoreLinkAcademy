import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  /** Cột chính: in đậm làm tiêu đề dòng trên điện thoại. */
  primary?: boolean;
  className?: string;
};

/** Bảng trên ≥768px, danh sách dòng trên điện thoại — không cuộn ngang (NFR-002). */
export function DataTable<T>({ columns, rows, rowKey, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; caption: string }) {
  const primary = columns.find((c) => c.primary) ?? columns[0]!;
  const rest = columns.filter((c) => c !== primary);
  return (
    <div className="rounded-block border border-line bg-surface">
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            {columns.map((c) => (
              <th key={c.header} scope="col" className={cn("px-4 py-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 align-top">
              {columns.map((c) => (
                <td key={c.header} className={cn("px-4 py-3", c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="space-y-1.5 px-4 py-3">
            <div className="font-medium">{primary.cell(row)}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {rest.map((c) => (
                <div key={c.header} className="contents">
                  <dt className="text-muted">{c.header}</dt>
                  <dd className="min-w-0 break-words">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Phân trang đơn giản bằng liên kết `?page=`; giữ nguyên các tham số lọc khác. */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const linkClass = "inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-4 no-underline";
  return (
    <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className={linkClass}>Trang trước</Link> : <span />}
      <span className="text-muted">
        Trang {page}/{pages} · {total} mục
      </span>
      {page < pages ? <Link href={href(page + 1)} className={linkClass}>Trang sau</Link> : <span />}
    </nav>
  );
}

export function parsePage(value: string | string[] | undefined): number {
  const n = typeof value === "string" ? Number(value) : 1;
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}
