// Khuôn mẫu PowerPoint cố định (16:9, màu thương hiệu): AI chỉ cung cấp tiêu đề/ý chính từng slide.
import PptxGenJS from "pptxgenjs";
import type { DocMeta } from "./render-docx";
import type { SlideDeck } from "./schemas";

const BRAND = "1F2F98";
const INK = "1B1F3B";
const MUTED = "5B6178";
const SOFT = "E6ECFF";

export async function renderSlidesPptx(deck: SlideDeck, meta: DocMeta): Promise<Uint8Array<ArrayBuffer>> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10 × 5,625 inch
  pptx.title = deck.title;
  pptx.company = "Core Link Academy";

  pptx.defineSlideMaster({
    title: "CL_CONTENT",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: 10, h: 0.95, fill: { color: BRAND } } },
      { rect: { x: 0, y: 0.95, w: 10, h: 0.05, fill: { color: "FF8A3D" } } },
      { text: { text: `Core Link Academy · ${meta.classCode} · Buổi ${meta.sessionIndex}`, options: { x: 0.4, y: 5.25, w: 7, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Calibri" } } },
    ],
    slideNumber: { x: 9.2, y: 5.25, fontSize: 10, color: MUTED },
  });

  // Slide đầu: bìa
  const cover = pptx.addSlide();
  cover.background = { color: BRAND };
  cover.addText(deck.title, { x: 0.7, y: 1.5, w: 8.6, h: 1.6, fontSize: 38, bold: true, color: "FFFFFF", fontFace: "Calibri", valign: "middle", fit: "shrink" });
  cover.addText(`${meta.courseTitle} · ${meta.subjectName}`, { x: 0.7, y: 3.2, w: 8.6, h: 0.5, fontSize: 18, color: SOFT, fontFace: "Calibri" });
  cover.addText(`Lớp ${meta.classCode} · Buổi ${meta.sessionIndex}${meta.dateLabel ? ` · ${meta.dateLabel}` : ""}`, { x: 0.7, y: 3.75, w: 8.6, h: 0.4, fontSize: 14, color: SOFT, fontFace: "Calibri" });

  for (const s of deck.slides) {
    const slide = pptx.addSlide({ masterName: "CL_CONTENT" });
    slide.addText(s.title, { x: 0.4, y: 0.1, w: 9.2, h: 0.75, fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Calibri", valign: "middle", fit: "shrink" });
    if (s.bullets.length > 0) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 0.6, y: 1.25, w: 8.8, h: 3.8, fontSize: 22, color: INK, fontFace: "Calibri", valign: "top", paraSpaceAfter: 10, fit: "shrink" },
      );
    }
    if (s.notes) slide.addNotes(s.notes);
  }

  const out = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  return new Uint8Array(out);
}
