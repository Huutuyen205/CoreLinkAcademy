// Bảng biến thiên kiểu sách giáo khoa: dòng x, dòng dấu y' (có số 0 tại điểm tới hạn, || tại điểm không xác định),
// dòng y với giá trị đặt cao/thấp theo chiều biến thiên và mũi tên nối.
import type { VariationFigure } from "../schema";
import { arrowHead, frame, INK, line, MUTED, text, textWidth, type Drawn } from "../svg";

const LABEL_W = 64;
const STEP = 116;
const SIDE = 40;
const ROW_X = 38;
const ROW_D = 38;
const ROW_Y = 104;
const SIZE = 17;

type Level = "top" | "mid" | "bottom";

/** Giá trị "-∞|+∞" tại điểm không xác định → [trái, phải]. */
const sides = (v: string): [string, string] => {
  const [a, b] = v.split("|");
  return [a!.trim(), (b ?? a)!.trim()];
};

const pretty = (s: string) => s.replace(/-/g, "−").replace(/\binf(inity)?\b/gi, "∞");

/** Mức đặt giá trị: đi lên (+) thì đầu khoảng ở dưới, cuối khoảng ở trên. */
const levelFromIncoming = (s: "+" | "-"): Level => (s === "+" ? "top" : "bottom");
const levelFromOutgoing = (s: "+" | "-"): Level => (s === "+" ? "bottom" : "top");

export function drawVariation(f: VariationFigure): Drawn {
  const n = f.x.length;
  const width = LABEL_W + SIDE * 2 + STEP * (n - 1);
  const height = ROW_X + ROW_D + ROW_Y;
  const px = (i: number) => LABEL_W + SIDE + STEP * i;
  const breaks = new Set(f.breaks ?? []);
  const fnName = f.fn?.trim() || "y";
  const dName = /^[a-z]\(/i.test(fnName) ? fnName.replace(/^([a-z])/i, "$1'") : `${fnName}'`;

  const out: string[] = [];
  // Khung
  out.push(`<rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(line(1, ROW_X, width - 1, ROW_X, { width: 1.2, cap: "butt" }), line(1, ROW_X + ROW_D, width - 1, ROW_X + ROW_D, { width: 1.2, cap: "butt" }));
  out.push(line(LABEL_W, 1, LABEL_W, height - 1, { width: 1.2, cap: "butt" }));
  out.push(text(LABEL_W / 2, ROW_X / 2, "x", { italic: true, size: SIZE }));
  out.push(text(LABEL_W / 2, ROW_X + ROW_D / 2, dName, { italic: true, size: SIZE }));
  out.push(text(LABEL_W / 2, ROW_X + ROW_D + ROW_Y / 2, fnName, { italic: true, size: SIZE }));

  // Dòng x
  f.x.forEach((v, i) => out.push(text(px(i), ROW_X / 2, pretty(v), { size: SIZE })));

  // Dòng y': dấu giữa hai mốc; 0 hoặc || tại mốc bên trong.
  const dMid = ROW_X + ROW_D / 2;
  f.signs.forEach((s, i) => out.push(text((px(i) + px(i + 1)) / 2, dMid, s === "-" ? "−" : "+", { size: SIZE + 2 })));
  for (let i = 1; i < n - 1; i++) {
    if (breaks.has(f.x[i]!)) {
      for (const dx of [-2.5, 2.5]) out.push(line(px(i) + dx, ROW_X, px(i) + dx, height - 1, { width: 1.2, cap: "butt" }));
    } else {
      out.push(text(px(i), dMid, "0", { size: SIZE }));
    }
  }

  // Dòng y
  const top = ROW_X + ROW_D;
  const yOf = (l: Level) => (l === "top" ? top + 18 : l === "bottom" ? top + ROW_Y - 18 : top + ROW_Y / 2);
  type Slot = { x: number; level: Level; text: string; anchor: "middle" | "start" | "end" };
  // Mỗi mốc có "đầu vào" (cuối khoảng trước) và "đầu ra" (đầu khoảng sau); thường là cùng một giá trị.
  const incoming: (Slot | null)[] = [];
  const outgoing: (Slot | null)[] = [];
  f.x.forEach((xv, i) => {
    const inS = i > 0 ? f.signs[i - 1]! : null;
    const outS = i < n - 1 ? f.signs[i]! : null;
    if (breaks.has(xv)) {
      const [l, rgt] = sides(f.y[i]!);
      incoming.push(inS ? { x: px(i) - 9, level: levelFromIncoming(inS), text: pretty(l), anchor: "end" } : null);
      outgoing.push(outS ? { x: px(i) + 9, level: levelFromOutgoing(outS), text: pretty(rgt), anchor: "start" } : null);
      return;
    }
    let level: Level;
    if (inS && outS) level = inS === outS ? "mid" : inS === "+" ? "top" : "bottom";
    else level = inS ? levelFromIncoming(inS) : levelFromOutgoing(outS!);
    const slot: Slot = { x: px(i), level, text: pretty(f.y[i]!), anchor: "middle" };
    incoming.push(slot);
    outgoing.push(slot);
  });
  const drawn = new Set<Slot>();
  for (const s of [...incoming, ...outgoing]) {
    if (!s || drawn.has(s)) continue;
    drawn.add(s);
    out.push(text(s.x, yOf(s.level), s.text, { size: SIZE, anchor: s.anchor }));
  }

  // Mũi tên từ giá trị đầu khoảng tới giá trị cuối khoảng, chừa chỗ cho chữ.
  const halfW = (s: Slot) => (s.anchor === "middle" ? textWidth(s.text, SIZE) / 2 : s.anchor === "start" ? textWidth(s.text, SIZE) : 0) + 6;
  for (let i = 0; i < n - 1; i++) {
    const a = outgoing[i]!;
    const b = incoming[i + 1]!;
    // Đầu ra luôn canh giữa hoặc canh trái (sau ||); đầu vào canh giữa hoặc canh phải (trước ||).
    const x1 = a.x + halfW(a);
    const x2 = b.x - (b.anchor === "end" ? textWidth(b.text, SIZE) + 6 : halfW(b));
    const y1 = yOf(a.level) + (a.level === "top" ? 8 : a.level === "bottom" ? -10 : 0);
    const y2 = yOf(b.level) + (b.level === "top" ? 8 : b.level === "bottom" ? -10 : 0);
    if (x2 - x1 < 12) continue;
    out.push(line(x1, y1, x2, y2, { stroke: MUTED, width: 1.5 }), arrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1), 9, MUTED));
  }

  return frame(width, height, out.join(""));
}
