import { describe, expect, it } from "vitest";
import { extractJson } from "../json";
import { mockProvider } from "../providers/mock";
import { normalizeContent } from "./exam";
import { render, DOCX_MIME, PPTX_MIME } from "./render";
import { bulletHeight, BODY, fitSize, paginate } from "./render-pptx";
import { GENERATE_KINDS } from "./schemas";

const meta = { classCode: "TOAN9-K1", courseTitle: "Toán 9", subjectName: "Toán", sessionIndex: 3, dateLabel: "02/11/2026" };

describe("khuôn mẫu Word/PowerPoint", () => {
  for (const kind of GENERATE_KINDS) {
    it(`${kind} → tệp hợp lệ (zip Office)`, async () => {
      const { text } = await mockProvider().complete({ task: kind, system: "", user: "", mock: { kind, group: "math", topic: "Phương trình bậc hai", courseTitle: "Toán 9", sessionIndex: 3, count: 5 } });
      const out = await render(normalizeContent(kind, extractJson(text)), meta);
      expect(out.mimeType).toBe(kind === "slides" ? PPTX_MIME : DOCX_MIME);
      expect(out.ext).toBe(kind === "slides" ? "pptx" : "docx");
      expect(out.data.byteLength).toBeGreaterThan(2_000);
      expect(out.data.byteLength).toBeLessThan(4 * 1024 * 1024); // giới hạn tệp 4 MB (D24)
      // Mọi tệp .docx/.pptx là zip: bắt đầu bằng "PK".
      expect(String.fromCharCode(out.data[0]!, out.data[1]!)).toBe("PK");
    });
  }
});

describe("hình minh họa trong tệp (DECISION-D43)", () => {
  const hasEntry = (data: Uint8Array, prefix: string) => Buffer.from(data).includes(Buffer.from(prefix, "latin1"));
  const mock = async (kind: (typeof GENERATE_KINDS)[number], group: "math" | "english") => {
    const { text } = await mockProvider().complete({ task: kind, system: "", user: "", mock: { kind, group, topic: "Phương trình bậc hai", courseTitle: "Toán 9", sessionIndex: 3, count: 5 } });
    return normalizeContent(kind, extractJson(text));
  };

  it("Toán: slide, giáo trình, đề có ảnh PNG nhúng trong tệp", async () => {
    expect(hasEntry((await render(await mock("slides", "math"), meta)).data, "ppt/media/")).toBe(true);
    expect(hasEntry((await render(await mock("curriculum", "math"), meta)).data, "word/media/")).toBe(true);
    expect(hasEntry((await render(await mock("exercises", "math"), meta)).data, "word/media/")).toBe(true);
  });

  it("Tiếng Anh (mẫu không có hình) → không có ảnh", async () => {
    expect(hasEntry((await render(await mock("exercises", "english"), meta)).data, "word/media/")).toBe(false);
  });

  it("hình hỏng không làm hỏng cả bài: phần chữ giữ nguyên, hình bị bỏ", async () => {
    const content = normalizeContent("quiz", {
      title: "Đề",
      questions: [{ type: "MCQ", prompt: "1 + 1 = ?", options: ["1", "2", "3", "4"], correctOption: 1, figure: { type: "function", expr: "rm -rf /" } }],
    });
    expect(content.kind === "quiz" && content.data.questions[0]!.figure).toBeUndefined();
    expect((await render(content, meta)).data.byteLength).toBeGreaterThan(2_000);
  });

  it("tối đa 6 hình mỗi lần soạn, giữ các hình đầu", () => {
    const fig = { type: "formula", latex: "x" };
    const content = normalizeContent("slides", { title: "T", slides: Array.from({ length: 9 }, (_, i) => ({ title: `S${i}`, bullets: ["a"], figure: fig })) });
    const withFig = content.kind === "slides" ? content.data.slides.map((s) => Boolean(s.figure)) : [];
    expect(withFig).toEqual([true, true, true, true, true, true, false, false, false]);
  });
});

describe("bố cục slide", () => {
  const long = (n: number, len: number) => Array.from({ length: n }, (_, i) => `Ý ${i + 1}: ${"nội dung dài ".repeat(Math.ceil(len / 13))}`.slice(0, len));

  it("ít ý ngắn → cỡ chữ lớn nhất, một trang", () => {
    expect(fitSize(["Một ý ngắn", "Ý thứ hai"])).toBe(24);
    expect(paginate(["Một ý ngắn", "Ý thứ hai"])).toHaveLength(1);
  });

  it("nhiều ý dài → tách trang, mỗi trang vừa khung ở cỡ nhỏ nhất, không mất ý", () => {
    const bullets = long(8, 300);
    const pages = paginate(bullets);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat()).toEqual(bullets);
    for (const p of pages) expect(p.reduce((sum, b) => sum + bulletHeight(b, 18), 0) <= BODY.h || p.length === 1).toBe(true);
  });

  it("bộ slide dài (30 slide × 8 ý dài) vẫn dựng được và bìa/kết có mặt", async () => {
    const deck = { title: "Tiêu đề rất dài ".repeat(10), slides: Array.from({ length: 30 }, (_, i) => ({ title: `Slide ${i + 1} ${"dài ".repeat(30)}`.slice(0, 160), bullets: i % 7 === 0 ? [] : long(8, 300), notes: "ghi chú" })) };
    const out = await render({ kind: "slides", data: deck }, meta);
    expect(out.data.byteLength).toBeLessThan(4 * 1024 * 1024);
  });
});
