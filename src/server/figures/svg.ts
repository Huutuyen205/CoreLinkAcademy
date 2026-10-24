// Tiện ích dựng chuỗi SVG cho bộ vẽ hình. Mọi chữ đều qua `esc` (chữ do AI viết không thể chèn thẻ). Hàm thuần.

export type Drawn = { svg: string; width: number; height: number };

export const INK = "#111827";
export const MUTED = "#4B5563";
export const GRID = "#E5E7EB";
export const AXIS = "#374151";
export const BRAND = "#1C2D95";
export const ACCENT = "#2F6BFF";
export const FILL = "#DCE6FF";
/** Màu các đường cong khi vẽ nhiều hàm trên cùng hệ trục. */
export const CURVES = ["#1D4ED8", "#DC2626", "#059669"];

// Tên font khớp tệp trong ./fonts (dùng khi xuất PNG); trình duyệt tự thay bằng font tương tự.
export const SANS = "DejaVu Sans, Arial, sans-serif";
export const SERIF = "DejaVu Serif, Times New Roman, serif";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Làm tròn tọa độ cho chuỗi SVG gọn. */
export const r = (v: number) => (Math.round(v * 100) / 100).toString();

type TextOpts = { size?: number; anchor?: "start" | "middle" | "end"; italic?: boolean; bold?: boolean; fill?: string; baseline?: "middle" | "alphabetic" | "hanging" };

/** Chữ thường (số, giá trị) — font không chân. Tên điểm/biến dùng `italic: true` (font có chân, nghiêng như sách giáo khoa). */
export function text(x: number, y: number, s: string, o: TextOpts = {}): string {
  const { size = 16, anchor = "middle", italic = false, bold = false, fill = INK, baseline = "middle" } = o;
  // resvg không hỗ trợ dominant-baseline đầy đủ → tự dịch y theo cỡ chữ.
  const dy = baseline === "middle" ? size * 0.35 : baseline === "hanging" ? size * 0.8 : 0;
  const font = italic ? `font-family="${SERIF}" font-style="italic"` : `font-family="${SANS}"`;
  return `<text x="${r(x)}" y="${r(y + dy)}" font-size="${size}" text-anchor="${anchor}" ${font}${bold ? ' font-weight="bold"' : ""} fill="${fill}">${esc(s)}</text>`;
}

type LineOpts = { stroke?: string; width?: number; dash?: string; cap?: "round" | "butt" };

export function line(x1: number, y1: number, x2: number, y2: number, o: LineOpts = {}): string {
  const { stroke = INK, width = 1.5, dash, cap = "round" } = o;
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

export function path(d: string, o: LineOpts & { fill?: string } = {}): string {
  const { stroke = INK, width = 1.5, dash, fill = "none" } = o;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

export function circle(cx: number, cy: number, radius: number, o: { stroke?: string; fill?: string; width?: number; dash?: string } = {}): string {
  const { stroke = INK, fill = "none", width = 1.5, dash } = o;
  return `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(radius)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

/** Đầu mũi tên tại (x, y) theo hướng góc `angle` (radian). */
export function arrowHead(x: number, y: number, angle: number, size = 9, color = INK): string {
  const a1 = angle + Math.PI - 0.42;
  const a2 = angle + Math.PI + 0.42;
  const p = (a: number) => `${r(x + size * Math.cos(a))},${r(y + size * Math.sin(a))}`;
  return `<path d="M${p(a1)} L${r(x)},${r(y)} L${p(a2)} Z" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>`;
}

/** Khung SVG nền trắng (giống hình in trong sách, đọc rõ cả khi trang web ở chế độ tối). */
export function frame(width: number, height: number, body: string): Drawn {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return {
    width: w,
    height: h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>`,
  };
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", n: "ⁿ" };

/** Biểu thức kiểu máy tính → chữ đẹp: x^2 → x², * → ·, sqrt → √, - → −. Chỉ để hiển thị. */
export function prettyExpr(src: string): string {
  return src
    .replace(/\s+/g, " ")
    .replace(/\*\*/g, "^")
    .replace(/\^(?:\((-?[0-9n]+)\)|(-?[0-9n]+))/g, (_m, a: string | undefined, b: string | undefined) => [...(a ?? b ?? "")].map((c) => SUP[c] ?? c).join(""))
    .replace(/\bsqrt\b/g, "√")
    .replace(/\bpi\b/g, "π")
    .replace(/\s*\*\s*/g, "·")
    .replace(/-/g, "−")
    .trim();
}

/** Mã ngắn ổn định theo nội dung (FNV-1a) — đặt id cho clipPath khỏi trùng khi nhiều hình chung một trang. */
export function hashId(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Ước lượng bề rộng chữ (px) để canh chỗ trống — không cần đo font thật. */
export const textWidth = (s: string, size: number) => [...s].length * size * 0.6;

/** Bước chia trục "đẹp" (1, 2, 5 × 10ⁿ) cho khoảng `span` với khoảng `target` vạch. */
export function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Số hiển thị trên trục: bỏ số 0 thừa, dấu trừ chuẩn, dấu phẩy thập phân kiểu Việt Nam. */
export function fmtNum(v: number): string {
  const s = (Math.round(v * 1000) / 1000).toString();
  return s.replace("-", "−").replace(".", ",");
}
