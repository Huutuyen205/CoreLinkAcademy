// So khớp câu hỏi với ý định bằng từ khóa (không cần AI) + đọc ngày tương đối. Hàm thuần, có unit test.
import type { Role } from "@prisma/client";
import { intentsForRole } from "./intents";
import { hasPhrase, normalizeText } from "./text";

/** Điểm tối thiểu để tin luật từ khóa mà không cần hỏi AI. */
export const STRONG_SCORE = 3;

export type Match = { intent: string; score: number };

/** Ý định có tổng trọng số cao nhất cho vai trò; hòa điểm → ý định đứng trước trong danh mục. */
export function matchIntent(text: string, role: Role): Match | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  let best: Match | null = null;
  for (const def of intentsForRole(role)) {
    let score = 0;
    for (const [phrase, weight] of Object.entries(def.keywords)) if (hasPhrase(normalized, phrase)) score += weight;
    if (score > 0 && (!best || score > best.score)) best = { intent: def.id, score };
  }
  return best;
}

/**
 * Ngày được hỏi: 0 = hôm nay, -1 = hôm qua, 1 = ngày mai, 2 = ngày kia, -2 = hôm kia.
 * `explicit` = người hỏi có nói rõ ngày; không nói → mặc định hôm nay.
 */
export function parseDayOffset(text: string): { offset: number; explicit: boolean } {
  const t = normalizeText(text);
  if (hasPhrase(t, "hom kia") || hasPhrase(t, "hom truoc")) return { offset: -2, explicit: true };
  if (hasPhrase(t, "hom qua")) return { offset: -1, explicit: true };
  if (hasPhrase(t, "ngay kia")) return { offset: 2, explicit: true };
  if (hasPhrase(t, "ngay mai") || hasPhrase(t, "sang mai") || hasPhrase(t, "mai co")) return { offset: 1, explicit: true };
  if (hasPhrase(t, "hom nay") || hasPhrase(t, "nay") || hasPhrase(t, "bay gio") || hasPhrase(t, "hien tai")) return { offset: 0, explicit: true };
  return { offset: 0, explicit: false };
}

export function dayLabel(offset: number): string {
  if (offset === 0) return "Hôm nay";
  if (offset === -1) return "Hôm qua";
  if (offset === 1) return "Ngày mai";
  if (offset === 2) return "Ngày kia";
  if (offset === -2) return "Hôm kia";
  return offset > 0 ? `${offset} ngày tới` : `${-offset} ngày trước`;
}
