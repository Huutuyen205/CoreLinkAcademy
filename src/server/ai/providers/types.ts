// Giao diện chung cho mọi nhà cung cấp AI: đổi nhà cung cấp chỉ cần đổi biến môi trường.

export type AiTask = "intent" | "lesson_plan" | "slides" | "quiz" | "exercises" | "essay" | "curriculum" | "grade_essay" | "read_answer_sheet";

export type AiImage = { mimeType: string; base64: string };

export type AiRequest = {
  task: AiTask;
  system: string;
  user: string;
  images?: AiImage[];
  /** Chỉ cho mock: dữ liệu có cấu trúc để dựng đầu ra mẫu (không gửi cho nhà cung cấp thật). */
  mock?: unknown;
  maxOutputTokens?: number;
};

export type AiResult = { text: string; inputTokens?: number; outputTokens?: number };

export interface AiProvider {
  readonly id: string;
  readonly model: string;
  readonly isMock: boolean;
  complete(req: AiRequest): Promise<AiResult>;
}

/** Lỗi gọi nhà cung cấp — thông điệp KHÔNG chứa khóa API; chi tiết chỉ ghi log server. */
export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
