// Vercel Cron (vercel.json) gọi mỗi ngày 12:00 UTC = 19:00 giờ VN — FEAT-B4.
// Vercel tự gửi `Authorization: Bearer <CRON_SECRET>` khi biến CRON_SECRET được đặt; thiếu biến → tắt.
import { timingSafeEqual } from "node:crypto";
import { sendTomorrowReminders } from "@/server/notifications/reminders";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Không tìm thấy.", { status: 404 });
  const result = await sendTomorrowReminders();
  return Response.json({ ok: true, ...result });
}
