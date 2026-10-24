import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/server/errors";
import { ACTIVE_ROLES, assertCan, can, canChangeRoleOrStatus, canCreateUserWithRole, HOME_BY_ROLE } from "./policy";

describe("policy theo vai trò", () => {
  it("DECISION-D35: vai trò giáo vụ (STAFF) đã bỏ — không còn quyền nào", () => {
    for (const p of ["user.manage", "audit.read", "lead.manage", "class.manage", "attendance.override", "report.view", "document.manage", "practice.author"] as const) {
      expect(can("STAFF", p)).toBe(false);
    }
    expect(can("ADMIN", "audit.read")).toBe(true);
    expect(can("ADMIN", "lead.manage")).toBe(true);
    expect(() => assertCan({ role: "STAFF" }, "class.manage")).toThrow(ForbiddenError);
  });

  it("chỉ Admin tạo tài khoản; không tạo được vai trò giáo vụ", () => {
    expect(canCreateUserWithRole("ADMIN", "TEACHER")).toBe(true);
    expect(canCreateUserWithRole("ADMIN", "STUDENT")).toBe(true);
    expect(canCreateUserWithRole("ADMIN", "STAFF")).toBe(false);
    expect(canCreateUserWithRole("STAFF", "STUDENT")).toBe(false);
    expect(canCreateUserWithRole("TEACHER", "STUDENT")).toBe(false);
    expect(ACTIVE_ROLES).not.toContain("STAFF");
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
    expect(HOME_BY_ROLE.ADMIN).toBe("/quan-ly");
    expect(HOME_BY_ROLE.STAFF).toBe("/dang-nhap");
    expect(HOME_BY_ROLE.PARENT).toBe("/phu-huynh");
  });
});
