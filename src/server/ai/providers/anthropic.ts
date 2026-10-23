// Claude (Anthropic Messages API). Không có chế độ JSON riêng → ràng buộc bằng chỉ dẫn hệ thống + Zod ở phía gọi.
import type { AiConfig } from "../config";
import { postJson } from "./http";
import { AiProviderError, type AiProvider, type AiRequest, type AiResult } from "./types";

type MessagesResponse = { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };

export function anthropicProvider(config: AiConfig): AiProvider {
  return {
    id: "anthropic",
    model: config.model,
    isMock: false,
    async complete(req: AiRequest): Promise<AiResult> {
      const content: object[] = [{ type: "text", text: req.user }];
      for (const img of req.images ?? []) content.push({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.base64 } });
      const data = (await postJson(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": config.apiKey!, "anthropic-version": "2023-06-01" },
        { model: config.model, max_tokens: req.maxOutputTokens ?? 4096, temperature: 0.3, system: req.system, messages: [{ role: "user", content }] },
        config.timeoutMs,
      )) as MessagesResponse;
      const text = data.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("") ?? "";
      if (!text) throw new AiProviderError("Nhà cung cấp AI không trả nội dung.");
      return { text, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens };
    },
  };
}
