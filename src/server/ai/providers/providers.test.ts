import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { completeJson } from "../client";
import { readAiConfig } from "../config";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { AiProviderError, type AiProvider } from "./types";

type Call = { url: string; headers: Record<string, string>; body: Record<string, unknown> };

/** Thay `fetch` bằng bản giả ghi lại yêu cầu và trả `payload`. */
function stubFetch(payload: unknown, init: { status?: number } = {}): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, opts: { headers: Record<string, string>; body: string }) => {
      calls.push({ url, headers: opts.headers, body: JSON.parse(opts.body) });
      const status = init.status ?? 200;
      return { ok: status < 400, status, json: async () => payload, text: async () => JSON.stringify(payload) } as unknown as Response;
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

const KEY = "sk-test-SECRET-123";
const image = { mimeType: "image/jpeg", base64: "QUJD" };
const req = { task: "quiz" as const, system: "SYS", user: "USER", images: [image] };

describe("Gemini", () => {
  const cfg = readAiConfig({ AI_PROVIDER: "gemini", AI_API_KEY: KEY, AI_MODEL: "gemini-x" });

  it("gửi systemInstruction, ảnh inlineData, JSON mode; khóa đi qua header (không nằm trên URL)", async () => {
    const calls = stubFetch({ candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }], usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7 } });
    const out = await geminiProvider(cfg).complete(req);
    expect(out).toEqual({ text: '{"a":1}', inputTokens: 11, outputTokens: 7 });
    const c = calls[0]!;
    expect(c.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent");
    expect(c.url).not.toContain(KEY);
    expect(c.headers["x-goog-api-key"]).toBe(KEY);
    expect(c.body.systemInstruction).toEqual({ parts: [{ text: "SYS" }] });
    expect(JSON.stringify(c.body.contents)).toContain('"inlineData":{"mimeType":"image/jpeg","data":"QUJD"}');
    expect((c.body.generationConfig as Record<string, unknown>).responseMimeType).toBe("application/json");
  });

  it("AI_JSON_MODE=off không ép JSON; phản hồi rỗng → lỗi", async () => {
    const calls = stubFetch({ candidates: [] });
    await expect(geminiProvider(readAiConfig({ AI_PROVIDER: "gemini", AI_API_KEY: KEY, AI_JSON_MODE: "off" })).complete({ ...req, images: undefined })).rejects.toBeInstanceOf(AiProviderError);
    expect((calls[0]!.body.generationConfig as Record<string, unknown>).responseMimeType).toBeUndefined();
  });
});

describe("OpenAI-tương thích (Groq, OpenRouter…)", () => {
  const cfg = readAiConfig({ AI_PROVIDER: "openai", AI_API_KEY: KEY, AI_MODEL: "llama-3.3-70b-versatile", AI_BASE_URL: "https://api.groq.com/openai/v1/" });

  it("đúng đường dẫn, Bearer, ảnh dạng data URL, response_format json_object", async () => {
    const calls = stubFetch({ choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 5, completion_tokens: 3 } });
    const out = await openaiProvider(cfg).complete(req);
    expect(out).toEqual({ text: '{"ok":true}', inputTokens: 5, outputTokens: 3 });
    const c = calls[0]!;
    expect(c.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(c.headers.authorization).toBe(`Bearer ${KEY}`);
    expect(c.body.model).toBe("llama-3.3-70b-versatile");
    expect(c.body.response_format).toEqual({ type: "json_object" });
    expect(JSON.stringify(c.body.messages)).toContain("data:image/jpeg;base64,QUJD");
  });

  it("không ảnh → nội dung là chuỗi thuần", async () => {
    const calls = stubFetch({ choices: [{ message: { content: "{}" } }] });
    await openaiProvider(cfg).complete({ ...req, images: undefined });
    expect((calls[0]!.body.messages as { content: unknown }[])[1]!.content).toBe("USER");
  });
});

describe("Anthropic", () => {
  const cfg = readAiConfig({ AI_PROVIDER: "anthropic", AI_API_KEY: KEY });

  it("đúng header, system riêng, ảnh base64, ghép các khối text", async () => {
    const calls = stubFetch({ content: [{ type: "text", text: '{"a":' }, { type: "text", text: "1}" }], usage: { input_tokens: 9, output_tokens: 4 } });
    const out = await anthropicProvider(cfg).complete(req);
    expect(out).toEqual({ text: '{"a":1}', inputTokens: 9, outputTokens: 4 });
    const c = calls[0]!;
    expect(c.url).toBe("https://api.anthropic.com/v1/messages");
    expect(c.headers["x-api-key"]).toBe(KEY);
    expect(c.headers["anthropic-version"]).toBe("2023-06-01");
    expect(c.body.system).toBe("SYS");
    expect(c.body.model).toBe("claude-haiku-5-5");
    expect(JSON.stringify(c.body.messages)).toContain('"source":{"type":"base64","media_type":"image/jpeg","data":"QUJD"}');
  });
});

describe("lỗi HTTP", () => {
  it("429 → AiProviderError mang mã trạng thái; khóa API không bị lộ trong thông điệp", async () => {
    stubFetch({ error: "rate limited" }, { status: 429 });
    const err = await openaiProvider(readAiConfig({ AI_PROVIDER: "openai", AI_API_KEY: KEY })).complete(req).catch((e) => e);
    expect(err).toBeInstanceOf(AiProviderError);
    expect(err.status).toBe(429);
    expect(err.message).not.toContain(KEY);
  });
});

describe("completeJson", () => {
  const schema = z.object({ n: z.number() });
  const scripted = (outputs: (string | Error)[]): AiProvider & { calls: number } => {
    const p = {
      id: "fake",
      model: "fake-1",
      isMock: false,
      calls: 0,
      async complete() {
        const next = outputs[Math.min(p.calls, outputs.length - 1)]!;
        p.calls++;
        if (next instanceof Error) throw next;
        return { text: next, inputTokens: 10, outputTokens: 5 };
      },
    };
    return p;
  };
  const base = { task: "quiz" as const, system: "s", user: "u" };

  it("đúng ngay lần đầu", async () => {
    const p = scripted(['```json\n{"n": 1}\n```']);
    const r = await completeJson(base, schema, p);
    expect(r).toMatchObject({ data: { n: 1 }, mock: false, provider: "fake", model: "fake-1", inputTokens: 10, outputTokens: 5 });
    expect(p.calls).toBe(1);
  });

  it("sai định dạng lần 1 → thử lại đúng 1 lần kèm lỗi cụ thể, cộng dồn token", async () => {
    const p = scripted(['{"n": "không phải số"}', '{"n": 2}']);
    const spy = vi.spyOn(p, "complete");
    const r = await completeJson(base, schema, p);
    expect(r.data).toEqual({ n: 2 });
    expect(p.calls).toBe(2);
    expect(r.inputTokens).toBe(20);
    expect((spy.mock.calls[1]![0] as { user: string }).user).toContain("KHÔNG hợp lệ");
  });

  it("sai cả hai lần → AI_BAD_OUTPUT (không gọi lần thứ ba)", async () => {
    const p = scripted(["xin chào", "vẫn không phải JSON"]);
    await expect(completeJson(base, schema, p)).rejects.toMatchObject({ code: "AI_BAD_OUTPUT" });
    expect(p.calls).toBe(2);
  });

  it("lỗi nhà cung cấp → AI_UNAVAILABLE với câu thân thiện, không lộ chi tiết", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const p = scripted([new AiProviderError(`Nhà cung cấp AI trả lỗi 500: key=${KEY}`, 500)]);
    const err = await completeJson(base, schema, p).catch((e) => e);
    expect(err.code).toBe("AI_UNAVAILABLE");
    expect(err.message).not.toContain(KEY);
    expect(p.calls).toBe(1);
  });
});
