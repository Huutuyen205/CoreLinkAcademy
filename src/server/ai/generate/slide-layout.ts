// Bố cục slide dùng chung cho file .pptx và bản xem trước trên trình duyệt: một nguồn duy nhất nên hai bên luôn khớp.
// Hàm thuần, không phụ thuộc pptxgenjs — an toàn để nạp phía client.
import type { SlideDeck } from "./schemas";

export type SlideMeta = { classCode: string; courseTitle: string; subjectName: string; sessionIndex: number; dateLabel: string };

/** Kích thước khung 16:9 tính bằng inch (như PowerPoint). */
export const SLIDE_W = 10;
export const SLIDE_H = 5.625;

/** Số ký tự ước tính vừa một dòng (tiếng Việt có dấu rộng hơn chữ Latin thường). */
const charsPerLine = (widthIn: number, fontPt: number) => Math.max(8, Math.floor((widthIn * 72) / (fontPt * 0.54)));
const linesFor = (text: string, widthIn: number, fontPt: number) => Math.max(1, Math.ceil((text.length * 1.06) / charsPerLine(widthIn, fontPt)));
export const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export const BULLET_SIZES = [24, 22, 20, 18];
export const GAP = 0.16;
export const BODY = { x: 0.9, y: 1.55, w: 8.2, h: 3.35 };
export const BULLET_TEXT_W = BODY.w - 0.45;

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

export const titleSize = (t: string) => (t.length <= 30 ? 28 : t.length <= 42 ? 24 : t.length <= 60 ? 21 : 18);
export const coverSize = (t: string) => (t.length <= 24 ? 44 : t.length <= 40 ? 36 : t.length <= 70 ? 30 : 24);

export type LaidOutSlide =
  | { kind: "cover"; title: string; subtitle: string; badge: string }
  | { kind: "section"; number: string; title: string; notes: string }
  | { kind: "content"; title: string; bullets: string[]; size: number; notes: string }
  | { kind: "end"; subtitle: string };

/** Dàn trang cả bộ slide: bìa → (trang chuyển mục | trang nội dung, tự tách "(tiếp)") → kết. */
export function layoutDeck(deck: SlideDeck, meta: SlideMeta): LaidOutSlide[] {
  const out: LaidOutSlide[] = [
    {
      kind: "cover",
      title: clip(deck.title, 110),
      subtitle: clip(`${meta.courseTitle} · ${meta.subjectName}`, 80),
      badge: `Lớp ${meta.classCode} · Buổi ${meta.sessionIndex}${meta.dateLabel ? ` · ${meta.dateLabel}` : ""}`,
    },
  ];
  let section = 0;
  for (const s of deck.slides) {
    const title = clip(s.title, 90);
    if (s.bullets.length === 0) {
      // Slide không có ý chính = trang chuyển mục.
      section += 1;
      out.push({ kind: "section", number: String(section).padStart(2, "0"), title, notes: s.notes });
      continue;
    }
    paginate(s.bullets.map((b) => clip(b, 300))).forEach((page, p) => {
      out.push({
        kind: "content",
        title: p === 0 ? title : `${clip(title, 80)} (tiếp)`,
        bullets: page,
        size: fitSize(page) ?? BULLET_SIZES[BULLET_SIZES.length - 1]!,
        notes: p === 0 ? s.notes : "",
      });
    });
  }
  out.push({ kind: "end", subtitle: `Lớp ${meta.classCode} · Buổi ${meta.sessionIndex}` });
  return out;
}
