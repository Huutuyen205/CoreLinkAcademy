import type { FormulaFigure } from "../schema";
import { frame, type Drawn } from "../svg";
import { placeTex, texToSvg } from "../tex";

const PAD = 14;

export function drawFormula(f: FormulaFigure): Drawn {
  const t = texToSvg(f.latex, 30);
  return frame(t.width + PAD * 2, t.height + PAD * 2, placeTex(t, PAD, PAD));
}
