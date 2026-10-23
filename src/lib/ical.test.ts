import { describe, expect, it } from "vitest";
import { buildIcs, foldLine, icsEscape } from "./ical";

describe("iCalendar", () => {
  it("thoát ký tự đặc biệt", () => {
    expect(icsEscape("Toán; lớp 9, ôn\nthi")).toBe("Toán\\; lớp 9\\, ôn\\nthi");
  });
  it("gập dòng dài theo byte, không cắt chữ có dấu", () => {
    const folded = foldLine(`SUMMARY:${"Ôn thi vào 10 ".repeat(10)}`);
    for (const part of folded.split("\r\n")) expect(Buffer.byteLength(part, "utf8")).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"Ôn thi vào 10 ".repeat(10)}`);
  });
  it("sự kiện UTC, có nhắc trước 60 phút, buổi hủy đánh dấu CANCELLED", () => {
    const ics = buildIcs(
      "Lịch",
      [
        { uid: "a", start: new Date("2026-10-22T11:00:00Z"), end: new Date("2026-10-22T12:30:00Z"), summary: "TOAN9", location: "P.101" },
        { uid: "b", start: new Date("2026-10-24T11:00:00Z"), end: new Date("2026-10-24T12:30:00Z"), summary: "VAN9", cancelled: true },
      ],
      new Date("2026-10-21T00:00:00Z"),
    );
    expect(ics).toContain("DTSTART:20261022T110000Z");
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("SUMMARY:[ĐÃ HỦY] VAN9");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
