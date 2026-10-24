// Khuôn mẫu PowerPoint cố định (16:9, màu + logo thương hiệu): AI chỉ cung cấp tiêu đề/ý chính từng slide.
// Chữ được tính kích cỡ theo độ dài và tự tách sang slide "(tiếp)" khi quá nhiều, để không tràn khung.
import PptxGenJS from "pptxgenjs";
import { LOGO_DATA } from "./brand-logo";
import type { DocMeta } from "./render-docx";
import type { SlideDeck } from "./schemas";

// BRAND trùng màu nền của logo (#1C2D95) để ô logo hòa vào nền xanh.
const BRAND = "1C2D95";
const BRAND_DARK = "121C5E";
const ACCENT = "2F6BFF";
const SOFT = "E6ECFF";
const PAPER = "F5F7FE";
const LINE = "DDE3F0";
const INK = "0E1433";
const MUTED = "4A5274";
const SERIF = "Georgia";
const SANS = "Calibri";

const W = 10;
const H = 5.625;

/** Số ký tự ước tính vừa một dòng (tiếng Việt có dấu rộng hơn chữ Latin thường). */
const charsPerLine = (widthIn: number, fontPt: number) => Math.max(8, Math.floor((widthIn * 72) / (fontPt * 0.54)));
const linesFor = (text: string, widthIn: number, fontPt: number) => Math.max(1, Math.ceil((text.length * 1.06) / charsPerLine(widthIn, fontPt)));
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const BULLET_SIZES = [24, 22, 20, 18];
const GAP = 0.16;
export const BODY = { x: 0.9, y: 1.55, w: 8.2, h: 3.35 };
const BULLET_TEXT_W = BODY.w - 0.45;

export const bulletHeight = (text: string, size: number) => linesFor(text, BULLET_TEXT_W, size) * ((size * 1.22) / 72) + GAP;

/** Cỡ chữ lớn nhất mà cả danh sách vừa khung; null nếu không vừa ở cỡ nhỏ nhất. */
export function fitSize(bullets: string[]): number | null {
  for (const size of BULLET_SIZES) {
    if (bullets.reduce((sum, b) => sum + bulletHeight(b, size), 0) <= BODY.h) return size;
  }
  return null;
}

/** Tách danh sách ý thành các trang, mỗi trang vừa khung ở cỡ chữ nhỏ nhất. */
export function paginate(bullets: string[]): string[][] {
  const min = BULLET_SIZES[BULLET_SIZES.length - 1]!;
  const pages: string[][] = [];
  let cur: string[] = [];
  let used = 0;
  for (const b of bullets) {
    const h = bulletHeight(b, min);
    if (cur.length > 0 && used + h > BODY.h) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(b);
    used += h;
  }
  if (cur.length > 0) pages.push(cur);
  return pages;
}

const titleSize = (t: string) => (t.length <= 30 ? 28 : t.length <= 42 ? 24 : t.length <= 60 ? 21 : 18);
const coverSize = (t: string) => (t.length <= 24 ? 44 : t.length <= 40 ? 36 : t.length <= 70 ? 30 : 24);

export async function renderSlidesPptx(deck: SlideDeck, meta: DocMeta): Promise<Uint8Array<ArrayBuffer>> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10 × 5,625 inch
  pptx.title = deck.title;
  pptx.company = "Core Link Academy";
  pptx.author = "Core Link Academy";
  const footer = `Core Link Academy · ${meta.classCode} · Buổi ${meta.sessionIndex}`;

  // Nội dung: nền trắng, logo + thanh nhận diện ở đầu, chân trang có vạch, tên lớp và số trang.
  pptx.defineSlideMaster({
    title: "CL_CONTENT",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: W, h: 1.15, fill: { color: PAPER } } },
      { rect: { x: 0, y: 1.15, w: W, h: 0.04, fill: { color: BRAND } } },
      { rect: { x: 0, y: 1.15, w: 2.2, h: 0.04, fill: { color: ACCENT } } },
      { image: { x: 0.45, y: 0.22, w: 0.72, h: 0.72, data: LOGO_DATA } },
      { line: { x: 0.45, y: H - 0.42, w: W - 0.9, h: 0, line: { color: LINE, width: 0.75 } } },
      { text: { text: footer, options: { x: 0.45, y: H - 0.38, w: 6.5, h: 0.3, fontSize: 10, color: MUTED, fontFace: SANS, valign: "middle", margin: 0 } } },
    ],
    slideNumber: { x: W - 1.0, y: H - 0.38, w: 0.55, h: 0.3, fontSize: 10, color: MUTED, fontFace: SANS, align: "right" },
  });

  // Bìa
  const cover = pptx.addSlide();
  cover.background = { color: BRAND };
  cover.addShape(pptx.ShapeType.ellipse, { x: 6.3, y: -1.6, w: 5.6, h: 5.6, fill: { color: ACCENT, transparency: 72 }, line: { color: ACCENT, transparency: 100 } });
  cover.addShape(pptx.ShapeType.ellipse, { x: 7.4, y: 2.9, w: 4.6, h: 4.6, fill: { color: BRAND_DARK, transparency: 35 }, line: { color: BRAND_DARK, transparency: 100 } });
  cover.addImage({ data: LOGO_DATA, x: 0.7, y: 0.55, w: 1.15, h: 1.15 });
  cover.addText("CORE LINK ACADEMY", { x: 2.0, y: 0.8, w: 5, h: 0.65, fontSize: 18, bold: true, color: "FFFFFF", fontFace: SERIF, charSpacing: 4, valign: "middle", margin: 0 });
  cover.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.05, w: 0.9, h: 0.07, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
  const coverTitle = clip(deck.title, 110);
  cover.addText(coverTitle, { x: 0.7, y: 2.2, w: 7.2, h: 1.45, fontSize: coverSize(coverTitle), bold: true, color: "FFFFFF", fontFace: SERIF, valign: "top", margin: 0, fit: "none" });
  cover.addText(clip(`${meta.courseTitle} · ${meta.subjectName}`, 80), { x: 0.7, y: 3.75, w: 7.2, h: 0.45, fontSize: 18, color: SOFT, fontFace: SANS, valign: "middle", margin: 0 });
  cover.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 4.4, w: 4.6, h: 0.5, rectRadius: 0.25, fill: { color: "FFFFFF", transparency: 85 }, line: { color: "FFFFFF", transparency: 60, width: 0.75 } });
  cover.addText(`Lớp ${meta.classCode} · Buổi ${meta.sessionIndex}${meta.dateLabel ? ` · ${meta.dateLabel}` : ""}`, { x: 0.7, y: 4.4, w: 4.6, h: 0.5, fontSize: 14, color: "FFFFFF", fontFace: SANS, align: "center", valign: "middle", margin: 0 });

  // Nội dung
  let section = 0;
  for (const s of deck.slides) {
    const title = clip(s.title, 90);
    if (s.bullets.length === 0) {
      // Slide không có ý chính = trang chuyển mục.
      section += 1;
      const d = pptx.addSlide();
      d.background = { color: BRAND_DARK };
      d.addShape(pptx.ShapeType.ellipse, { x: 6.8, y: 1.2, w: 5.2, h: 5.2, fill: { color: BRAND, transparency: 20 }, line: { color: BRAND, transparency: 100 } });
      d.addText(String(section).padStart(2, "0"), { x: 0.8, y: 1.0, w: 3, h: 1.3, fontSize: 64, bold: true, color: ACCENT, fontFace: SERIF, margin: 0, valign: "middle" });
      d.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.45, w: 0.9, h: 0.07, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
      d.addText(title, { x: 0.8, y: 2.65, w: 7.2, h: 1.5, fontSize: coverSize(title) - 4, bold: true, color: "FFFFFF", fontFace: SERIF, margin: 0, valign: "top" });
      d.addImage({ data: LOGO_DATA, x: W - 1.3, y: H - 1.3, w: 0.8, h: 0.8 });
      if (s.notes) d.addNotes(s.notes);
      continue;
    }
    const pages = paginate(s.bullets.map((b) => clip(b, 300)));
    pages.forEach((page, p) => {
      const slide = pptx.addSlide({ masterName: "CL_CONTENT" });
      const heading = p === 0 ? title : `${clip(title, 80)} (tiếp)`;
      slide.addText(heading, { x: 1.4, y: 0.12, w: W - 1.9, h: 0.95, fontSize: titleSize(heading), bold: true, color: BRAND, fontFace: SERIF, valign: "middle", margin: 0 });
      // Khung nền nhẹ cho danh sách
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.4, w: W - 1.0, h: 3.65, rectRadius: 0.12, fill: { color: PAPER }, line: { color: LINE, width: 0.75 } });
      const size = fitSize(page) ?? BULLET_SIZES[BULLET_SIZES.length - 1]!;
      let y = BODY.y;
      for (const b of page) {
        const h = bulletHeight(b, size) - GAP;
        slide.addShape(pptx.ShapeType.ellipse, { x: BODY.x - 0.05, y: y + (size * 1.22) / 144 - 0.07, w: 0.14, h: 0.14, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
        slide.addText(b, { x: BODY.x + 0.3, y, w: BULLET_TEXT_W, h, fontSize: size, color: INK, fontFace: SANS, valign: "top", margin: 0, fit: "none" });
        y += h + GAP;
      }
      if (s.notes && p === 0) slide.addNotes(s.notes);
    });
  }

  // Kết
  const end = pptx.addSlide();
  end.background = { color: BRAND };
  end.addShape(pptx.ShapeType.ellipse, { x: -1.6, y: 2.6, w: 5.2, h: 5.2, fill: { color: ACCENT, transparency: 75 }, line: { color: ACCENT, transparency: 100 } });
  end.addImage({ data: LOGO_DATA, x: W / 2 - 0.65, y: 1.05, w: 1.3, h: 1.3 });
  end.addText("Cảm ơn các em", { x: 1, y: 2.55, w: W - 2, h: 0.9, fontSize: 38, bold: true, color: "FFFFFF", fontFace: SERIF, align: "center", valign: "middle", margin: 0 });
  end.addText(`Lớp ${meta.classCode} · Buổi ${meta.sessionIndex}`, { x: 1, y: 3.5, w: W - 2, h: 0.45, fontSize: 16, color: SOFT, fontFace: SANS, align: "center", valign: "middle", margin: 0 });

  const out = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  return new Uint8Array(out);
}
