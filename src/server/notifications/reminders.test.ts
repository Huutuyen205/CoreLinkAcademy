import { describe, expect, it } from "vitest";
import { buildReminderLines, reminderTitle } from "./reminders";

describe("nhắc lịch học", () => {
  it("tiêu đề theo ngày (dùng để chống gửi trùng)", () => {
    expect(reminderTitle("2026-10-23")).toBe("Lịch học ngày mai (23/10/2026)");
  });

  it("gom theo người nhận: GV, HS, PH (kèm tên con), giờ VN, không lặp dòng", () => {
    const session = (code: string, startIso: string, students: { id: string; fullName: string; parentIds: string[] }[]) => ({
      startsAt: new Date(startIso),
      endsAt: new Date(new Date(startIso).getTime() + 90 * 60_000),
      teacherId: "gv",
      roomName: "P.101",
      classCode: code,
      courseTitle: "Toán 9",
      students,
    });
    const lines = buildReminderLines([
      session("TOAN9", "2026-10-23T11:00:00Z", [
        { id: "hs1", fullName: "An", parentIds: ["ph1"] },
        { id: "hs2", fullName: "Bình", parentIds: ["ph1"] },
      ]),
      session("TOAN9B", "2026-10-23T13:00:00Z", [{ id: "hs1", fullName: "An", parentIds: ["ph1"] }]),
    ]);
    expect(lines.get("gv")).toEqual(["18:00–19:30 · TOAN9 (Toán 9) · P.101 · 2 học sinh", "20:00–21:30 · TOAN9B (Toán 9) · P.101 · 1 học sinh"]);
    expect(lines.get("hs1")).toHaveLength(2);
    expect(lines.get("ph1")).toEqual([
      "An: 18:00–19:30 · TOAN9 (Toán 9) · P.101",
      "Bình: 18:00–19:30 · TOAN9 (Toán 9) · P.101",
      "An: 20:00–21:30 · TOAN9B (Toán 9) · P.101",
    ]);
  });
});
