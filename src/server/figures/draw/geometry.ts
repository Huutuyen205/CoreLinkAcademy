// Hình học phẳng và không gian. Tọa độ [x, y] hoặc [x, y, z] (z là chiều cao); hình không gian vẽ phối cảnh
// kiểu sách giáo khoa: trục y lùi vào trong theo góc 45°, rút ngắn một nửa. Cạnh khuất do AI liệt kê ở `dashed`.
import { splitAngle, splitSegment, type GeometryFigure } from "../schema";
import { circle, frame, INK, line, path, r, text, type Drawn } from "../svg";

const MAX_W = 440;
const MAX_H = 330;
const PAD = 34;
const DEPTH = 0.5;

type P = { x: number; y: number };

const project = (c: number[]): P => (c.length === 3 ? { x: c[0]! + c[1]! * DEPTH * Math.SQRT1_2, y: c[2]! + c[1]! * DEPTH * Math.SQRT1_2 } : { x: c[0]!, y: c[1]! });

const unit = (a: P, b: P): P => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
};

export function drawGeometry(f: GeometryFigure): Drawn {
  const names = Object.keys(f.points);
  const world = Object.fromEntries(names.map((n) => [n, project(f.points[n]!)]));

  // Khung bao gồm cả đường tròn (chỉ hình phẳng mới vẽ đúng bán kính).
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const p of Object.values(world)) grow(p.x, p.y);
  for (const c of f.circles ?? []) {
    const o = world[c.center]!;
    grow(o.x - c.radius, o.y - c.radius);
    grow(o.x + c.radius, o.y + c.radius);
  }
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const scale = Math.min(MAX_W / spanX, MAX_H / spanY);
  const width = spanX * scale + PAD * 2;
  const height = spanY * scale + PAD * 2;
  // Trục y toán học hướng lên → lật dấu khi ra màn hình.
  const S = (p: P): P => ({ x: PAD + (p.x - minX) * scale, y: PAD + (maxY - p.y) * scale });
  const screen = Object.fromEntries(names.map((n) => [n, S(world[n]!)]));

  const out: string[] = [];
  for (const c of f.circles ?? []) {
    const o = screen[c.center]!;
    out.push(circle(o.x, o.y, c.radius * scale, { stroke: INK, width: 1.8 }));
  }

  const neighbors: Record<string, P[]> = Object.fromEntries(names.map((n) => [n, []]));
  const seg = (ref: string, dashed: boolean) => {
    const [a, b] = splitSegment(ref)!;
    const pa = screen[a]!;
    const pb = screen[b]!;
    neighbors[a]!.push(pb);
    neighbors[b]!.push(pa);
    out.push(line(pa.x, pa.y, pb.x, pb.y, { stroke: INK, width: dashed ? 1.5 : 1.9, dash: dashed ? "7 5" : undefined }));
  };
  for (const s of f.segments ?? []) seg(s, false);
  for (const s of f.dashed ?? []) seg(s, true);

  // Ký hiệu góc vuông: hình vuông nhỏ dựng theo hai cạnh của góc (tính trên màn hình nên đúng cả phối cảnh).
  for (const ref of f.rightAngles ?? []) {
    const [a, b, c] = splitAngle(ref)!;
    const pb = screen[b]!;
    const u = unit(pb, screen[a]!);
    const v = unit(pb, screen[c]!);
    const k = 11;
    const p1 = { x: pb.x + u.x * k, y: pb.y + u.y * k };
    const p2 = { x: pb.x + (u.x + v.x) * k, y: pb.y + (u.y + v.y) * k };
    const p3 = { x: pb.x + v.x * k, y: pb.y + v.y * k };
    out.push(path(`M${r(p1.x)},${r(p1.y)} L${r(p2.x)},${r(p2.y)} L${r(p3.x)},${r(p3.y)}`, { stroke: INK, width: 1.3 }));
  }

  // Điểm + tên: đặt tên về phía ngược hướng các cạnh nối vào điểm (không đè lên nét vẽ).
  const center = names.reduce((acc, n) => ({ x: acc.x + screen[n]!.x / names.length, y: acc.y + screen[n]!.y / names.length }), { x: 0, y: 0 });
  for (const n of names) {
    const p = screen[n]!;
    let dir = neighbors[n]!.reduce((acc, q) => {
      const u = unit(p, q);
      return { x: acc.x - u.x, y: acc.y - u.y };
    }, { x: 0, y: 0 });
    if (Math.hypot(dir.x, dir.y) < 0.3) dir = { x: p.x - center.x, y: p.y - center.y };
    if (Math.hypot(dir.x, dir.y) < 0.3) dir = { x: 0.7, y: -0.7 };
    const u = unit({ x: 0, y: 0 }, dir);
    out.push(circle(p.x, p.y, 2.8, { fill: INK, stroke: INK, width: 1 }));
    out.push(text(p.x + u.x * 16, p.y + u.y * 16, n, { italic: true, size: 18 }));
  }

  return frame(width, height, out.join(""));
}
