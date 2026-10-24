import { describe, expect, it } from "vitest";
import { attendanceRate, checkAttendanceEdit, consecutiveAbsentees, isInAttendanceWindow, planAttendanceWrites } from "./rules";

const session = { startsAt: new Date("2026-10-21T11:00:00Z"), endsAt: new Date("2026-10-21T12:30:00Z") };

describe("khung điểm danh BR-030", () => {
  it("TC-019 đúng biên: mở 30 phút trước, đóng 24 giờ sau giờ kết thúc", () => {
    expect(isInAttendanceWindow(session, new Date("2026-10-21T10:29:59Z"))).toBe(false);
    expect(isInAttendanceWindow(session, new Date("2026-10-21T10:30:00Z"))).toBe(true);
    expect(isInAttendanceWindow(session, new Date("2026-10-22T12:30:00Z"))).toBe(true);
    expect(isInAttendanceWindow(session, new Date("2026-10-22T12:30:01Z"))).toBe(false);
  });
});

describe("quyền ghi điểm danh", () => {
  it("TC-019 giáo viên chỉ ghi trong khung", () => {
    expect(checkAttendanceEdit({ role: "TEACHER", sessionStatus: "SCHEDULED", inWindow: true })).toEqual({ error: null, override: false });
    expect(checkAttendanceEdit({ role: "TEACHER", sessionStatus: "SCHEDULED", inWindow: false, reason: "x" })).toEqual({ error: "OUTSIDE_WINDOW" });
  });

  it("TC-020 Admin ngoài khung thiếu lý do → từ chối; có lý do → override; giáo vụ (đã bỏ) không sửa được", () => {
    expect(checkAttendanceEdit({ role: "ADMIN", sessionStatus: "COMPLETED", inWindow: false, reason: "  " })).toEqual({ error: "REASON_REQUIRED" });
    expect(checkAttendanceEdit({ role: "ADMIN", sessionStatus: "COMPLETED", inWindow: false, reason: "Bổ sung" })).toEqual({ error: null, override: true });
    expect(checkAttendanceEdit({ role: "STAFF", sessionStatus: "COMPLETED", inWindow: true, reason: "x" })).toEqual({ error: "FORBIDDEN" });
    expect(checkAttendanceEdit({ role: "ADMIN", sessionStatus: "SCHEDULED", inWindow: true })).toEqual({ error: null, override: false });
  });

  it("buổi đã hủy không điểm danh; HS/PH không có quyền", () => {
    expect(checkAttendanceEdit({ role: "ADMIN", sessionStatus: "CANCELLED", inWindow: true })).toEqual({ error: "SESSION_CANCELLED" });
    expect(checkAttendanceEdit({ role: "STUDENT", sessionStatus: "SCHEDULED", inWindow: true })).toEqual({ error: "FORBIDDEN" });
  });
});

describe("tỷ lệ chuyên cần BR-032", () => {
  it("TC-021 (có mặt + muộn) / số bản ghi của buổi không hủy", () => {
    expect(
      attendanceRate([
        { status: "PRESENT" },
        { status: "LATE" },
        { status: "ABSENT" },
        { status: "EXCUSED" },
        { status: "ABSENT", sessionCancelled: true },
      ]),
    ).toBe(0.5);
    expect(attendanceRate([])).toBeNull();
  });
});

describe("cảnh báo vắng BR-033", () => {
  it("TC-022 vắng không phép 2 buổi gần nhất liên tiếp", () => {
    const sessions = [
      { cancelled: false, records: [{ studentId: "a", status: "ABSENT" as const }, { studentId: "b", status: "ABSENT" as const }] },
      { cancelled: true, records: [] },
      { cancelled: false, records: [{ studentId: "a", status: "ABSENT" as const }, { studentId: "b", status: "EXCUSED" as const }] },
      { cancelled: false, records: [{ studentId: "b", status: "ABSENT" as const }] },
    ];
    expect(consecutiveAbsentees(sessions)).toEqual(["a"]);
  });

  it("TC-022 chưa đủ 2 buổi thì không cảnh báo", () => {
    expect(consecutiveAbsentees([{ cancelled: false, records: [{ studentId: "a", status: "ABSENT" }] }])).toEqual([]);
  });
});

describe("planAttendanceWrites (ghi điểm danh theo lô)", () => {
  const e = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED", note: string | null = null) => ({ studentId, status, note });

  it("lần đầu điểm danh: tất cả là bản ghi mới, không có updateMany", () => {
    const plan = planAttendanceWrites([e("a", "PRESENT"), e("b", "ABSENT")], []);
    expect(plan.toCreate.map((x) => x.studentId)).toEqual(["a", "b"]);
    expect(plan.updateGroups).toEqual([]);
  });

  it("sửa lại: gộp bản ghi đã có theo (trạng thái, ghi chú) — mỗi nhóm một updateMany", () => {
    const plan = planAttendanceWrites([e("a", "PRESENT"), e("b", "PRESENT"), e("c", "LATE", "kẹt xe"), e("d", "PRESENT")], ["a", "b", "c"]);
    expect(plan.toCreate.map((x) => x.studentId)).toEqual(["d"]);
    expect(plan.updateGroups).toEqual([
      { status: "PRESENT", note: null, attitude: null, studentIds: ["a", "b"] },
      { status: "LATE", note: "kẹt xe", attitude: null, studentIds: ["c"] },
    ]);
  });

  it("thái độ học tập khác nhau → nhóm updateMany khác nhau", () => {
    const plan = planAttendanceWrites(
      [
        { ...e("a", "PRESENT"), attitude: "GOOD" },
        { ...e("b", "PRESENT"), attitude: "GOOD" },
        { ...e("c", "PRESENT"), attitude: "NEEDS_WORK" },
      ],
      ["a", "b", "c"],
    );
    expect(plan.updateGroups).toEqual([
      { status: "PRESENT", note: null, attitude: "GOOD", studentIds: ["a", "b"] },
      { status: "PRESENT", note: null, attitude: "NEEDS_WORK", studentIds: ["c"] },
    ]);
  });

  it("trùng học sinh trong cùng lần gửi: lấy lần cuối như vòng upsert tuần tự", () => {
    const plan = planAttendanceWrites([e("a", "PRESENT"), e("a", "ABSENT")], []);
    expect(plan.toCreate).toEqual([e("a", "ABSENT")]);
  });
});
