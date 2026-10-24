// Thông báo đẩy trong ứng dụng: trình duyệt hỏi định kỳ (~30 giây) để hiện popup thông báo mới mà không cần bấm chuông.
// Chỉ trả thông báo của chính người đang đăng nhập. Mỗi lần hỏi cũng kích hoạt nhắc "sắp đến giờ" (có giới hạn tần suất).
import { getCurrentActor } from "@/server/auth/session";
import { db } from "@/server/db";
import { sendUpcomingSessionReminders } from "@/server/notifications/reminders";
import { unreadNotificationCount } from "@/server/notifications/service";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) return Response.json({ ok: false }, { status: 401, headers: NO_STORE });
  try {
    await sendUpcomingSessionReminders(new Date(), 45_000);
  } catch (error) {
    console.warn("[nhac-sap-gio]", error);
  }
  const [unread, rows] = await Promise.all([
    unreadNotificationCount(actor.id),
    db.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, kind: true, title: true, body: true, link: true, readAt: true, createdAt: true },
    }),
  ]);
  return Response.json(
    { ok: true, unread, items: rows.map((n) => ({ ...n, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })) },
    { headers: NO_STORE },
  );
}
