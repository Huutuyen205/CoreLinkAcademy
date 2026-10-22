// Xuất báo cáo ra Excel (.xlsx) — FR-052. Cột tỷ lệ là CÔNG THỨC Excel (sửa số liệu trong file thì % tự tính lại),
// kèm giá trị đã tính sẵn để trình xem không tính lại công thức vẫn hiện đúng.
// Phần dựng bảng (`*Sheet`) là hàm thuần để test; `writeWorkbook` mới dùng exceljs.
import ExcelJS from "exceljs";
import type { AttendanceRow, CompletionRow, ResultRow } from "./service";

export type Formula = { formula: string; result: number | string | null };
export type Cell = string | number | null | Formula;
export type ColumnFormat = "text" | "int" | "pct";
export type SheetSpec = {
  name: string;
  title: string;
  columns: { header: string; width: number; format: ColumnFormat }[];
  rows: Cell[][];
  totals?: Cell[];
};

/** Dòng tiêu đề bảng; dữ liệu bắt đầu ở dòng kế tiếp (dòng 1–2: tiêu đề + kỳ báo cáo). */
export const HEADER_ROW = 4;
export const FIRST_ROW = HEADER_ROW + 1;

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : "");
const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);
const f = (formula: string, result: number | string | null): Formula => ({ formula, result });

function totalRowOf(count: number) {
  return FIRST_ROW + count;
}

/** SUM cho một cột dữ liệu (dòng FIRST_ROW..last). */
function sumOf(col: string, count: number, values: number[]): Formula {
  return f(`SUM(${col}${FIRST_ROW}:${col}${FIRST_ROW + count - 1})`, sum(values));
}

export function attendanceSheet(rows: AttendanceRow[], period: string): SheetSpec {
  const r = (i: number) => FIRST_ROW + i;
  const t = totalRowOf(rows.length);
  const tot = { marked: sum(rows.map((x) => x.marked)), attended: sum(rows.map((x) => x.present + x.late)), absent: sum(rows.map((x) => x.absent)) };
  return {
    name: "Chuyên cần",
    title: `Chuyên cần theo lớp · ${period}`,
    columns: [
      { header: "Lớp", width: 16, format: "text" },
      { header: "Số buổi", width: 10, format: "int" },
      { header: "Lượt điểm danh", width: 15, format: "int" },
      { header: "Có mặt", width: 10, format: "int" },
      { header: "Đi muộn", width: 10, format: "int" },
      { header: "Vắng", width: 10, format: "int" },
      { header: "Có phép", width: 10, format: "int" },
      { header: "Tỷ lệ chuyên cần (%)", width: 20, format: "pct" },
      { header: "Tỷ lệ vắng (%)", width: 16, format: "pct" },
    ],
    // BR-032: chuyên cần = (có mặt + đi muộn) / lượt đã điểm danh.
    rows: rows.map((x, i) => [
      x.code,
      x.sessions,
      x.marked,
      x.present,
      x.late,
      x.absent,
      x.excused,
      f(`IF(C${r(i)}>0,(D${r(i)}+E${r(i)})/C${r(i)},"")`, ratio(x.present + x.late, x.marked)),
      f(`IF(C${r(i)}>0,F${r(i)}/C${r(i)},"")`, ratio(x.absent, x.marked)),
    ]),
    totals: rows.length
      ? [
          "Tổng",
          sumOf("B", rows.length, rows.map((x) => x.sessions)),
          sumOf("C", rows.length, rows.map((x) => x.marked)),
          sumOf("D", rows.length, rows.map((x) => x.present)),
          sumOf("E", rows.length, rows.map((x) => x.late)),
          sumOf("F", rows.length, rows.map((x) => x.absent)),
          sumOf("G", rows.length, rows.map((x) => x.excused)),
          f(`IF(C${t}>0,(D${t}+E${t})/C${t},"")`, ratio(tot.attended, tot.marked)),
          f(`IF(C${t}>0,F${t}/C${t},"")`, ratio(tot.absent, tot.marked)),
        ]
      : undefined,
  };
}

export function resultsSheet(rows: ResultRow[], period: string): SheetSpec {
  const last = FIRST_ROW + rows.length - 1;
  const pct = (v: number | null) => (v === null ? null : v / 100);
  const graded = sum(rows.map((x) => x.graded));
  const weighted = sum(rows.map((x) => x.graded * (x.avgPct ?? 0)));
  const mins = rows.map((x) => x.minPct).filter((v): v is number => v !== null);
  const maxs = rows.map((x) => x.maxPct).filter((v): v is number => v !== null);
  return {
    name: "Kết quả",
    title: `Kết quả học tập theo lớp · ${period}`,
    columns: [
      { header: "Lớp", width: 16, format: "text" },
      { header: "Bài đã chấm", width: 13, format: "int" },
      { header: "Điểm TB (%)", width: 13, format: "pct" },
      { header: "Thấp nhất (%)", width: 14, format: "pct" },
      { header: "Cao nhất (%)", width: 14, format: "pct" },
    ],
    rows: rows.map((x) => [x.code, x.graded, pct(x.avgPct), pct(x.minPct), pct(x.maxPct)]),
    // Điểm TB toàn bộ = trung bình có trọng số theo số bài đã chấm của từng lớp.
    totals: rows.length
      ? [
          "Tổng",
          sumOf("B", rows.length, rows.map((x) => x.graded)),
          f(`IF(B${last + 1}>0,SUMPRODUCT(B${FIRST_ROW}:B${last},C${FIRST_ROW}:C${last})/B${last + 1},"")`, graded > 0 ? weighted / graded / 100 : ""),
          f(`MIN(D${FIRST_ROW}:D${last})`, mins.length ? Math.min(...mins) / 100 : 0),
          f(`MAX(E${FIRST_ROW}:E${last})`, maxs.length ? Math.max(...maxs) / 100 : 0),
        ]
      : undefined,
  };
}

export function completionSheet(rows: CompletionRow[], period: string): SheetSpec {
  const r = (i: number) => FIRST_ROW + i;
  const t = totalRowOf(rows.length);
  const tot = { expected: sum(rows.map((x) => x.expected)), submitted: sum(rows.map((x) => x.submitted)), late: sum(rows.map((x) => x.late)) };
  return {
    name: "Bài tập",
    title: `Hoàn thành bài tập theo lớp · ${period}`,
    columns: [
      { header: "Lớp", width: 16, format: "text" },
      { header: "Bài đã giao", width: 12, format: "int" },
      { header: "Cần nộp", width: 10, format: "int" },
      { header: "Đã nộp", width: 10, format: "int" },
      { header: "Nộp muộn", width: 11, format: "int" },
      { header: "Chưa nộp", width: 11, format: "int" },
      { header: "Tỷ lệ nộp (%)", width: 14, format: "pct" },
      { header: "Tỷ lệ nộp muộn (%)", width: 19, format: "pct" },
    ],
    rows: rows.map((x, i) => [
      x.code,
      x.assignments,
      x.expected,
      x.submitted,
      x.late,
      f(`MAX(C${r(i)}-D${r(i)},0)`, Math.max(x.expected - x.submitted, 0)),
      f(`IF(C${r(i)}>0,D${r(i)}/C${r(i)},"")`, ratio(x.submitted, x.expected)),
      f(`IF(D${r(i)}>0,E${r(i)}/D${r(i)},"")`, ratio(x.late, x.submitted)),
    ]),
    totals: rows.length
      ? [
          "Tổng",
          sumOf("B", rows.length, rows.map((x) => x.assignments)),
          sumOf("C", rows.length, rows.map((x) => x.expected)),
          sumOf("D", rows.length, rows.map((x) => x.submitted)),
          sumOf("E", rows.length, rows.map((x) => x.late)),
          sumOf("F", rows.length, rows.map((x) => Math.max(x.expected - x.submitted, 0))),
          f(`IF(C${t}>0,D${t}/C${t},"")`, ratio(tot.submitted, tot.expected)),
          f(`IF(D${t}>0,E${t}/D${t},"")`, ratio(tot.late, tot.submitted)),
        ]
      : undefined,
  };
}

const PRIMARY = "FF1F2F98";
const BORDER = { style: "thin" as const, color: { argb: "FFD5DAEA" } };

/** Ghi các bảng thành một file .xlsx (mỗi bảng một sheet). */
export async function writeWorkbook(sheets: SheetSpec[], generatedAt: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CoreLink Academy";
  wb.created = new Date();
  // Excel tính lại mọi công thức khi mở (exceljs không ghi giá trị tính sẵn bằng 0).
  wb.calcProperties.fullCalcOnLoad = true;
  for (const spec of sheets) {
    const ws = wb.addWorksheet(spec.name, { views: [{ state: "frozen", ySplit: HEADER_ROW }] });
    spec.columns.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width;
    });
    const lastCol = spec.columns.length;
    ws.mergeCells(1, 1, 1, lastCol);
    ws.getCell(1, 1).value = spec.title;
    ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: PRIMARY } };
    ws.mergeCells(2, 1, 2, lastCol);
    ws.getCell(2, 1).value = `CoreLink Academy · xuất lúc ${generatedAt}`;
    ws.getCell(2, 1).font = { italic: true, size: 10, color: { argb: "FF4A5274" } };

    const header = ws.getRow(HEADER_ROW);
    spec.columns.forEach((c, i) => {
      const cell = header.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
    });
    header.height = 30;

    const all = spec.totals ? [...spec.rows, spec.totals] : spec.rows;
    all.forEach((values, i) => {
      const row = ws.getRow(FIRST_ROW + i);
      const isTotal = spec.totals !== undefined && i === all.length - 1;
      values.forEach((v, c) => {
        const cell = row.getCell(c + 1);
        cell.value = v === null ? null : typeof v === "object" ? { formula: v.formula, result: v.result ?? undefined } : v;
        const format = spec.columns[c]?.format;
        if (format === "pct") cell.numFmt = "0.0%";
        else if (format === "int") cell.numFmt = "#,##0";
        cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
        if (isTotal) {
          cell.font = { bold: true };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF1FB" } };
        }
      });
    });
    if (spec.rows.length > 0) ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW + spec.rows.length, column: lastCol } };
    else ws.getCell(FIRST_ROW, 1).value = "Không có dữ liệu trong kỳ.";
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
