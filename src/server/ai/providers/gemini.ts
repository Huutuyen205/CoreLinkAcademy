// Google Gemini (Google AI Studio có gói miễn phí). https://ai.google.dev/api/generate-content
import type { AiConfig } from "../config";
import { postJson } from "./http";
import { AiProviderError, type AiProvider, type AiRequest, type AiResult } from "./types";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

export function geminiProvider(config: AiConfig): AiProvider {
  return {
    id: "gemini",
    model: config.model,
    isMock: false,
    async complete(req: AiRequest): Promise<AiResult> {
      const parts: object[] = [{ text: req.user }];
      for (const img of req.images ?? []) parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
      const data = (await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
        { "x-goog-api-key": config.apiKey! },
        {
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: req.maxOutputTokens ?? 4096,
            ...(config.jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        },
        config.timeoutMs,
      )) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) throw new AiProviderError("Nhà cung cấp AI không trả nội dung.");
      return { text, inputTokens: data.usageMetadata?.promptTokenCount, outputTokens: data.usageMetadata?.candidatesTokenCount };
    },
  };
}
