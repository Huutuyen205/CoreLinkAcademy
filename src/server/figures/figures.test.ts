import { describe, expect, it } from "vitest";
import { compileExpr, tryCompileExpr } from "./expr";
import { figureToPng, figureToSvg, figureView } from "./render";
import { parseFigure, type Figure } from "./schema";
import { fmtNum, niceStep, prettyExpr } from "./svg";

describe("đọc biểu thức hàm số (không eval)", () => {
  const at = (src: string, x: number) => compileExpr(src)(x);

  it("phép toán, ưu tiên, nhân ngầm, lũy thừa", () => {
    expect(at("x^2-2x-3", 1)).toBe(-4);
    expect(at("(x+1)(x-1)", 3)).toBe(8);
    expect(at("-x^2", 2)).toBe(-4);
    expect(at("2^-1", 0)).toBe(0.5);
    expect(at("2^3^2", 0)).toBe(512);
    expect(at("3(x+1)", 1)).toBe(6);
    expect(at("1/2x", 4)).toBe(2); // (1/2)·x như máy tính
  });

  it("ký hiệu Unicode và tiền tố y =", () => {
    expect(at("y = x² − 1", 3)).toBe(8);
    expect(at("f(x) = 2·x", 3)).toBe(6);
    expect(at("√(x+1)", 3)).toBe(2);
    expect(at("πx", 1)).toBeCloseTo(Math.PI);
    expect(at("1,5x", 2)).toBe(3);
  });

  it("hàm có sẵn và trị tuyệt đối", () => {
    expect(at("2sin(x)", Math.PI / 2)).toBeCloseTo(2);
    expect(at("sqrt(x)", 9)).toBe(3);
    expect(at("|x-2|", -1)).toBe(3);
    expect(at("2|x|", -3)).toBe(6);
    expect(at("abs(x)+ln(e)", -2)).toBeCloseTo(3);
  });

  it("điểm không xác định trả NaN/Infinity, không ném lỗi", () => {
    expect(at("1/x", 0)).toBe(Infinity);
    expect(at("sqrt(x)", -1)).toBeNaN();
  });

  it("từ chối chuỗi không phải biểu thức (không chạy được mã)", () => {
    for (const bad of ["x +", "alert(1)", "process.exit()", "x;y", "constructor", "x = 1; while(true){}", "(x+1", "", "x".repeat(201)]) {
      expect(tryCompileExpr(bad), bad).toBeNull();
    }
  });
});

const SAMPLES: Record<string, unknown> = {
  function: { type: "function", expr: "x^2-5x+6", xMin: -1, xMax: 6, points: [{ x: 2, y: 0, label: "A" }] },
  functions: { type: "function", expr: ["1/x", "2x+1"] },
  geometry: { type: "geometry", points: { A: [0, 3], B: [0, 0], C: [4, 0] }, segments: ["AB", "BC", "CA"], rightAngles: ["ABC"] },
  pyramid: { type: "geometry", points: { S: [2, 2, 4], A: [0, 0, 0], B: [4, 0, 0], C: [4, 4, 0], D: [0, 4, 0] }, segments: ["SA", "SB", "SC", "SD", "AB", "BC"], dashed: ["AD", "DC"] },
  circle: { type: "geometry", points: { O: [0, 0], A: [2, 0] }, segments: ["OA"], circles: [{ center: "O", radius: 2 }] },
  variation: { type: "variation", x: ["-∞", "-1", "1", "+∞"], signs: ["+", "-", "+"], y: ["-∞", "4", "0", "+∞"] },
  asymptote: { type: "variation", x: ["-∞", "1", "+∞"], signs: ["-", "-"], y: ["2", "-∞|+∞", "2"], breaks: ["1"], fn: "f(x)" },
  numberline: { type: "numberline", intervals: [{ from: 2, to: null, closed: [true, false] }] },
  venn: { type: "venn", sets: ["A", "B", "C"], regions: { a: "1; 2", abc: "5", out: "9" }, universe: "U" },
  formula: { type: "formula", latex: "x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}" },
};

describe("đặc tả hình (parseFigure)", () => {
  it("nhận đủ 6 dạng mẫu", () => {
    for (const [name, raw] of Object.entries(SAMPLES)) expect(parseFigure(raw), name).not.toBeNull();
  });

  it("null ở trục số là vô cực, không bị ép thành 0", () => {
    const f = parseFigure(SAMPLES.numberline) as Extract<Figure, { type: "numberline" }>;
    expect(f.intervals![0]).toMatchObject({ from: 2, to: null });
  });

  it("kết quả parse đưa vào lại vẫn y nguyên (lưu nháp → gửi lại khi lưu)", () => {
    for (const raw of Object.values(SAMPLES)) {
      const once = parseFigure(raw);
      expect(parseFigure(JSON.parse(JSON.stringify(once)))).toEqual(once);
    }
  });

  it("bỏ hình sai khuôn hoặc mâu thuẫn", () => {
    const bad: unknown[] = [
      null,
      "x^2",
      { type: "image", url: "http://x" },
      { type: "function", expr: "alert(1)" },
      { type: "function", expr: "x", xMin: 3, xMax: 1 },
      { type: "geometry", points: { A: [0, 0], B: [1, 1] }, segments: ["AC"] },
      { type: "geometry", points: { A: [0, 0], B: [1, 1, 1] }, segments: ["AB"] },
      { type: "geometry", points: { a: [0, 0] } },
      { type: "variation", x: ["-∞", "1", "+∞"], signs: ["+"], y: ["0", "1", "2"] },
      { type: "variation", x: ["-∞", "+∞"], signs: ["*"], y: ["0", "1"] },
      { type: "numberline" },
      { type: "venn", sets: ["A", "B"], regions: { abc: "1" } },
      { type: "formula", latex: "\\href{javascript:alert(1)}{x}" },
      { type: "formula", latex: "\\def\\x{1}" },
    ];
    for (const raw of bad) expect(parseFigure(raw), JSON.stringify(raw)).toBeNull();
  });
});

describe("vẽ hình", () => {
  it("mọi dạng ra SVG nền trắng, có kích thước, không có thẻ nguy hiểm", () => {
    for (const [name, raw] of Object.entries(SAMPLES)) {
      const d = figureToSvg(parseFigure(raw)!);
      expect(d, name).not.toBeNull();
      expect(d!.svg.startsWith("<svg"), name).toBe(true);
      expect(d!.width).toBeGreaterThan(100);
      expect(d!.height).toBeGreaterThan(40);
      expect(d!.svg).not.toMatch(/<script|<foreignObject|javascript:|currentColor/i);
    }
  });

  it("chữ do AI viết được escape", () => {
    const d = figureToSvg(parseFigure({ type: "venn", sets: ["<b>", "B&"], regions: { a: '"><script>' } })!)!;
    expect(d.svg).toContain("&lt;b&gt;");
    expect(d.svg).toContain("B&amp;");
    expect(d.svg).not.toContain("<script>");
  });

  it("LaTeX sai cú pháp → không vẽ (null), không ném lỗi", () => {
    expect(figureToSvg({ type: "formula", latex: "\\frac{1}{" })).toBeNull();
    expect(figureToSvg({ type: "formula", latex: "\\undefinedmacro x" })).toBeNull();
  });

  it("PNG cho Word/PowerPoint: đúng chữ ký PNG, gấp đôi độ phân giải", () => {
    const f = parseFigure(SAMPLES.geometry)!;
    const png = figureToPng(f)!;
    expect([...png.data.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    // Bề rộng ảnh (byte 16–19 của IHDR) = 2 × bề rộng gốc.
    const width = new DataView(png.data.buffer, png.data.byteOffset).getUint32(16);
    expect(width).toBe(png.width * 2);
  });

  it("figureView: dữ liệu CSDL hỏng/trống → null; hợp lệ → SVG + chú thích", () => {
    expect(figureView(null)).toBeNull();
    expect(figureView({ type: "nope" })).toBeNull();
    const v = figureView({ ...(SAMPLES.formula as object), caption: "Công thức nghiệm" })!;
    expect(v.caption).toBe("Công thức nghiệm");
    expect(v.svg).toContain("<svg");
  });
});

describe("tiện ích hiển thị", () => {
  it("prettyExpr, fmtNum, niceStep", () => {
    expect(prettyExpr("x^2 - 2*x + 1")).toBe("x² − 2·x + 1");
    expect(prettyExpr("sqrt(x)+pi")).toBe("√(x)+π");
    expect(fmtNum(-2.5)).toBe("−2,5");
    expect(niceStep(10, 8)).toBe(2);
    expect(niceStep(0.7, 8)).toBe(0.1);
  });
});
