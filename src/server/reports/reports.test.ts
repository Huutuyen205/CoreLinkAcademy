import { describe, expect, it } from "vitest";
import { parseReportFilter } from "./filter";
import { attendanceSheet, completionSheet, FIRST_ROW, resultsSheet, writeWorkbook } from "./excel";
import { pctOf } from "./format";

describe("báo cáo Excel", () => {
  const att = [
    { classId: "a", code: "TOAN9", sessions: 4, marked: 40, present: 30, late: 6, absent: 3, excused: 1 },
    { classId: "b", code: "ANH6", sessions: 2, marked: 0, present: 0, late: 0, absent: 0, excused: 0 },
  ];
  it("chuyên cần: cột % là công thức theo đúng dòng, kèm giá trị tính sẵn", () => {
    const s = attendanceSheet(att, "kỳ");
    expect(s.rows[0]![7]).toEqual({ formula: `IF(C${FIRST_ROW}>0,(D${FIRST_ROW}+E${FIRST_ROW})/C${FIRST_ROW},"")`, result: 0.9 });
    expect(s.rows[1]![7]).toEqual({ formula: `IF(C${FIRST_ROW + 1}>0,(D${FIRST_ROW + 1}+E${FIRST_ROW + 1})/C${FIRST_ROW + 1},"")`, result: "" });
    const t = FIRST_ROW + 2;
    expect(s.totals![2]).toEqual({ formula: `SUM(C${FIRST_ROW}:C${FIRST_ROW + 1})`, result: 40 });
    expect(s.totals![8]).toEqual({ formula: `IF(C${t}>0,F${t}/C${t},"")`, result: 0.075 });
  });
  it("kết quả: điểm TB tổng có trọng số theo số bài chấm", () => {
    const s = resultsSheet(
      [
        { classId: "a", code: "A", graded: 1, avgPct: 100, minPct: 100, maxPct: 100 },
        { classId: "b", code: "B", graded: 3, avgPct: 60, minPct: 40, maxPct: 80 },
      ],
      "kỳ",
    );
    expect(s.rows[1]![2]).toBe(0.6);
    expect(s.totals![2]).toMatchObject({ formula: `IF(B${FIRST_ROW + 2}>0,SUMPRODUCT(B${FIRST_ROW}:B${FIRST_ROW + 1},C${FIRST_ROW}:C${FIRST_ROW + 1})/B${FIRST_ROW + 2},"")`, result: 0.7 });
  });
  it("bài tập: tỷ lệ nộp và nộp muộn", () => {
    const s = completionSheet([{ classId: "a", code: "A", assignments: 2, expected: 20, submitted: 15, late: 3 }], "kỳ");
    expect(s.rows[0]![5]).toEqual({ formula: `MAX(C${FIRST_ROW}-D${FIRST_ROW},0)`, result: 5 });
    expect(s.rows[0]![6]).toMatchObject({ result: 0.75 });
    expect(s.rows[0]![7]).toMatchObject({ result: 0.2 });
  });
  it("không có dữ liệu → không có dòng tổng", () => {
    expect(completionSheet([], "kỳ").totals).toBeUndefined();
  });
  it("ghi được file .xlsx (zip)", async () => {
    const buf = await writeWorkbook([attendanceSheet(att, "kỳ"), resultsSheet([], "kỳ")], "08:00 22/10/2026");
    expect(buf.subarray(0, 2).toString()).toBe("PK");
  });
});

describe("pctOf", () => {
  it("làm tròn, mẫu 0 → null", () => {
    expect(pctOf(2, 3)).toBe(67);
    expect(pctOf(0, 0)).toBeNull();
  });
});

describe("parseReportFilter", () => {
  const options = { classes: [{ id: "c1" }], subjects: [{ id: "s1" }] };
  it("mặc định 30 ngày đến hôm nay, giờ VN", () => {
    const { fromKey, toKey, filter } = parseReportFilter({}, "2026-10-21", options);
    expect(toKey).toBe("2026-10-21");
    expect(fromKey).toBe("2026-09-22");
    expect(filter.from.toISOString()).toBe("2026-09-21T17:00:00.000Z");
    expect(filter.to.toISOString()).toBe("2026-10-21T17:00:00.000Z");
  });
  it("bỏ qua tham số sai: ngày ngược, lớp/môn không tồn tại", () => {
    const { fromKey, filter } = parseReportFilter({ tu: "2026-11-01", den: "2026-10-01", lop: "x", mon: "s1" }, "2026-10-21", options);
    expect(fromKey).toBe("2026-09-02");
    expect(filter.classId).toBeUndefined();
    expect(filter.subjectId).toBe("s1");
  });
});
