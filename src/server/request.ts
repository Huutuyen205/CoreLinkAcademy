import { headers } from "next/headers";

/** IP của client cho rate limit. Sau reverse proxy cần đảm bảo proxy ghi đè X-Forwarded-For. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
}
