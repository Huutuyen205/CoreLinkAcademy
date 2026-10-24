// Đọc biểu thức hàm số một biến x do AI viết (vd. "x^2 - 2x - 3", "√(x+1)", "2sin(x)") thành hàm tính được.
// Tự viết bộ phân tích (KHÔNG dùng eval/new Function): chỉ có số, x, hằng, phép toán và danh sách hàm cố định. Hàm thuần.

export type Fn = (x: number) => number;

const FUNCS: Record<string, Fn> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  cot: (v) => 1 / Math.tan(v),
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

type Tok = { t: "num"; v: number } | { t: "x" } | { t: "const"; v: number } | { t: "fn"; f: Fn } | { t: "op"; v: string } | { t: "(" } | { t: ")" } | { t: "|" };

/** Đổi ký hiệu thường gặp về dạng chuẩn: −, ·, ×, ÷, ², ³, π, √, dấu phẩy thập phân giữa hai chữ số. */
function normalize(src: string): string {
  return src
    .replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=/i, "")
    .replace(/[−–]/g, "-")
    .replace(/[·×∙]/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/\*\*/g, "^")
    .replace(/(\d),(\d)/g, "$1.$2");
}

function tokenize(src: string): Tok[] {
  const s = normalize(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+(?:e[+-]?\d+)?|^\d+\.?/i.exec(s.slice(i))!;
      const v = Number(m[0]);
      if (!Number.isFinite(v)) throw new Error(`Số không hợp lệ: ${m[0]}`);
      out.push({ t: "num", v });
      i += m[0].length;
    } else if (/[a-z]/i.test(c)) {
      const word = /^[a-z]+/i.exec(s.slice(i))![0].toLowerCase();
      // Ghép chữ: "xsin" → x · sin; "2pix" → 2 · pi · x. Ưu tiên tên hàm/hằng dài nhất ở đầu.
      let rest = word;
      while (rest.length > 0) {
        const name = Object.keys(FUNCS).concat(Object.keys(CONSTS), ["x"]).filter((n) => rest.startsWith(n)).sort((a, b) => b.length - a.length)[0];
        if (!name) throw new Error(`Không hiểu "${word}"`);
        if (name === "x") out.push({ t: "x" });
        else if (name in FUNCS) out.push({ t: "fn", f: FUNCS[name]! });
        else out.push({ t: "const", v: CONSTS[name]! });
        rest = rest.slice(name.length);
      }
      i += word.length;
    } else if ("+-*/^".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else if (c === "(" || c === "[" || c === "{") {
      out.push({ t: "(" });
      i++;
    } else if (c === ")" || c === "]" || c === "}") {
      out.push({ t: ")" });
      i++;
    } else if (c === "|") {
      out.push({ t: "|" });
      i++;
    } else {
      throw new Error(`Ký tự không hợp lệ: ${c}`);
    }
  }
  return out;
}

/** Phân tích đệ quy: expr = term (± term)*, term = unary ((*|/|ghép) unary)*, unary = ±unary | power, power = atom (^ unary)?. */
function parse(tokens: Tok[]): Fn {
  let pos = 0;
  let absDepth = 0;
  const peek = () => tokens[pos];
  const startsAtom = (t: Tok | undefined) => !!t && (t.t === "num" || t.t === "x" || t.t === "const" || t.t === "fn" || t.t === "(");

  function expr(): Fn {
    let left = term();
    for (let t = peek(); t?.t === "op" && (t.v === "+" || t.v === "-"); t = peek()) {
      pos++;
      const a = left;
      const b = term();
      left = t.v === "+" ? (x) => a(x) + b(x) : (x) => a(x) - b(x);
    }
    return left;
  }

  function term(): Fn {
    let left = unary();
    for (;;) {
      const t = peek();
      if (t?.t === "op" && (t.v === "*" || t.v === "/")) {
        pos++;
        const a = left;
        const b = unary();
        left = t.v === "*" ? (x) => a(x) * b(x) : (x) => a(x) / b(x);
      } else if (startsAtom(t) || (t?.t === "|" && absDepth === 0)) {
        // Nhân ngầm: 2x, 3(x+1), (x-1)(x+2), x sin x, 2|x|.
        const a = left;
        const b = unary();
        left = (x) => a(x) * b(x);
      } else {
        return left;
      }
    }
  }

  function unary(): Fn {
    const t = peek();
    if (t?.t === "op" && (t.v === "-" || t.v === "+")) {
      pos++;
      const a = unary();
      return t.v === "-" ? (x) => -a(x) : a;
    }
    return power();
  }

  function power(): Fn {
    const base = atom();
    const t = peek();
    if (t?.t === "op" && t.v === "^") {
      pos++;
      const exp = unary(); // phải kết hợp: 2^3^2 = 2^(3^2)
      return (x) => Math.pow(base(x), exp(x));
    }
    return base;
  }

  function atom(): Fn {
    const t = tokens[pos++];
    if (!t) throw new Error("Biểu thức bị thiếu");
    switch (t.t) {
      case "num": {
        const v = t.v;
        return () => v;
      }
      case "const": {
        const v = t.v;
        return () => v;
      }
      case "x":
        return (x) => x;
      case "fn": {
        const f = t.f;
        // "sin x", "sin 2x" (đối số là một tích ngắn) hoặc "sin(x)"; "sin^2 x" không hỗ trợ.
        const arg = peek()?.t === "(" ? atom() : term();
        return (x) => f(arg(x));
      }
      case "(": {
        const inner = expr();
        if (tokens[pos++]?.t !== ")") throw new Error("Thiếu dấu ngoặc đóng");
        return inner;
      }
      case "|": {
        absDepth++;
        const inner = expr();
        absDepth--;
        if (tokens[pos++]?.t !== "|") throw new Error("Thiếu dấu | đóng");
        return (x) => Math.abs(inner(x));
      }
      default:
        throw new Error("Biểu thức không hợp lệ");
    }
  }

  const fn = expr();
  if (pos !== tokens.length) throw new Error("Biểu thức thừa ký tự");
  return fn;
}

/** Biên dịch biểu thức; ném lỗi nếu không hiểu. Kết quả NaN/±Infinity ở điểm không xác định là bình thường. */
export function compileExpr(src: string): Fn {
  if (src.trim().length === 0 || src.length > 200) throw new Error("Biểu thức rỗng hoặc quá dài");
  return parse(tokenize(src));
}

export function tryCompileExpr(src: string): Fn | null {
  try {
    return compileExpr(src);
  } catch {
    return null;
  }
}
