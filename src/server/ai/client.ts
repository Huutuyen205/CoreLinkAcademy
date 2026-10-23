// Điểm vào duy nhất để gọi AI: chọn nhà cung cấp theo env, giới hạn lượt dùng, ép đầu ra qua Zod, ghi audit.
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { writeAudit } from "@/server/audit/log";
import type { Actor } from "@/server/auth/session";
import { DomainError } from "@/server/errors";
import { hitRateLimit } from "@/server/rate-limit/limiter";
import { getAiConfig } from "./config";
import { extractJson } from "./json";
import { AI_LIMITS, type AiLimitScope } from "./limits";
import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import { mockProvider } from "./providers/mock";
import { openaiProvider } from "./providers/openai";
import { AiProviderError, type AiProvider, type AiRequest } from "./providers/types";

export function getProvider(): AiProvider {
  const config = getAiConfig();
  switch (config.provider) {
    case "gemini":
      return geminiProvider(config);
    case "openai":
      return openaiProvider(config);
    case "anthropic":
      return anthropicProvider(config);
    default:
      return mockProvider();
  }
}

/** Dùng cho giao diện: đang chạy bản mẫu hay AI thật. */
export function aiStatus(): { mock: boolean; provider: string; model: string } {
  const p = getProvider();
  return { mock: p.isMock, provider: p.id, model: p.model };
}

export type AiJsonResult<T> = { data: T; mock: boolean; provider: string; model: string; inputTokens?: number; outputTokens?: number };

/** Trừ một lượt trong giới hạn của người dùng; bản mock không bị giới hạn (không tốn phí). */
export async function consumeAiQuota(actor: Actor, scope: AiLimitScope, provider = getProvider()): Promise<void> {
  if (provider.isMock) return;
  const ok = await hitRateLimit(`ai:${scope}:${actor.id}`, AI_LIMITS[scope]);
  if (!ok) throw new DomainError("AI_RATE_LIMIT", "Bạn đã dùng hết lượt AI hôm nay. Vui lòng thử lại vào ngày mai.");
}

/**
 * Gọi AI và trả dữ liệu đã kiểm tra bằng `schema`. Phản hồi sai định dạng → thử lại đúng 1 lần kèm lỗi cụ thể.
 * Lỗi nhà cung cấp → DomainError thân thiện (chi tiết chỉ ghi log server, không lộ khóa/phản hồi thô cho người dùng).
 */
export async function completeJson<S extends z.ZodTypeAny>(req: AiRequest, schema: S, provider = getProvider()): Promise<AiJsonResult<z.infer<S>>> {
  let user = req.user;
  let tokensIn = 0;
  let tokensOut = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    let result;
    try {
      result = await provider.complete({ ...req, user });
    } catch (error) {
      if (error instanceof AiProviderError) {
        console.error(`[ai] ${provider.id}/${provider.model}: ${error.message}`);
        throw new DomainError("AI_UNAVAILABLE", "Trợ lý AI đang bận hoặc chưa kết nối được. Vui lòng thử lại sau ít phút.");
      }
      throw error;
    }
    tokensIn += result.inputTokens ?? 0;
    tokensOut += result.outputTokens ?? 0;
    try {
      const parsed = schema.safeParse(extractJson(result.text));
      if (parsed.success) {
        return { data: parsed.data, mock: provider.isMock, provider: provider.id, model: provider.model, inputTokens: tokensIn || undefined, outputTokens: tokensOut || undefined };
      }
      user = `${req.user}\n\nPhản hồi trước KHÔNG hợp lệ: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}. Trả lại CHỈ một đối tượng JSON đúng cấu trúc yêu cầu.`;
    } catch {
      user = `${req.user}\n\nPhản hồi trước không phải JSON hợp lệ. Trả lại CHỈ một đối tượng JSON đúng cấu trúc yêu cầu, không kèm chữ nào khác.`;
    }
  }
  throw new DomainError("AI_BAD_OUTPUT", "AI trả về dữ liệu chưa đúng khuôn mẫu. Vui lòng bấm tạo lại.");
}

/** Ghi nhật ký một lần dùng AI (FR-035): ai, việc gì, nhà cung cấp, số token — KHÔNG ghi nội dung câu hỏi/bài làm. */
export async function auditAiUse(
  actor: Actor,
  action: string,
  entity: string,
  entityId: string,
  info: { provider: string; model: string; mock: boolean; inputTokens?: number; outputTokens?: number; extra?: Record<string, unknown> },
): Promise<void> {
  // Chỉ ghi những trường này; KHÔNG ghi nội dung AI sinh ra hay bài làm (người gọi có thể truyền cả kết quả vào `info`).
  const { provider, model, mock, inputTokens, outputTokens, extra } = info;
  await writeAudit({ actorId: actor.id, action, entity, entityId, detail: JSON.parse(JSON.stringify({ provider, model, mock, inputTokens, outputTokens, ...extra })) as Prisma.InputJsonValue });
}
