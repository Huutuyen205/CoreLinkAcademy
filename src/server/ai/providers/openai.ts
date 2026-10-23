// Giao thức Chat Completions của OpenAI — dùng chung cho Groq, OpenRouter, Together, Ollama… qua `AI_BASE_URL`.
import type { AiConfig } from "../config";
import { postJson } from "./http";
import { AiProviderError, type AiProvider, type AiRequest, type AiResult } from "./types";

type ChatResponse = {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export function openaiProvider(config: AiConfig): AiProvider {
  return {
    id: "openai",
    model: config.model,
    isMock: false,
    async complete(req: AiRequest): Promise<AiResult> {
      const userContent =
        req.images && req.images.length > 0
          ? [{ type: "text", text: req.user }, ...req.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.base64}` } }))]
          : req.user;
      const data = (await postJson(
        `${config.baseUrl}/chat/completions`,
        { authorization: `Bearer ${config.apiKey}` },
        {
          model: config.model,
          temperature: 0.3,
          max_tokens: req.maxOutputTokens ?? 4096,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: userContent },
          ],
          ...(config.jsonMode ? { response_format: { type: "json_object" } } : {}),
        },
        config.timeoutMs,
      )) as ChatResponse;
      const text = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new AiProviderError("Nhà cung cấp AI không trả nội dung.");
      return { text, inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens };
    },
  };
}
