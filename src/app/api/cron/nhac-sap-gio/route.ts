// Nhắc "sắp đến giờ học / dạy" bằng cron (tùy chọn, mỗi 5–10 phút). Không có cron vẫn chạy khi có người mở web (api/thong-bao/moi),
// nhưng cron giúp thông báo đẩy tới thiết bị cả khi không ai mở web. Dùng chung CRON_SECRET với nhac-lich.
import { timingSafeEqual } from "node:crypto";
import { sendUpcomingSessionReminders } from "@/server/notifications/reminders";

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
  return Response.json({ ok: true, ...(await sendUpcomingSessionReminders()) });
}
