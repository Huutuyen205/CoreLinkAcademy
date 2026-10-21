import { describe, expect, it } from "vitest";
import { findConflicts, generateSessions, overlaps, parseWeekdays, weekdayOfDate } from "./schedule";

const at = (iso: string) => new Date(iso);

describe("sinh buổi BR-023", () => {
  it("TC-013 sinh đủ số buổi theo thứ, đúng giờ VN → UTC", () => {
    // 2026-10-21 là Thứ Tư. Lịch Thứ Hai/Tư/Sáu 18:00–19:30.
    const sessions = generateSessions({ startDate: "2026-10-21", weekdays: [1, 3, 5], startTime: "18:00", endTime: "19:30", total: 5 });
    expect(sessions).toHaveLength(5);
    expect(sessions.map((s) => s.startsAt.toISOString())).toEqual([
      "2026-10-21T11:00:00.000Z", // Thứ Tư
      "2026-10-23T11:00:00.000Z", // Thứ Sáu
      "2026-10-26T11:00:00.000Z", // Thứ Hai
      "2026-10-28T11:00:00.000Z",
      "2026-10-30T11:00:00.000Z",
    ]);
    expect(sessions[0]!.endsAt.toISOString()).toBe("2026-10-21T12:30:00.000Z");
    expect(sessions.map((s) => s.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it("TC-013 ngày bắt đầu không thuộc thứ đã chọn thì nhảy tới ngày hợp lệ đầu tiên", () => {
    const sessions = generateSessions({ startDate: "2026-10-21", weekdays: [7], startTime: "08:00", endTime: "09:30", total: 2 });
    expect(sessions.map((s) => s.startsAt.toISOString())).toEqual(["2026-10-25T01:00:00.000Z", "2026-11-01T01:00:00.000Z"]);
  });

  it("thứ của ngày và parse weekdays", () => {
    expect(weekdayOfDate("2026-10-26")).toBe(1);
    expect(weekdayOfDate("2026-10-25")).toBe(7);
    expect(parseWeekdays("5, 1,3,3,9")).toEqual([1, 3, 5]);
    expect(generateSessions({ startDate: "2026-10-21", weekdays: [], startTime: "08:00", endTime: "09:00", total: 3 })).toEqual([]);
  });
});

describe("trùng lịch BR-021", () => {
  const a = { startsAt: at("2026-10-21T11:00:00Z"), endsAt: at("2026-10-21T12:30:00Z") };

  it("TC-014 phát hiện chồng giờ; chạm biên không tính là trùng", () => {
    expect(overlaps(a, { startsAt: at("2026-10-21T12:00:00Z"), endsAt: at("2026-10-21T13:00:00Z") })).toBe(true);
    expect(overlaps(a, { startsAt: at("2026-10-21T10:00:00Z"), endsAt: at("2026-10-21T14:00:00Z") })).toBe(true);
    expect(overlaps(a, { startsAt: at("2026-10-21T12:30:00Z"), endsAt: at("2026-10-21T13:30:00Z") })).toBe(false);
    expect(overlaps(a, { startsAt: at("2026-10-21T09:30:00Z"), endsAt: at("2026-10-21T11:00:00Z") })).toBe(false);
  });

  it("TC-014 bỏ qua buổi đã hủy", () => {
    const existing = [
      { id: "x", status: "CANCELLED", startsAt: at("2026-10-21T11:00:00Z"), endsAt: at("2026-10-21T12:30:00Z") },
      { id: "y", status: "SCHEDULED", startsAt: at("2026-10-21T12:00:00Z"), endsAt: at("2026-10-21T13:00:00Z") },
    ];
    const conflicts = findConflicts([a], existing);
    expect(conflicts.map((c) => c.existing.id)).toEqual(["y"]);
  });
});
