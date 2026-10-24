// LaTeX → SVG bằng MathJax (chỉ phía server). Chỉ nạp gói `base` + `ams`: không có \href, \class, \style, \require…
// Ký tự vẽ thành đường cong (path) nên không cần font khi xuất PNG. Lỗi cú pháp → ném lỗi để hình bị bỏ.
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import "mathjax-full/js/input/tex/base/BaseConfiguration.js";
import "mathjax-full/js/input/tex/ams/AmsConfiguration.js";
import { INK } from "./svg";

type Engine = { convert: (tex: string) => string };

let engine: Engine | null = null;

function getEngine(): Engine {
  if (engine) return engine;
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const input = new TeX({
    packages: ["base", "ams"],
    formatError: (_jax: unknown, err: Error) => {
      throw err;
    },
  });
  const output = new SVG({ fontCache: "none" });
  const doc = mathjax.document("", { InputJax: input, OutputJax: output });
  engine = { convert: (tex) => adaptor.innerHTML(doc.convert(tex, { display: true }) as never) };
  return engine;
}

export type TexSvg = { svg: string; width: number; height: number };

/**
 * Chuyển một công thức thành thẻ <svg> lồng được vào hình khác, kích thước tính theo `fontPx` (1 em = fontPx).
 * Trả `svg` có sẵn width/height (px) và màu mực cố định (không dùng currentColor để PNG và web giống nhau).
 */
export function texToSvg(tex: string, fontPx: number): TexSvg {
  const raw = getEngine().convert(tex);
  if (/<(script|foreignObject|a|image|use)\b/i.test(raw) || /javascript:/i.test(raw)) throw new Error("Kết quả MathJax có thẻ không được phép");
  if (/data-mjx-error|merror/.test(raw)) throw new Error("Công thức lỗi");
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(raw);
  if (!vb) throw new Error("Không đọc được kích thước công thức");
  const width = (Number(vb[3]) / 1000) * fontPx;
  const height = (Number(vb[4]) / 1000) * fontPx;
  const svg = raw
    .replace(/^<svg[^>]*?>/, (open) =>
      open
        .replace(/\sstyle="[^"]*"/, "")
        .replace(/\swidth="[^"]*"/, ` width="${width.toFixed(2)}"`)
        .replace(/\sheight="[^"]*"/, ` height="${height.toFixed(2)}"`),
    )
    .replace(/currentColor/g, INK);
  return { svg, width, height };
}

/** Đặt công thức tại (x, y) (góc trên trái) bên trong một hình khác. */
export const placeTex = (t: TexSvg, x: number, y: number) => t.svg.replace(/^<svg/, `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}"`);
