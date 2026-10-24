import { describe, expect, it } from "vitest";
import { formatSyllabus, parseSyllabus, readSyllabus, syllabusForSession } from "./syllabus";

describe("lộ trình theo buổi", () => {
  it("mỗi dòng một buổi, tối đa 5 ô; chỉ giữ ô phụ có chữ", () => {
    expect(parseSyllabus("Hệ phương trình | Giải hệ\n\nVi-ét | Định lý | Nắm công thức | Tổng, tích nghiệm | x²-5x+6=0")).toEqual([
      { title: "Hệ phương trình", detail: "Giải hệ" },
      { title: "Vi-ét", detail: "Định lý", objectives: "Nắm công thức", knowledge: "Tổng, tích nghiệm", examples: "x²-5x+6=0" },
    ]);
  });

  it("format là ngược của parse (bỏ ô trống ở cuối)", () => {
    const text = "A | B\nC | D | E |  | G\nH";
    expect(formatSyllabus(parseSyllabus(text))).toBe(text);
  });

  it("đọc JSON an toàn", () => {
    expect(readSyllabus([{ title: "A", detail: "B", objectives: " ", knowledge: "K" }, { x: 1 }, "s", null])).toEqual([{ title: "A", detail: "B", knowledge: "K" }]);
    expect(readSyllabus(null)).toEqual([]);
  });

  it("chỉ ghép mục với buổi khi số mục đúng bằng số buổi", () => {
    const items = [{ title: "1", detail: "" }, { title: "2", detail: "" }];
    expect(syllabusForSession(items, 2, 2)?.title).toBe("2");
    expect(syllabusForSession(items, 2, 3)).toBeNull();
    expect(syllabusForSession(items, 3, 2)).toBeNull();
  });
});
