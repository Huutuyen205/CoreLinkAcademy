import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/server/errors";
import { assertCan, can, canChangeRoleOrStatus, canCreateUserWithRole, HOME_BY_ROLE } from "./policy";

describe("policy theo vai trò", () => {
  it("TC-036 STAFF không quản lý người dùng/vai trò và không xem audit", () => {
    expect(can("STAFF", "user.manage")).toBe(false);
    expect(can("STAFF", "audit.read")).toBe(false);
    expect(can("ADMIN", "audit.read")).toBe(true);
    expect(() => assertCan({ role: "STAFF" }, "audit.read")).toThrow(ForbiddenError);
  });

  it("TC-036 STAFF chỉ tạo được học sinh/phụ huynh", () => {
    expect(canCreateUserWithRole("STAFF", "STUDENT")).toBe(true);
    expect(canCreateUserWithRole("STAFF", "PARENT")).toBe(true);
    expect(canCreateUserWithRole("STAFF", "TEACHER")).toBe(false);
    expect(canCreateUserWithRole("STAFF", "ADMIN")).toBe(false);
    expect(canCreateUserWithRole("ADMIN", "TEACHER")).toBe(true);
    expect(canCreateUserWithRole("TEACHER", "STUDENT")).toBe(false);
  });

  it("TC-038 Admin không tự khóa/đổi vai trò của chính mình", () => {
    const admin = { id: "a1", role: "ADMIN" as const };
    expect(canChangeRoleOrStatus(admin, "a1")).toBe(false);
    expect(canChangeRoleOrStatus(admin, "u2")).toBe(true);
    expect(canChangeRoleOrStatus({ id: "s1", role: "STAFF" }, "u2")).toBe(false);
  });

  it("vai trò học tập không có quyền quản trị", () => {
    for (const role of ["TEACHER", "STUDENT", "PARENT"] as const) {
      expect(can(role, "lead.manage")).toBe(false);
      expect(can(role, "class.manage")).toBe(false);
    }
    expect(can("TEACHER", "assignment.author")).toBe(true);
    expect(can("STAFF", "assignment.author")).toBe(false);
  });

  it("mỗi vai trò có trang chủ riêng", () => {
    expect(HOME_BY_ROLE.STAFF).toBe("/quan-ly");
    expect(HOME_BY_ROLE.PARENT).toBe("/phu-huynh");
  });
});
