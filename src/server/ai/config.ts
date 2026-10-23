// Cấu hình AI (DECISION-D34). Hàm thuần đọc từ `env` truyền vào để unit test, không chạm process.env trực tiếp.

export type ProviderId = "mock" | "gemini" | "openai" | "anthropic";

export type AiConfig = {
  provider: ProviderId;
  apiKey: string | null;
  model: string;
  /** Chỉ dùng cho `openai` (tương thích OpenAI: Groq, OpenRouter, Together…). */
  baseUrl: string;
  /** Yêu cầu nhà cung cấp trả JSON thuần. Tắt (`AI_JSON_MODE=off`) nếu model/nhà cung cấp không hỗ trợ. */
  jsonMode: boolean;
  timeoutMs: number;
};

const DEFAULT_MODELS: Record<Exclude<ProviderId, "mock">, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-5-5",
};

const KNOWN: ProviderId[] = ["mock", "gemini", "openai", "anthropic"];

/**
 * `AI_PROVIDER` thiếu/sai, hoặc nhà cung cấp thật mà thiếu `AI_API_KEY` → luôn lùi về `mock`
 * (chạy được mọi luồng, không gọi mạng, không tốn tiền).
 */
export function readAiConfig(env: Record<string, string | undefined>): AiConfig {
  const requested = (env.AI_PROVIDER ?? "mock").trim().toLowerCase() as ProviderId;
  const apiKey = env.AI_API_KEY?.trim() || null;
  const provider: ProviderId = KNOWN.includes(requested) && requested !== "mock" && apiKey ? requested : "mock";
  const model = env.AI_MODEL?.trim() || (provider === "mock" ? "mock" : DEFAULT_MODELS[provider]);
  return {
    provider,
    apiKey,
    model,
    baseUrl: (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    jsonMode: (env.AI_JSON_MODE ?? "on").trim().toLowerCase() !== "off",
    timeoutMs: 50_000,
  };
}

export function getAiConfig(): AiConfig {
  return readAiConfig(process.env);
}
