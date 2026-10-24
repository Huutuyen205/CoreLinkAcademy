import { describe, expect, it } from "vitest";
import { composeHref } from "./compose-shortcut";

describe("liên kết nút soạn bài AI theo ngữ cảnh", () => {
  it("trang buổi → buổi đó; trang lớp (mọi tab) → lớp đó; nơi khác → trang trống", () => {
    expect(composeHref("/giao-vien/buoi/abc123")).toBe("/giao-vien/soan-bai?buoi=abc123");
    expect(composeHref("/giao-vien/lop/xyz/danh-gia")).toBe("/giao-vien/soan-bai?lop=xyz");
    expect(composeHref("/giao-vien/lop/xyz")).toBe("/giao-vien/soan-bai?lop=xyz");
    expect(composeHref("/giao-vien/lich")).toBe("/giao-vien/soan-bai");
    expect(composeHref("/giao-vien/lop")).toBe("/giao-vien/soan-bai");
  });
});
