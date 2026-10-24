// Vẽ hình từ đặc tả (DECISION-D43): SVG cho trang web, PNG cho Word/PowerPoint. Chỉ phía server (MathJax, resvg).
// Không bao giờ ném lỗi ra ngoài: hình vẽ không được → null, nơi gọi bỏ hình và giữ phần chữ.
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { drawFormula } from "./draw/formula";
import { drawFunction } from "./draw/function";
import { drawGeometry } from "./draw/geometry";
import { drawNumberLine } from "./draw/numberline";
import { drawVariation } from "./draw/variation";
import { drawVenn } from "./draw/venn";
import { parseFigure, type Figure } from "./schema";
import type { Drawn } from "./svg";

export type { Drawn };

function draw(f: Figure): Drawn {
  switch (f.type) {
    case "function":
      return drawFunction(f);
    case "geometry":
      return drawGeometry(f);
    case "variation":
      return drawVariation(f);
    case "numberline":
      return drawNumberLine(f);
    case "venn":
      return drawVenn(f);
    case "formula":
      return drawFormula(f);
  }
}

export function figureToSvg(f: Figure): Drawn | null {
  try {
    return draw(f);
  } catch (e) {
    // Lỗi của MathJax (TexError) không kế thừa Error nhưng có `message`.
    console.warn("[figures] không vẽ được hình", f.type, String((e as { message?: unknown })?.message ?? e));
    return null;
  }
}

// Font đi kèm mã nguồn (next.config.ts → outputFileTracingIncludes) để PNG giống nhau trên máy dev và Vercel.
const FONT_DIR = path.join(process.cwd(), "src", "server", "figures", "fonts");
const FONT_FILES = [path.join(FONT_DIR, "DejaVuSans.ttf"), path.join(FONT_DIR, "DejaVuSerif-Italic.ttf")];

export type Png = { data: Uint8Array<ArrayBuffer>; width: number; height: number };

/** PNG độ phân giải `scale` lần (mặc định 2× cho slide/Word nét); `width`/`height` là kích thước gốc (px) để giữ tỉ lệ. */
export function figureToPng(f: Figure, scale = 2): Png | null {
  const drawn = figureToSvg(f);
  if (!drawn) return null;
  try {
    const resvg = new Resvg(drawn.svg, {
      fitTo: { mode: "width", value: Math.round(drawn.width * scale) },
      font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "DejaVu Sans" },
      background: "#FFFFFF",
    });
    const png = resvg.render().asPng();
    return { data: new Uint8Array(png), width: drawn.width, height: drawn.height };
  } catch (e) {
    console.warn("[figures] không xuất được PNG", f.type, e instanceof Error ? e.message : e);
    return null;
  }
}

export type FigureView = { svg: string; width: number; height: number; caption: string };

/** Dữ liệu `figure` lưu trong CSDL (JSON) → hình cho trang web; dữ liệu hỏng → null. */
export function figureView(raw: unknown): FigureView | null {
  if (raw == null) return null;
  const f = parseFigure(raw);
  if (!f) return null;
  const drawn = figureToSvg(f);
  return drawn ? { ...drawn, caption: f.caption ?? "" } : null;
}
