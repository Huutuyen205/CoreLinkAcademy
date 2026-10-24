import { describe, expect, it } from "vitest";
import { layoutDeck } from "./slide-layout";

const meta = { classCode: "TOAN9-K1", courseTitle: "Toán 9", subjectName: "Toán", sessionIndex: 3, dateLabel: "24/10/2026" };

describe("dàn trang slide (dùng chung file .pptx và bản xem trước)", () => {
  it("bìa → nội dung/chuyển mục → kết; slide không có ý là trang chuyển mục", () => {
    const out = layoutDeck({ title: "Hệ thức Vi-ét", slides: [{ title: "Phần 1", bullets: [], notes: "n" }, { title: "Định lý", bullets: ["a", "b"], notes: "ghi chú" }] }, meta);
    expect(out.map((s) => s.kind)).toEqual(["cover", "section", "content", "end"]);
    expect(out[1]).toMatchObject({ kind: "section", number: "01" });
    expect(out[2]).toMatchObject({ kind: "content", notes: "ghi chú", size: 24 });
  });

  it("quá nhiều ý thì tách thành slide (tiếp), ghi chú chỉ ở trang đầu", () => {
    const bullets = Array.from({ length: 14 }, (_, i) => `Ý số ${i + 1}: ${"nội dung dài ".repeat(8)}`);
    const out = layoutDeck({ title: "T", slides: [{ title: "Dài", bullets, notes: "ghi chú" }] }, meta);
    const content = out.filter((s) => s.kind === "content");
    expect(content.length).toBeGreaterThan(1);
    expect(content[1]).toMatchObject({ title: "Dài (tiếp)", notes: "" });
    expect(content[0]).toMatchObject({ notes: "ghi chú" });
  });
});
