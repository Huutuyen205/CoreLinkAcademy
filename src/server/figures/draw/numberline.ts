// Trục số: khoảng nghiệm tô đậm, đầu mút dạng ngoặc [ ] (lấy) hoặc ( ) (không lấy), điểm tròn đặc / rỗng.
import type { NumberLineFigure } from "../schema";
import { ACCENT, arrowHead, AXIS, circle, fmtNum, frame, line, niceStep, path, r, text, type Drawn } from "../svg";

const W = 520;
const PAD = 30;
const STACK = 16;

export function drawNumberLine(f: NumberLineFigure): Drawn {
  const intervals = f.intervals ?? [];
  const points = f.points ?? [];
  const specials = [...intervals.flatMap((i) => [i.from, i.to]).filter((v): v is number => v !== null), ...points.map((p) => p.x)];
  let lo = f.min ?? (specials.length ? Math.min(...specials) : -3);
  let hi = f.max ?? (specials.length ? Math.max(...specials) : 3);
  if (f.min === undefined || f.max === undefined) {
    const extra = Math.max(1, (hi - lo) * 0.35);
    if (f.min === undefined) lo -= extra;
    if (f.max === undefined) hi += extra;
  }
  if (hi - lo < 1e-6) {
    lo -= 3;
    hi += 3;
  }
  const levels = Math.max(1, intervals.length);
  const axisY = 34 + STACK * (levels - 1);
  const height = axisY + 44;
  const X = (v: number) => PAD + ((v - lo) / (hi - lo)) * (W - PAD * 2 - 14);
  const left = PAD - 10;
  const right = W - PAD + 6;

  const out: string[] = [];
  out.push(line(left, axisY, right, axisY, { stroke: AXIS, width: 1.5 }), arrowHead(right + 4, axisY, 0, 9, AXIS));
  // Vạch chia không ghi số (tránh rối); số chỉ ghi ở mốc quan trọng và 0.
  const step = niceStep(hi - lo, 10);
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(line(X(v), axisY - 4, X(v), axisY + 4, { stroke: AXIS, width: 1 }));
  const labelled = new Set<number>(specials);
  if (lo < 0 && hi > 0) labelled.add(0);
  for (const v of labelled) out.push(text(X(v), axisY + 22, fmtNum(v), { size: 15 }));

  intervals.forEach((iv, k) => {
    const y = axisY - STACK * k;
    const a = iv.from === null ? left : X(iv.from);
    const b = iv.to === null ? right - 2 : X(iv.to);
    const [ca, cb] = iv.closed ?? [false, false];
    out.push(line(a, y, b, y, { stroke: ACCENT, width: 5, cap: "butt" }));
    if (iv.to === null) out.push(arrowHead(right + 4, y, 0, 11, ACCENT));
    if (iv.from === null) out.push(arrowHead(left - 4, y, Math.PI, 11, ACCENT));
    // Ngoặc ở đầu mút hữu hạn: [ ] vuông góc khi lấy, ( ) cong khi không lấy.
    const bracket = (x: number, closed: boolean, side: -1 | 1) => {
      const h = 10;
      const d = 6 * side;
      return closed
        ? path(`M${r(x + d)},${r(y - h)} L${r(x)},${r(y - h)} L${r(x)},${r(y + h)} L${r(x + d)},${r(y + h)}`, { stroke: ACCENT, width: 2.6 })
        : path(`M${r(x + d)},${r(y - h)} Q${r(x - d * 0.6)},${r(y)} ${r(x + d)},${r(y + h)}`, { stroke: ACCENT, width: 2.6 });
    };
    if (iv.from !== null) out.push(bracket(a, ca, 1));
    if (iv.to !== null) out.push(bracket(b, cb, -1));
  });

  for (const p of points) {
    const x = X(p.x);
    out.push(circle(x, axisY, 5, { fill: p.open ? "#FFFFFF" : ACCENT, stroke: ACCENT, width: 2 }));
    if (p.label) out.push(text(x, axisY - 16, p.label, { italic: true, size: 16 }));
  }

  return frame(W, height, out.join(""));
}
