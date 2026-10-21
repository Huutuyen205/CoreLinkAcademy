import { describe, expect, it } from "vitest";
import { parseReportFilter } from "./filter";
import { pctOf, toCsv } from "./format";

describe("toCsv", () => {
  it("có BOM, phân tách bằng dấu phẩy, xuống dòng CRLF", () => {
    expect(toCsv(["A", "B"], [[1, null]])).toBe("﻿A,B\r\n1,\r\n");
  });
  it("bọc ô có dấu phẩy/ngoặc kép", () => {
    expect(toCsv(["x"], [['Lớp "A", B']])).toBe('﻿x\r\n"Lớp ""A"", B"\r\n');
  });
  it("chặn công thức Excel (CSV injection)", () => {
    expect(toCsv(["x"], [["=HYPERLINK(1)"], ["-5"]])).toBe("﻿x\r\n'=HYPERLINK(1)\r\n'-5\r\n");
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
