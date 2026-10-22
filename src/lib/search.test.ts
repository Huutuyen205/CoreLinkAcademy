import { describe, expect, it } from "vitest";
import { foldVietnamese, slugify } from "./search";

describe("foldVietnamese", () => {
  it("bỏ dấu, đ → d, chữ thường", () => {
    expect(foldVietnamese("  Nguyễn Văn ĐỨC ")).toBe("nguyen van duc");
    expect(foldVietnamese("Trần Thị Hằng · 0912 345 678")).toBe("tran thi hang · 0912 345 678");
  });
});

describe("slugify", () => {
  it("tạo slug từ tên tiếng Việt", () => {
    expect(slugify("Toán 9 – Ôn thi vào 10")).toBe("toan-9-on-thi-vao-10");
    expect(slugify("  Ngữ văn  ")).toBe("ngu-van");
    expect(slugify("Tiếng Anh: Đọc & Viết!!")).toBe("tieng-anh-doc-viet");
  });
});
