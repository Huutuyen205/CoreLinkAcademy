import { describe, expect, it } from "vitest";
import { afterFailedLogin, checkPasswordStrength, isLocked, parseIdentifier } from "./rules";

const now = new Date("2026-10-21T03:00:00.000Z");

describe("khóa đăng nhập", () => {
  it("TC-010 sai 4 lần chỉ tăng bộ đếm, lần thứ 5 khóa 15 phút", () => {
    let state = { failedLoginCount: 0, lockedUntil: null as Date | null };
    for (let i = 0; i < 4; i++) {
      state = afterFailedLogin(state.failedLoginCount, now);
      expect(state.lockedUntil).toBeNull();
    }
    expect(state.failedLoginCount).toBe(4);
    state = afterFailedLogin(state.failedLoginCount, now);
    expect(state.lockedUntil?.toISOString()).toBe("2026-10-21T03:15:00.000Z");
    expect(state.failedLoginCount).toBe(0);
  });

  it("TC-010 còn khóa trong 15 phút, hết khóa sau đó", () => {
    const lockedUntil = new Date("2026-10-21T03:15:00.000Z");
    expect(isLocked(lockedUntil, new Date("2026-10-21T03:14:59.000Z"))).toBe(true);
    expect(isLocked(lockedUntil, new Date("2026-10-21T03:15:00.000Z"))).toBe(false);
    expect(isLocked(null, now)).toBe(false);
  });
});

describe("độ mạnh mật khẩu", () => {
  it("TC-011 từ chối mật khẩu yếu", () => {
    expect(checkPasswordStrength("abc123")).not.toBeNull();
    expect(checkPasswordStrength("abcdefgh")).not.toBeNull();
    expect(checkPasswordStrength("12345678")).not.toBeNull();
  });

  it("TC-011 chấp nhận mật khẩu đủ chữ và số", () => {
    expect(checkPasswordStrength("hocvien2026")).toBeNull();
    expect(checkPasswordStrength("Họcviên2026")).toBeNull();
  });
});

describe("parseIdentifier", () => {
  it("nhận diện email và SĐT", () => {
    expect(parseIdentifier("  Admin@Demo.CoreLink.vn ")).toEqual({ kind: "email", value: "admin@demo.corelink.vn" });
    expect(parseIdentifier("0912 345 678")).toEqual({ kind: "phone", raw: "0912 345 678" });
  });
});
