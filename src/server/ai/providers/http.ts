import { AiProviderError } from "./types";

/** POST JSON có timeout; lỗi HTTP → AiProviderError (chỉ giữ 300 ký tự đầu của phản hồi để ghi log). */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new AiProviderError(timedOut ? "Nhà cung cấp AI phản hồi quá chậm." : "Không kết nối được nhà cung cấp AI.");
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new AiProviderError(`Nhà cung cấp AI trả lỗi ${res.status}: ${detail}`, res.status);
  }
  return res.json();
}
