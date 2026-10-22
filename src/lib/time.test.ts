import { describe, expect, it } from "vitest";
import { formatChatTime, formatDateTime, isValidTime, parseWeekParam, vnDateKey, vnToUtc, vnWeekday, vnWeekRange, vnWeekStart } from "./time";

describe("time", () => {
  it("đổi giờ Việt Nam sang UTC (+07:00, không có giờ mùa hè)", () => {
    expect(vnToUtc("2026-10-21", "18:00").toISOString()).toBe("2026-10-21T11:00:00.000Z");
    expect(vnToUtc("2026-10-21", "06:30").toISOString()).toBe("2026-10-20T23:30:00.000Z");
  });

  it("hiển thị lại đúng giờ Việt Nam", () => {
    expect(formatDateTime(new Date("2026-10-20T23:30:00.000Z"))).toBe("06:30 21/10/2026");
  });

  it("tính thứ và ngày theo giờ Việt Nam, không theo UTC", () => {
    const d = new Date("2026-10-25T18:00:00.000Z"); // 01:00 thứ Hai 26/10 giờ VN
    expect(vnWeekday(d)).toBe(1);
    expect(vnDateKey(d)).toBe("2026-10-26");
    expect(vnWeekday(new Date("2026-10-25T05:00:00.000Z"))).toBe(7);
  });

  it("kiểm tra định dạng giờ", () => {
    expect(isValidTime("07:05")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("7:05")).toBe(false);
    expect(() => vnToUtc("2026-1-1", "07:00")).toThrow();
  });
});

describe("tuần theo giờ VN (FR-022)", () => {
  it("Thứ Hai của tuần, tính theo giờ VN", () => {
    expect(vnWeekStart(new Date("2026-10-21T03:00:00Z"))).toBe("2026-10-19"); // Thứ Tư
    expect(vnWeekStart(new Date("2026-10-25T18:00:00Z"))).toBe("2026-10-26"); // 01:00 Thứ Hai VN
    expect(vnWeekStart(new Date("2026-10-25T16:00:00Z"))).toBe("2026-10-19"); // 23:00 Chủ nhật VN
  });

  it("đọc tham số tuần an toàn và trả khoảng UTC", () => {
    expect(parseWeekParam("2026-10-22")).toBe("2026-10-19");
    expect(parseWeekParam("xx", new Date("2026-10-21T03:00:00Z"))).toBe("2026-10-19");
    const r = vnWeekRange("2026-10-19");
    expect(r.from.toISOString()).toBe("2026-10-18T17:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-25T17:00:00.000Z");
  });
});

describe("formatChatTime", () => {
  const now = new Date("2026-10-22T03:00:00.000Z"); // 10:00 22/10 giờ VN
  it("hôm nay theo giờ VN → giờ:phút", () => {
    expect(formatChatTime(new Date("2026-10-21T18:30:00.000Z"), now)).toBe("01:30");
  });
  it("hôm qua cùng năm → ngày/tháng; khác năm → có năm", () => {
    expect(formatChatTime(new Date("2026-10-21T10:00:00.000Z"), now)).toBe("21/10");
    expect(formatChatTime(new Date("2025-12-31T10:00:00.000Z"), now)).toBe("31/12/25");
  });
});
