import { describe, expect, it } from "vitest";
import { BULLET_TEXT_W, containRect, FIG_TEXT_W, figureFrame, layoutDeck, type LaidOutSlide } from "./slide-layout";

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

describe("slide có hình minh họa (DECISION-D43)", () => {
  const formula = { type: "formula" as const, latex: "a^2+b^2=c^2", caption: "Định lí Pythagore" };

  it("có ý + hình → chữ hẹp bên trái, hình bên phải; chỉ hình → hình giữa slide (không thành trang chuyển mục)", () => {
    const out = layoutDeck({ title: "T", slides: [{ title: "A", bullets: ["một", "hai"], notes: "", figure: formula }, { title: "B", bullets: [], notes: "", figure: formula }] }, meta);
    expect(out.map((s) => s.kind)).toEqual(["cover", "content", "content", "end"]);
    const [side, full] = [out[1], out[2]] as Extract<LaidOutSlide, { kind: "content" }>[];
    expect(side).toMatchObject({ textW: FIG_TEXT_W, figure: { source: 0, caption: "Định lí Pythagore" } });
    expect(full).toMatchObject({ bullets: [], figure: { source: 1 } });
    expect(figureFrame(side!).image.x).toBeGreaterThan(5);
    expect(figureFrame(full!).image.x).toBeLessThan(1);
    expect(figureFrame(side!).caption).not.toBeNull();
  });

  it("ý tràn sang trang (tiếp): hình chỉ ở trang đầu, trang sau dùng lại cả bề rộng", () => {
    const bullets = Array.from({ length: 10 }, (_, i) => `Ý số ${i + 1}: ${"nội dung dài ".repeat(6)}`);
    const content = layoutDeck({ title: "T", slides: [{ title: "Dài", bullets, notes: "", figure: formula }] }, meta).filter((s) => s.kind === "content") as Extract<LaidOutSlide, { kind: "content" }>[];
    expect(content.length).toBeGreaterThan(1);
    expect(content[0]).toMatchObject({ textW: FIG_TEXT_W });
    expect(content[0]!.figure).not.toBeNull();
    expect(content.slice(1).every((s) => s.figure === null && s.textW === BULLET_TEXT_W)).toBe(true);
    expect(content.flatMap((s) => s.bullets)).toEqual(bullets);
  });

  it("containRect giữ tỉ lệ, canh giữa trong khung", () => {
    expect(containRect({ x: 0, y: 0, w: 4, h: 2 }, 100, 100)).toEqual({ x: 1, y: 0, w: 2, h: 2 });
    expect(containRect({ x: 1, y: 1, w: 2, h: 4 }, 200, 100)).toEqual({ x: 1, y: 2.5, w: 2, h: 1 });
  });
});
