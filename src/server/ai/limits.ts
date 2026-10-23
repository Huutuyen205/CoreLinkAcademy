// Giới hạn dùng AI theo người dùng (chặn tốn phí/lạm dụng) — dùng lại bảng rate_limit_buckets (BR-002).
const DAY = 24 * 3_600_000;

export const AI_LIMITS = {
  /** Câu hỏi chatbot cần gọi AI để hiểu ý (câu khớp luật có sẵn không tính). */
  chat: { max: 30, windowMs: DAY },
  /** Lần sinh giáo án/slide/đề. */
  generate: { max: 20, windowMs: DAY },
  /** Lần nhờ AI gợi ý chấm / đọc phiếu. */
  grade: { max: 60, windowMs: DAY },
} as const;

export type AiLimitScope = keyof typeof AI_LIMITS;
