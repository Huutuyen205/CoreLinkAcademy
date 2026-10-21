import { describe, expect, it } from "vitest";
import { checkPasswordStrength } from "@/server/auth/rules";
import { formatStudentCode, generateTempPassword, nextSeqFrom } from "./credentials";

describe("mã học sinh BR-007", () => {
  it("định dạng HS + năm 2 số + 4 số", () => {
    expect(formatStudentCode(2026, 1)).toBe("HS260001");
    expect(formatStudentCode(2030, 123)).toBe("HS300123");
  });

  it("tăng dần từ mã lớn nhất", () => {
    expect(nextSeqFrom(null)).toBe(1);
    expect(nextSeqFrom("HS260041")).toBe(42);
  });
});

describe("mật khẩu tạm", () => {
  it("luôn đạt BR-006 và khác nhau mỗi lần", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const p = generateTempPassword();
      expect(p).toHaveLength(10);
      expect(checkPasswordStrength(p)).toBeNull();
      seen.add(p);
    }
    expect(seen.size).toBe(200);
  });
});
