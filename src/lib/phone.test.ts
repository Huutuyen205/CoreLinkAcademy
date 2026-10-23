import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, phoneFragment } from "./phone";

describe("normalizePhone", () => {
  it("TC-001 chuẩn hóa các dạng nhập phổ biến về +84", () => {
    expect(normalizePhone("0912 345 678")).toBe("+84912345678");
    expect(normalizePhone("0912.345.678")).toBe("+84912345678");
    expect(normalizePhone("0912-345-678")).toBe("+84912345678");
    expect(normalizePhone("84912345678")).toBe("+84912345678");
    expect(normalizePhone("+84 912 345 678")).toBe("+84912345678");
  });

  it("TC-001 từ chối số sai định dạng", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("0212345678")).toBeNull(); // đầu số không phải di động
    expect(normalizePhone("09123456789")).toBeNull(); // thừa số
    expect(normalizePhone("091234567")).toBeNull(); // thiếu số
    expect(normalizePhone("0912abc678")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("hiển thị dạng nội địa", () => {
    expect(formatPhone("+84912345678")).toBe("0912 345 678");
  });
});

describe("phoneFragment", () => {
  it("chỉ nhận từ khóa toàn số, bỏ 0/84 đầu", () => {
    expect(phoneFragment("0912 34")).toBe("91234");
    expect(phoneFragment("84912345678")).toBe("912345678");
    expect(phoneFragment("Lớp 9")).toBeNull();
    expect(phoneFragment("kt9ab")).toBeNull();
    expect(phoneFragment("09")).toBeNull();
  });
});
