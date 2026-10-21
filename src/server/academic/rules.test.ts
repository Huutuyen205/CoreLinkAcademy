import { describe, expect, it } from "vitest";
import { canChangeClass, canChangeEnrollment, checkEnrollment } from "./rules";

describe("ghi danh", () => {
  const base = { classStatus: "OPEN" as const, seatCount: 3, capacity: 10, existingStatus: null };

  it("TC-016 đủ sĩ số → CLASS_FULL", () => {
    expect(checkEnrollment({ ...base, seatCount: 10 })).toBe("CLASS_FULL");
    expect(checkEnrollment({ ...base, seatCount: 9 })).toBeNull();
  });

  it("TC-017 lớp COMPLETED/CANCELLED → CLASS_CLOSED", () => {
    expect(checkEnrollment({ ...base, classStatus: "COMPLETED" })).toBe("CLASS_CLOSED");
    expect(checkEnrollment({ ...base, classStatus: "CANCELLED" })).toBe("CLASS_CLOSED");
    expect(checkEnrollment({ ...base, classStatus: "IN_PROGRESS" })).toBeNull();
  });

  it("đã ghi danh → ALREADY_ENROLLED; đã DROPPED thì ghi danh lại được", () => {
    expect(checkEnrollment({ ...base, existingStatus: "ACTIVE" })).toBe("ALREADY_ENROLLED");
    expect(checkEnrollment({ ...base, existingStatus: "PAUSED" })).toBe("ALREADY_ENROLLED");
    expect(checkEnrollment({ ...base, existingStatus: "DROPPED" })).toBeNull();
  });

  it("TC-044 học sinh bị khóa → STUDENT_DISABLED, sau các kiểm tra của lớp", () => {
    expect(checkEnrollment({ ...base, studentActive: false })).toBe("STUDENT_DISABLED");
    expect(checkEnrollment({ ...base, studentActive: true })).toBeNull();
    expect(checkEnrollment({ ...base, seatCount: 10, studentActive: false })).toBe("CLASS_FULL");
  });

  it("TC-018 chuyển trạng thái ghi danh", () => {
    expect(canChangeEnrollment("ACTIVE", "PAUSED")).toBe(true);
    expect(canChangeEnrollment("PAUSED", "ACTIVE")).toBe(true);
    expect(canChangeEnrollment("PAUSED", "DROPPED")).toBe(true);
    expect(canChangeEnrollment("ACTIVE", "COMPLETED")).toBe(true);
    expect(canChangeEnrollment("PAUSED", "COMPLETED")).toBe(false);
    expect(canChangeEnrollment("DROPPED", "ACTIVE")).toBe(false);
    expect(canChangeEnrollment("COMPLETED", "ACTIVE")).toBe(false);
  });

  it("chuyển trạng thái lớp", () => {
    expect(canChangeClass("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canChangeClass("IN_PROGRESS", "OPEN")).toBe(false);
    expect(canChangeClass("COMPLETED", "CANCELLED")).toBe(false);
  });
});
