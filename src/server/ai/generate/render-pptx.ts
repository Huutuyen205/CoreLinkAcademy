// Khuôn mẫu PowerPoint cố định (16:9, màu + logo thương hiệu): AI chỉ cung cấp tiêu đề/ý chính từng slide.
// Chữ được tính kích cỡ theo độ dài và tự tách sang slide "(tiếp)" khi quá nhiều, để không tràn khung.
// Hình minh họa (DECISION-D43) vẽ thành PNG 2× rồi đặt bên phải danh sách ý (hoặc giữa slide nếu slide chỉ có hình).
import PptxGenJS from "pptxgenjs";
import { figureToPng, type Png } from "@/server/figures/render";
import { LOGO_DATA } from "./brand-logo";
import type { DocMeta } from "./render-docx";
import type { SlideDeck } from "./schemas";
import { BODY, bulletHeight, containRect, coverSize, figureFrame, fitSize, GAP, layoutDeck, paginate, SLIDE_H, SLIDE_W, titleSize } from "./slide-layout";

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

const W = SLIDE_W;
const H = SLIDE_H;

// Giữ đường dẫn import cũ của test/bố cục.
export { bulletHeight, BODY, fitSize, paginate };

export async function renderSlidesPptx(deck: SlideDeck, meta: DocMeta): Promise<Uint8Array<ArrayBuffer>> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10 × 5,625 inch
  pptx.title = deck.title;
  pptx.company = "Core Link Academy";
  pptx.author = "Core Link Academy";
  const footer = `Core Link Academy · ${meta.classCode} · Buổi ${meta.sessionIndex}`;
  // Vẽ trước mọi hình; hình nào vẽ không được thì slide vẫn có chữ.
  const pngs = new Map<number, Png>();
  deck.slides.forEach((s, i) => {
    const png = s.figure ? figureToPng(s.figure) : null;
    if (png) pngs.set(i, png);
  });

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

  for (const slide of layoutDeck(deck, meta)) {
    switch (slide.kind) {
      case "cover": {
        const cover = pptx.addSlide();
        cover.background = { color: BRAND };
        cover.addShape(pptx.ShapeType.ellipse, { x: 6.3, y: -1.6, w: 5.6, h: 5.6, fill: { color: ACCENT, transparency: 72 }, line: { color: ACCENT, transparency: 100 } });
        cover.addShape(pptx.ShapeType.ellipse, { x: 7.4, y: 2.9, w: 4.6, h: 4.6, fill: { color: BRAND_DARK, transparency: 35 }, line: { color: BRAND_DARK, transparency: 100 } });
        cover.addImage({ data: LOGO_DATA, x: 0.7, y: 0.55, w: 1.15, h: 1.15 });
        cover.addText("CORE LINK ACADEMY", { x: 2.0, y: 0.8, w: 5, h: 0.65, fontSize: 18, bold: true, color: "FFFFFF", fontFace: SERIF, charSpacing: 4, valign: "middle", margin: 0 });
        cover.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.05, w: 0.9, h: 0.07, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
        cover.addText(slide.title, { x: 0.7, y: 2.2, w: 7.2, h: 1.45, fontSize: coverSize(slide.title), bold: true, color: "FFFFFF", fontFace: SERIF, valign: "top", margin: 0, fit: "none" });
        cover.addText(slide.subtitle, { x: 0.7, y: 3.75, w: 7.2, h: 0.45, fontSize: 18, color: SOFT, fontFace: SANS, valign: "middle", margin: 0 });
        cover.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 4.4, w: 4.6, h: 0.5, rectRadius: 0.25, fill: { color: "FFFFFF", transparency: 85 }, line: { color: "FFFFFF", transparency: 60, width: 0.75 } });
        cover.addText(slide.badge, { x: 0.7, y: 4.4, w: 4.6, h: 0.5, fontSize: 14, color: "FFFFFF", fontFace: SANS, align: "center", valign: "middle", margin: 0 });
        break;
      }
      case "section": {
        const d = pptx.addSlide();
        d.background = { color: BRAND_DARK };
        d.addShape(pptx.ShapeType.ellipse, { x: 6.8, y: 1.2, w: 5.2, h: 5.2, fill: { color: BRAND, transparency: 20 }, line: { color: BRAND, transparency: 100 } });
        d.addText(slide.number, { x: 0.8, y: 1.0, w: 3, h: 1.3, fontSize: 64, bold: true, color: ACCENT, fontFace: SERIF, margin: 0, valign: "middle" });
        d.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.45, w: 0.9, h: 0.07, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
        d.addText(slide.title, { x: 0.8, y: 2.65, w: 7.2, h: 1.5, fontSize: coverSize(slide.title) - 4, bold: true, color: "FFFFFF", fontFace: SERIF, margin: 0, valign: "top" });
        d.addImage({ data: LOGO_DATA, x: W - 1.3, y: H - 1.3, w: 0.8, h: 0.8 });
        if (slide.notes) d.addNotes(slide.notes);
        break;
      }
      case "content": {
        const c = pptx.addSlide({ masterName: "CL_CONTENT" });
        c.addText(slide.title, { x: 1.4, y: 0.12, w: W - 1.9, h: 0.95, fontSize: titleSize(slide.title), bold: true, color: BRAND, fontFace: SERIF, valign: "middle", margin: 0 });
        // Khung nền nhẹ cho danh sách
        c.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.4, w: W - 1.0, h: 3.65, rectRadius: 0.12, fill: { color: PAPER }, line: { color: LINE, width: 0.75 } });
        let y = BODY.y;
        for (const b of slide.bullets) {
          const h = bulletHeight(b, slide.size, slide.textW) - GAP;
          c.addShape(pptx.ShapeType.ellipse, { x: BODY.x - 0.05, y: y + (slide.size * 1.22) / 144 - 0.07, w: 0.14, h: 0.14, fill: { color: ACCENT }, line: { color: ACCENT, transparency: 100 } });
          c.addText(b, { x: BODY.x + 0.3, y, w: slide.textW, h, fontSize: slide.size, color: INK, fontFace: SANS, valign: "top", margin: 0, fit: "none" });
          y += h + GAP;
        }
        const png = slide.figure ? pngs.get(slide.figure.source) : undefined;
        if (slide.figure && png) {
          const frameRect = figureFrame(slide);
          const img = containRect(frameRect.image, png.width, png.height);
          c.addImage({ data: `image/png;base64,${Buffer.from(png.data).toString("base64")}`, ...img });
          if (frameRect.caption) c.addText(slide.figure.caption, { ...frameRect.caption, fontSize: 12, italic: true, color: MUTED, fontFace: SANS, align: "center", valign: "top", margin: 0 });
        }
        if (slide.notes) c.addNotes(slide.notes);
        break;
      }
      case "end": {
        const end = pptx.addSlide();
        end.background = { color: BRAND };
        end.addShape(pptx.ShapeType.ellipse, { x: -1.6, y: 2.6, w: 5.2, h: 5.2, fill: { color: ACCENT, transparency: 75 }, line: { color: ACCENT, transparency: 100 } });
        end.addImage({ data: LOGO_DATA, x: W / 2 - 0.65, y: 1.05, w: 1.3, h: 1.3 });
        end.addText("Cảm ơn các em", { x: 1, y: 2.55, w: W - 2, h: 0.9, fontSize: 38, bold: true, color: "FFFFFF", fontFace: SERIF, align: "center", valign: "middle", margin: 0 });
        end.addText(slide.subtitle, { x: 1, y: 3.5, w: W - 2, h: 0.45, fontSize: 16, color: SOFT, fontFace: SANS, align: "center", valign: "middle", margin: 0 });
        break;
      }
    }
  }

  const out = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  return new Uint8Array(out);
}
