// Hàm thuần cho báo cáo (không truy cập DB).

export const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). Ô bắt đầu bằng = + - @ được thêm ' để chặn công thức (CSV injection). */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    let s = v === null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `﻿${[header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")}\r\n`;
}
