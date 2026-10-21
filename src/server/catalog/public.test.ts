import { describe, expect, it } from "vitest";
import { asSyllabus, parseCatalogFilter, publishedCourseWhere } from "./public";

describe("lọc danh mục FR-002", () => {
  it("?mon=toan&khoi=9 → chỉ khóa đã xuất bản của Toán có gradeFrom ≤ 9 ≤ gradeTo", () => {
    const where = publishedCourseWhere(parseCatalogFilter({ mon: "toan", khoi: "9" }));
    expect(where).toEqual({
      isPublished: true,
      subject: { slug: "toan" },
      gradeFrom: { lte: 9 },
      gradeTo: { gte: 9 },
    });
  });

  it("giá trị lọc sai bị bỏ qua, vẫn chỉ trả khóa đã xuất bản", () => {
    expect(parseCatalogFilter({ mon: "TOAN'; drop", khoi: "13" })).toEqual({ subjectSlug: undefined, grade: undefined });
    expect(parseCatalogFilter({ mon: ["a", "b"], khoi: "abc" })).toEqual({ subjectSlug: undefined, grade: undefined });
    expect(publishedCourseWhere({})).toEqual({ isPublished: true });
  });

  it("đọc lộ trình JSON an toàn", () => {
    expect(asSyllabus([{ title: "A", detail: "B" }, { x: 1 }, "s", null])).toEqual([{ title: "A", detail: "B" }]);
    expect(asSyllabus(null)).toEqual([]);
  });
});
