// Đặc tả hình minh họa (DECISION-D43): AI chỉ mô tả hình bằng JSON ngắn, hệ thống tự vẽ chính xác.
// Không chạy mã do AI sinh. Hình sai khuôn bị BỎ (không làm hỏng cả bài soạn) — `parseFigure` trả null.
// Hàm thuần, không phụ thuộc MathJax/resvg → dùng được cả phía client.
import { z } from "zod";
import { tryCompileExpr } from "./expr";

const caption = z.string().trim().max(160).optional();
const label = z.string().trim().min(1).max(24);
const coord = z.coerce.number().finite().min(-1000).max(1000);

export const FUNCTION_MAX = 3;

const functionFig = z.object({
  type: z.literal("function"),
  /** Một hoặc vài biểu thức theo x, vd. "x^2-2x-3". */
  expr: z.union([z.string().trim().min(1).max(160), z.array(z.string().trim().min(1).max(160)).min(1).max(FUNCTION_MAX)]),
  xMin: coord.optional(),
  xMax: coord.optional(),
  yMin: coord.optional(),
  yMax: coord.optional(),
  /** Điểm cần đánh dấu (đỉnh, giao điểm…). */
  points: z.array(z.object({ x: coord, y: coord, label: label.optional() })).max(8).optional(),
  caption,
});

/** Tên điểm: chữ in hoa (+ số/dấu phẩy trên), vd. A, B1, A', S. */
const pointName = z.string().trim().regex(/^[A-Z][0-9]?'{0,2}$/, "Tên điểm dạng A, B1, A'");
/** Đoạn thẳng "AB", "A'B", "B1C". */
const segmentRef = z.string().trim().max(8);

const geometryFig = z.object({
  type: z.literal("geometry"),
  points: z.record(pointName, z.array(coord).min(2).max(3)),
  segments: z.array(segmentRef).max(40).optional(),
  /** Cạnh khuất / đường phụ (nét đứt). */
  dashed: z.array(segmentRef).max(30).optional(),
  circles: z.array(z.object({ center: pointName, radius: z.coerce.number().positive().max(1000) })).max(4).optional(),
  /** Góc vuông "ABC" = vuông tại B. */
  rightAngles: z.array(z.string().trim().max(10)).max(8).optional(),
  caption,
});

const sign = z.enum(["+", "-"]);
const varValue = z.string().trim().min(1).max(16);

const variationFig = z.object({
  type: z.literal("variation"),
  x: z.array(varValue).min(2).max(7),
  /** Dấu của y' trên từng khoảng (ít hơn `x` đúng 1 phần tử). */
  signs: z.array(z.string().trim().transform((s) => s.replace("−", "-"))).pipe(z.array(sign)),
  /** Giá trị y tại từng x; điểm hàm không xác định ghi "trái|phải", vd. "-∞|+∞". */
  y: z.array(z.string().trim().min(1).max(33)).min(2).max(7),
  /** Các giá trị x hàm không xác định (vẽ hai vạch ||). */
  breaks: z.array(varValue).max(5).optional(),
  fn: z.string().trim().max(8).optional(),
  caption,
});

// null đứng trước: z.coerce.number() biến null thành 0.
const endpoint = z.union([z.null(), coord]);

const numberLineFig = z.object({
  type: z.literal("numberline"),
  /** null = vô cực. `closed` = [lấy đầu trái, lấy đầu phải]. */
  intervals: z.array(z.object({ from: endpoint, to: endpoint, closed: z.tuple([z.boolean(), z.boolean()]).optional() })).max(4).optional(),
  points: z.array(z.object({ x: coord, label: label.optional(), open: z.boolean().optional() })).max(10).optional(),
  min: coord.optional(),
  max: coord.optional(),
  caption,
});

export const VENN_REGIONS = ["a", "b", "c", "ab", "ac", "bc", "abc", "out"] as const;

const vennFig = z.object({
  type: z.literal("venn"),
  sets: z.array(label).min(2).max(3),
  /** Nội dung từng vùng theo vị trí tập: a, b, c (chỉ riêng), ab, ac, bc, abc (giao), out (ngoài). */
  regions: z.record(z.enum(VENN_REGIONS), z.string().trim().max(40)).optional(),
  universe: z.string().trim().max(24).optional(),
  caption,
});

/** Lệnh LaTeX có thể tải tài nguyên/chèn mã — chặn dù MathJax (chỉ gói base + ams) vốn không có. */
const UNSAFE_TEX = /\\(href|url|class|style|cssId|data|html|unicode|require|input|include|def|newcommand|renewcommand|let|csname)\b/i;

const formulaFig = z.object({
  type: z.literal("formula"),
  latex: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .refine((s) => !UNSAFE_TEX.test(s), "Lệnh LaTeX không được phép"),
  caption,
});

export const figureSchema = z.discriminatedUnion("type", [functionFig, geometryFig, variationFig, numberLineFig, vennFig, formulaFig]);
export type Figure = z.infer<typeof figureSchema>;
export type FigureType = Figure["type"];
export type FunctionFigure = z.infer<typeof functionFig>;
export type GeometryFigure = z.infer<typeof geometryFig>;
export type VariationFigure = z.infer<typeof variationFig>;
export type NumberLineFigure = z.infer<typeof numberLineFig>;
export type VennFigure = z.infer<typeof vennFig>;
export type FormulaFigure = z.infer<typeof formulaFig>;

export const FIGURE_TYPE_LABELS: Record<FigureType, string> = {
  function: "Đồ thị hàm số",
  geometry: "Hình học",
  variation: "Bảng biến thiên",
  numberline: "Trục số",
  venn: "Biểu đồ Ven",
  formula: "Công thức",
};

/** Tách "AB", "A'B", "B1C1" thành hai tên điểm. */
export function splitSegment(ref: string): [string, string] | null {
  const m = /^([A-Z][0-9]?'{0,2})([A-Z][0-9]?'{0,2})$/.exec(ref.trim());
  return m ? [m[1]!, m[2]!] : null;
}

/** "ABC" → [A, B, C] (góc tại B). */
export function splitAngle(ref: string): [string, string, string] | null {
  const m = /^([A-Z][0-9]?'{0,2})([A-Z][0-9]?'{0,2})([A-Z][0-9]?'{0,2})$/.exec(ref.trim());
  return m ? [m[1]!, m[2]!, m[3]!] : null;
}

export const exprList = (f: FunctionFigure): string[] => (Array.isArray(f.expr) ? f.expr : [f.expr]);

/** Kiểm tra phần Zod không bắt được: biểu thức đọc được, điểm được nhắc tới có tồn tại, số phần tử bảng khớp nhau. */
function semanticOk(f: Figure): boolean {
  switch (f.type) {
    case "function": {
      if (!exprList(f).every((e) => tryCompileExpr(e) !== null)) return false;
      if (f.xMin !== undefined && f.xMax !== undefined && f.xMax - f.xMin <= 0) return false;
      if (f.yMin !== undefined && f.yMax !== undefined && f.yMax - f.yMin <= 0) return false;
      return true;
    }
    case "geometry": {
      const names = Object.keys(f.points);
      if (names.length < 1 || names.length > 16) return false;
      const dims = new Set(Object.values(f.points).map((p) => p.length));
      if (dims.size !== 1) return false;
      const has = (n: string) => names.includes(n);
      const segs = [...(f.segments ?? []), ...(f.dashed ?? [])];
      if (!segs.every((s) => splitSegment(s)?.every(has))) return false;
      if (!(f.rightAngles ?? []).every((a) => splitAngle(a)?.every(has))) return false;
      return (f.circles ?? []).every((c) => has(c.center));
    }
    case "variation":
      return f.signs.length === f.x.length - 1 && f.y.length === f.x.length && (f.breaks ?? []).every((b) => f.x.slice(1, -1).includes(b));
    case "numberline":
      return (f.intervals?.length ?? 0) + (f.points?.length ?? 0) > 0 && (f.intervals ?? []).every((i) => i.from === null || i.to === null || i.from < i.to);
    case "venn":
      return f.sets.length === 3 || !Object.keys(f.regions ?? {}).some((k) => k.includes("c"));
    case "formula":
      return true;
  }
}

/** Đặc tả hợp lệ → Figure; còn lại → null (hình bị bỏ, phần chữ vẫn dùng được). */
export function parseFigure(raw: unknown): Figure | null {
  const parsed = figureSchema.safeParse(raw);
  if (!parsed.success) return null;
  return semanticOk(parsed.data) ? parsed.data : null;
}

/** Trường `figure` trong khuôn đầu ra AI: không có / sai → undefined, không làm hỏng cả đối tượng. */
export const optionalFigure = z
  .unknown()
  .optional()
  .transform((v) => (v == null ? undefined : (parseFigure(v) ?? undefined)));

/** Số hình tối đa trong một lần soạn (giữ đầu ra ngắn cho gói AI miễn phí). */
export const MAX_FIGURES = 6;
