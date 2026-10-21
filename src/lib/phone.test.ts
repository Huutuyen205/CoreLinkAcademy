import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

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
