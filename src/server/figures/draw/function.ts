// Đồ thị hàm số: hệ trục có lưới, vạch chia "đẹp", đường cong cắt ở chỗ hàm không xác định / tiệm cận đứng.
import { compileExpr, type Fn } from "../expr";
import { exprList, type FunctionFigure } from "../schema";
import { arrowHead, AXIS, circle, CURVES, fmtNum, frame, GRID, hashId, line, MUTED, niceStep, path, prettyExpr, r, text, type Drawn } from "../svg";

const PW = 440; // vùng vẽ
const PH = 320;
const PAD = 26;
const SAMPLES = 800;
const LEGEND_ROW = 24;

type Range = { min: number; max: number };

function quantile(sorted: number[], q: number): number {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[i]!;
}

/**
 * Giá trị y "đáng xem" của một hàm như sách giáo khoa: cực trị, giao với Oy, nghiệm (y = 0).
 * Bỏ qua hai đầu khoảng (đa thức bậc cao vọt rất xa làm hình dẹt) và tiệm cận đứng.
 */
function interestingYs(f: Fn, xr: Range): number[] {
  const N = 400;
  const xs = Array.from({ length: N + 1 }, (_, i) => xr.min + ((xr.max - xr.min) * i) / N);
  const ys = xs.map(f);
  const out: number[] = [];
  if (xr.min <= 0 && xr.max >= 0 && Number.isFinite(f(0))) out.push(f(0));
  for (let i = 1; i < N; i++) {
    const [a, b, c] = [ys[i - 1]!, ys[i]!, ys[i + 1]!];
    if (![a, b, c].every(Number.isFinite)) continue;
    if ((b - a) * (c - b) < 0) out.push(b);
  }
  for (let i = 0; i < N; i++) {
    const [a, b] = [ys[i]!, ys[i + 1]!];
    if (!Number.isFinite(a) || !Number.isFinite(b) || a * b > 0) continue;
    // Đổi dấu: chia đôi tìm nghiệm; qua tiệm cận đứng thì |f| không nhỏ dần → không tính là nghiệm.
    let lo = xs[i]!;
    let hi = xs[i + 1]!;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (f(lo) * f(mid) <= 0) hi = mid;
      else lo = mid;
    }
    if (Math.abs(f((lo + hi) / 2)) < 1e-6 * (1 + Math.abs(a) + Math.abs(b))) {
      out.push(0);
      break;
    }
  }
  return out;
}

/** Khoảng y tự động: quanh các điểm đáng xem (đủ rộng để thấy dáng đồ thị), luôn chứa điểm cần đánh dấu, ưu tiên chứa trục Ox. */
function autoY(fns: Fn[], xr: Range, marks: { y: number }[]): Range {
  const ys: number[] = [];
  for (const f of fns) {
    for (let i = 0; i <= 200; i++) {
      const y = f(xr.min + ((xr.max - xr.min) * i) / 200);
      if (Number.isFinite(y)) ys.push(y);
    }
  }
  ys.sort((a, b) => a - b);
  const interesting = [...fns.flatMap((f) => interestingYs(f, xr)), ...marks.map((m) => m.y)];
  let min: number;
  let max: number;
  if (interesting.length > 0) {
    min = Math.min(...interesting);
    max = Math.max(...interesting);
    // Đủ cao để thấy dáng (≈ 60% bề ngang), nhưng không vượt quá miền giá trị thật của hàm.
    const want = (xr.max - xr.min) * 0.6;
    if (max - min < want) {
      const extra = (want - (max - min)) / 2;
      const lowest = ys.length ? ys[0]! : min - extra;
      const highest = ys.length ? ys[ys.length - 1]! : max + extra;
      min = Math.max(min - extra, Math.min(min, lowest));
      max = Math.min(max + extra, Math.max(max, highest));
    }
  } else {
    min = ys.length ? quantile(ys, 0.1) : -5;
    max = ys.length ? quantile(ys, 0.9) : 5;
  }
  for (const m of marks) {
    min = Math.min(min, m.y);
    max = Math.max(max, m.y);
  }
  const span = Math.max(max - min, 1e-9);
  if (min > 0 && min < span * 0.6) min = 0;
  if (max < 0 && -max < span * 0.6) max = 0;
  if (max - min < 1e-6) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

export function drawFunction(f: FunctionFigure): Drawn {
  const exprs = exprList(f);
  const fns = exprs.map(compileExpr);
  const marks = f.points ?? [];

  let xr: Range = { min: f.xMin ?? -5, max: f.xMax ?? 5 };
  if (f.xMin === undefined && f.xMax === undefined && marks.length) {
    xr = { min: Math.min(-1, ...marks.map((m) => m.x)) - 2, max: Math.max(1, ...marks.map((m) => m.x)) + 2 };
  } else if (f.xMin === undefined) xr.min = Math.min(xr.max - 10, -5);
  else if (f.xMax === undefined) xr.max = Math.max(xr.min + 10, 5);
  let yr: Range = f.yMin !== undefined && f.yMax !== undefined ? { min: f.yMin, max: f.yMax } : autoY(fns, xr, marks);
  if (f.yMin !== undefined && f.yMax === undefined) yr = { min: f.yMin, max: Math.max(yr.max, f.yMin + 1) };
  if (f.yMax !== undefined && f.yMin === undefined) yr = { min: Math.min(yr.min, f.yMax - 1), max: f.yMax };

  // Cùng tỉ lệ hai trục khi chênh lệch không quá lớn (đường tròn ra tròn, góc 45° ra 45°).
  let ux = PW / (xr.max - xr.min);
  let uy = PH / (yr.max - yr.min);
  const equal = Math.max(ux, uy) / Math.min(ux, uy) <= 2.5 && f.yMin === undefined && f.yMax === undefined;
  if (equal) {
    const u = Math.min(ux, uy);
    const grow = (rg: Range, size: number) => {
      const c = (rg.min + rg.max) / 2;
      const half = size / u / 2;
      return { min: c - half, max: c + half };
    };
    xr = grow(xr, PW);
    yr = grow(yr, PH);
    ux = uy = u;
  }
  const X = (x: number) => PAD + (x - xr.min) * ux;
  const Y = (y: number) => PAD + (yr.max - y) * uy;

  const out: string[] = [];
  // Nhiều hình trên cùng trang web → id riêng theo nội dung.
  const clipId = `plot-${hashId(JSON.stringify(f))}`;
  out.push(`<defs><clipPath id="${clipId}"><rect x="${PAD}" y="${PAD}" width="${PW}" height="${PH}"/></clipPath></defs>`);

  // Lưới
  // Cùng tỉ lệ → cùng bước chia để ô lưới vuông.
  const sx = equal ? niceStep(Math.max(xr.max - xr.min, yr.max - yr.min), 10) : niceStep(xr.max - xr.min);
  const sy = equal ? sx : niceStep(yr.max - yr.min);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let v = Math.ceil(xr.min / sx) * sx; v <= xr.max + 1e-9; v += sx) xs.push(Math.abs(v) < 1e-9 ? 0 : v);
  for (let v = Math.ceil(yr.min / sy) * sy; v <= yr.max + 1e-9; v += sy) ys.push(Math.abs(v) < 1e-9 ? 0 : v);
  for (const v of xs) out.push(line(X(v), PAD, X(v), PAD + PH, { stroke: GRID, width: 1 }));
  for (const v of ys) out.push(line(PAD, Y(v), PAD + PW, Y(v), { stroke: GRID, width: 1 }));

  // Trục (nằm ở 0 nếu 0 trong khoảng, nếu không thì sát mép)
  const ax = yr.min <= 0 && yr.max >= 0 ? Y(0) : yr.min > 0 ? PAD + PH : PAD;
  const ay = xr.min <= 0 && xr.max >= 0 ? X(0) : xr.min > 0 ? PAD : PAD + PW;
  out.push(line(PAD - 6, ax, PAD + PW + 8, ax, { stroke: AXIS, width: 1.4 }), arrowHead(PAD + PW + 12, ax, 0, 9, AXIS));
  out.push(line(ay, PAD + PH + 6, ay, PAD - 8, { stroke: AXIS, width: 1.4 }), arrowHead(ay, PAD - 12, -Math.PI / 2, 9, AXIS));
  out.push(text(PAD + PW + 10, ax + 14, "x", { italic: true, size: 17 }), text(ay - 12, PAD - 10, "y", { italic: true, size: 17 }));
  if (ax === Y(0) && ay === X(0)) out.push(text(ay - 9, ax + 12, "O", { italic: true, size: 15 }));

  // Số trên trục: bỏ số sát gốc tọa độ để không chồng chữ O.
  for (const v of xs) {
    if (v === 0) continue;
    out.push(line(X(v), ax - 3, X(v), ax + 3, { stroke: AXIS, width: 1.2 }), text(X(v), ax + 13, fmtNum(v), { size: 12, fill: MUTED }));
  }
  for (const v of ys) {
    if (v === 0) continue;
    out.push(line(ay - 3, Y(v), ay + 3, Y(v), { stroke: AXIS, width: 1.2 }), text(ay - 6, Y(v), fmtNum(v), { size: 12, fill: MUTED, anchor: "end" }));
  }

  // Đường cong: tách đoạn khi không xác định, vượt xa khung hoặc nhảy dấu qua tiệm cận đứng.
  const span = yr.max - yr.min;
  fns.forEach((fn, k) => {
    const segs: string[] = [];
    let cur: string[] = [];
    let prev: number | null = null;
    for (let i = 0; i <= SAMPLES; i++) {
      const x = xr.min + ((xr.max - xr.min) * i) / SAMPLES;
      const y = fn(x);
      const ok = Number.isFinite(y) && y > yr.min - span * 3 && y < yr.max + span * 3;
      const jump = ok && prev !== null && Math.abs(y - prev) > span * 1.5;
      if (!ok || jump) {
        if (cur.length > 1) segs.push(`M${cur.join(" L")}`);
        cur = [];
      }
      if (ok) cur.push(`${r(X(x))},${r(Y(y))}`);
      prev = ok ? y : null;
    }
    if (cur.length > 1) segs.push(`M${cur.join(" L")}`);
    out.push(`<g clip-path="url(#${clipId})">${path(segs.join(" "), { stroke: CURVES[k % CURVES.length]!, width: 2.4 })}</g>`);
  });

  // Điểm đánh dấu + đường gióng nét đứt xuống hai trục.
  for (const m of marks) {
    if (m.x < xr.min || m.x > xr.max || m.y < yr.min || m.y > yr.max) continue;
    const px = X(m.x);
    const py = Y(m.y);
    if (Math.abs(py - ax) > 2) out.push(line(px, py, px, ax, { stroke: MUTED, width: 1, dash: "4 4" }));
    if (Math.abs(px - ay) > 2) out.push(line(px, py, ay, py, { stroke: MUTED, width: 1, dash: "4 4" }));
    out.push(circle(px, py, 3.6, { fill: "#111827", stroke: "#111827", width: 1 }));
    if (m.label) out.push(text(px + 8, py - 12, m.label, { italic: true, size: 16, anchor: "start" }));
  }

  // Chú thích từng đường dưới hình.
  const top = PAD * 2 + PH + 4;
  exprs.forEach((e, k) => {
    const y = top + k * LEGEND_ROW + LEGEND_ROW / 2;
    const color = CURVES[k % CURVES.length]!;
    out.push(line(PAD, y, PAD + 26, y, { stroke: color, width: 2.6 }), text(PAD + 34, y, `y = ${prettyExpr(e)}`, { italic: true, size: 15, anchor: "start" }));
  });

  return frame(PW + PAD * 2, top + exprs.length * LEGEND_ROW + 6, out.join(""));
}
