// Quy tắc thuần cho chấm bài có AI hỗ trợ: AI chỉ GỢI Ý, mọi điểm đều do giáo viên xác nhận (DECISION-D34).
import { LETTERS } from "../generate/rules";
import type { AnswerSheet, EssayGrade } from "../generate/schemas";

/** Điểm gợi ý: trong [0, max], bước 0,25 (BR-042). */
export function clampSuggestedPoints(points: number, max: number): number {
  if (!Number.isFinite(points)) return 0;
  return Math.min(max, Math.max(0, Math.round(points * 4) / 4));
}

/** Bài viết tay qua ảnh không bao giờ được coi là "chắc chắn cao" (chữ khó đọc, AI có thể đọc nhầm). */
export function capConfidence(confidence: EssayGrade["confidence"], hasPhotos: boolean): EssayGrade["confidence"] {
  return hasPhotos && confidence === "high" ? "medium" : confidence;
}

/** Chữ cái chọn (A–F, không phân biệt hoa thường, chấp nhận "A." hoặc "(b)") → chỉ số 0-based; ngoài phạm vi/không rõ → null. */
export function letterToIndex(choice: string | null, optionCount: number): number | null {
  if (!choice) return null;
  const letter = choice.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 1);
  const idx = LETTERS.findIndex((l) => l === letter);
  return idx >= 0 && idx < optionCount ? idx : null;
}

export type SheetQuestion = { id: string; order: number; optionCount: number };

/** Đáp án đọc từ phiếu → `questionId → chỉ số lựa chọn | null`. Câu AI không trả về = null (giáo viên điền tay). */
export function mapSheetAnswers(sheet: AnswerSheet, questions: SheetQuestion[]): Record<string, number | null> {
  const byOrder = new Map<number, string | null>();
  for (const a of sheet.answers) if (!byOrder.has(a.question)) byOrder.set(a.question, a.choice);
  return Object.fromEntries(questions.map((q) => [q.id, letterToIndex(byOrder.get(q.order) ?? null, q.optionCount)]));
}

/** LLM chỉ nhận ảnh JPEG/PNG/WEBP (không nhận HEIC/PDF). */
export const VISION_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const isVisionImage = (mime: string): boolean => (VISION_MIME as readonly string[]).includes(mime);
