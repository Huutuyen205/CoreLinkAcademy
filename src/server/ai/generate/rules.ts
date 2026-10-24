// Quy tắc thuần cho nội dung AI sinh ra: chia điểm, loại câu hỏi lỗi, kiểm tra đáp án. Có unit test.
import type { Exercises, EssaySet, Quiz } from "./schemas";

export const DEFAULT_TOTAL_SCORE = 10;

/** Chia `total` điểm cho `count` câu theo bước 0,25 (BR-042); phần dư cộng dần vào các câu đầu. */
export function distributePoints(count: number, total = DEFAULT_TOTAL_SCORE): number[] {
  if (count < 1) return [];
  const step = 0.25;
  const base = Math.max(step, Math.floor((total / count) / step) * step);
  const points = Array<number>(count).fill(base);
  let rest = Math.round((total - base * count) / step);
  for (let i = 0; rest > 0 && i < count; i++, rest--) points[i] = Math.round((points[i]! + step) * 100) / 100;
  return points;
}

const norm = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

type Mcq = Quiz["questions"][number];
type Item = Exercises["questions"][number];

/** Câu trắc nghiệm hợp lệ: 2–6 lựa chọn không trùng/không rỗng, đáp án đúng nằm trong danh sách. */
export function isValidMcq(q: Mcq): boolean {
  const options = q.options.map(norm);
  if (options.length < 2 || options.length > 6 || options.some((o) => !o)) return false;
  if (new Set(options).size !== options.length) return false;
  return Number.isInteger(q.correctOption) && q.correctOption >= 0 && q.correctOption < options.length;
}

/** Bỏ câu lỗi, loại đáp án trùng của câu trả lời ngắn; trả về danh sách còn lại (AI đôi khi sinh câu hỏng). */
export function cleanItems(items: Item[]): Item[] {
  const out: Item[] = [];
  const seen = new Set<string>();
  for (const q of items) {
    const key = norm(q.prompt);
    if (seen.has(key)) continue;
    if (q.type === "MCQ") {
      if (!isValidMcq(q)) continue;
      out.push({ ...q, options: q.options.map((o) => o.trim()), prompt: q.prompt.trim() });
    } else {
      const accepted = [...new Set(q.acceptedAnswers.map((a) => a.trim()).filter(Boolean))];
      if (accepted.length === 0) continue;
      out.push({ ...q, acceptedAnswers: accepted, prompt: q.prompt.trim() });
    }
    seen.add(key);
  }
  return out;
}

export function cleanQuiz(quiz: Quiz): Quiz {
  return { ...quiz, questions: cleanItems(quiz.questions) as Quiz["questions"] };
}

export function cleanExercises(ex: Exercises): Exercises {
  return { ...ex, questions: cleanItems(ex.questions) };
}

/** Điểm câu tự luận: tổng thang điểm nếu có, ngược lại theo `points` AI đề xuất; làm tròn bước 0,25 và ≥ 0,25. */
export function essayPoints(q: EssaySet["questions"][number]): number {
  const rubricTotal = q.rubric.reduce((s, r) => s + r.points, 0);
  const raw = rubricTotal > 0 ? rubricTotal : q.points;
  return Math.min(100, Math.max(0.25, Math.round(raw * 4) / 4));
}

/** Giữ tối đa `max` hình minh họa đầu tiên (theo thứ tự xuất hiện), bỏ hình ở các mục sau. */
export function capFigures<T extends { figure?: unknown }>(items: T[], max: number): T[] {
  let used = 0;
  return items.map((it) => {
    if (it.figure === undefined) return it;
    if (used < max) {
      used++;
      return it;
    }
    return { ...it, figure: undefined };
  });
}

/** Số câu mong muốn: ép về [1, max]. */
export function clampCount(value: number | null | undefined, fallback: number, max: number): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.round(value)));
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
