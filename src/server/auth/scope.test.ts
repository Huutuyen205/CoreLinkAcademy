import { describe, expect, it } from "vitest";
import { canParentViewStudent, canTeacherAccessClass, isManager } from "./scope";

describe("phạm vi dữ liệu", () => {
  it("TC-034 phụ huynh chỉ xem con đã liên kết", () => {
    expect(canParentViewStudent(["hs1", "hs3"], "hs1")).toBe(true);
    expect(canParentViewStudent(["hs1", "hs3"], "hs2")).toBe(false);
    expect(canParentViewStudent([], "hs1")).toBe(false);
  });

  it("TC-035 giáo viên chỉ truy cập lớp của mình hoặc buổi được phân công", () => {
    expect(canTeacherAccessClass("gvA", { teacherId: "gvA" })).toBe(true);
    expect(canTeacherAccessClass("gvA", { teacherId: "gvB" })).toBe(false);
    expect(canTeacherAccessClass("gvA", { teacherId: "gvB", sessionTeacherIds: ["gvA"] })).toBe(true);
  });

  it("chỉ ADMIN/STAFF là quản lý", () => {
    expect(isManager({ role: "ADMIN" })).toBe(true);
    expect(isManager({ role: "STAFF" })).toBe(true);
    expect(isManager({ role: "TEACHER" })).toBe(false);
  });
});
