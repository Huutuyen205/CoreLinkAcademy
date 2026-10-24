// Biểu đồ Ven 2 hoặc 3 tập, có thể kèm tập vũ trụ (khung chữ nhật). Nội dung vùng đặt sẵn tại tâm từng vùng.
import type { VennFigure } from "../schema";
import { circle, CURVES, frame, INK, MUTED, text, type Drawn } from "../svg";

const R = 92;

/** Ngắt nội dung vùng thành vài dòng ngắn để nằm gọn trong vùng. */
function lines(s: string): string[] {
  const parts = s.split(/\s*[;,]\s*/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    const next = cur ? `${cur}; ${p}` : p;
    if (cur && next.length > 9) {
      out.push(cur);
      cur = p;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out.slice(0, 4);
}

export function drawVenn(f: VennFigure): Drawn {
  const three = f.sets.length === 3;
  const width = three ? 400 : 420;
  const height = three ? 380 : 270;
  const cx = width / 2;
  const cy = three ? 182 : height / 2 + 6;
  const d = 58;
  const centers = three
    ? [
        { x: cx - d, y: cy - d * 0.55 },
        { x: cx + d, y: cy - d * 0.55 },
        { x: cx, y: cy + d * 0.95 },
      ]
    : [
        { x: cx - d, y: cy },
        { x: cx + d, y: cy },
      ];

  const out: string[] = [];
  const box = f.universe !== undefined || f.regions?.out !== undefined;
  if (box) {
    out.push(`<rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="10" fill="none" stroke="${INK}" stroke-width="1.5"/>`);
    if (f.universe) out.push(text(22, 26, f.universe, { italic: true, size: 17, anchor: "start" }));
  }
  centers.forEach((c, i) => {
    out.push(circle(c.x, c.y, R, { fill: CURVES[i]!, stroke: "none", width: 0 }).replace("/>", ' fill-opacity="0.13"/>'));
    out.push(circle(c.x, c.y, R, { stroke: CURVES[i]!, width: 2 }));
  });
  // Tên tập ở mép ngoài mỗi vòng.
  const labelPos = three
    ? [
        { x: centers[0]!.x - R * 0.8, y: centers[0]!.y - R * 0.95 },
        { x: centers[1]!.x + R * 0.8, y: centers[1]!.y - R * 0.95 },
        { x: centers[2]!.x + R * 1.0, y: centers[2]!.y + R * 0.78 },
      ]
    : [
        { x: centers[0]!.x - R * 0.72, y: centers[0]!.y - R * 0.84 },
        { x: centers[1]!.x + R * 0.72, y: centers[1]!.y - R * 0.84 },
      ];
  f.sets.forEach((s, i) => out.push(text(labelPos[i]!.x, labelPos[i]!.y, s, { italic: true, bold: true, size: 18, fill: CURVES[i]! })));

  const [a, b, c] = centers;
  const regionPos: Record<string, { x: number; y: number }> = three
    ? {
        a: { x: a!.x - R * 0.45, y: a!.y - R * 0.2 },
        b: { x: b!.x + R * 0.45, y: b!.y - R * 0.2 },
        c: { x: c!.x, y: c!.y + R * 0.5 },
        ab: { x: cx, y: a!.y - R * 0.42 },
        ac: { x: (a!.x + c!.x) / 2 - R * 0.28, y: (a!.y + c!.y) / 2 + R * 0.18 },
        bc: { x: (b!.x + c!.x) / 2 + R * 0.28, y: (b!.y + c!.y) / 2 + R * 0.18 },
        abc: { x: cx, y: (a!.y * 2 + c!.y) / 3 + 2 },
        out: { x: width - 46, y: height - 30 },
      }
    : {
        a: { x: a!.x - R * 0.45, y: cy },
        b: { x: b!.x + R * 0.45, y: cy },
        ab: { x: cx, y: cy },
        out: { x: width - 46, y: height - 28 },
      };
  for (const [key, value] of Object.entries(f.regions ?? {})) {
    const p = regionPos[key];
    if (!p || !value) continue;
    const ls = lines(value);
    ls.forEach((l, i) => out.push(text(p.x, p.y + (i - (ls.length - 1) / 2) * 18, l, { size: 15, fill: key === "out" ? MUTED : INK })));
  }
  return frame(width, height, out.join(""));
}
