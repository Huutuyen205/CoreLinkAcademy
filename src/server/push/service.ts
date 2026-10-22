// Thông báo đẩy (Web Push, FR-048): gửi tới trình duyệt/điện thoại đã bật nhận thông báo.
// Không có khóa VAPID → tính năng tự tắt, hộp thư thông báo trong web vẫn chạy bình thường.
import { after } from "next/server";
import webpush from "web-push";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";

export type PushPayload = { title: string; body: string; url?: string | null; tag?: string };

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

export function pushEnabled(): boolean {
  return PUBLIC_KEY.length > 0 && PRIVATE_KEY.length > 0;
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

export type SubscriptionInput = { endpoint: string; p256dh: string; auth: string; userAgent: string | null };

/** Lưu đăng ký của thiết bị hiện tại. Endpoint đã thuộc người khác (đổi tài khoản trên cùng máy) → chuyển sang người này. */
export async function savePushSubscription(actor: Actor, input: SubscriptionInput): Promise<void> {
  if (!pushEnabled()) throw new DomainError("PUSH_DISABLED", "Máy chủ chưa cấu hình thông báo đẩy.");
  if (!/^https:\/\//.test(input.endpoint)) throw new DomainError("INVALID_ENDPOINT", "Đăng ký thông báo không hợp lệ.");
  const data = { userId: actor.id, p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent };
  await db.pushSubscription.upsert({ where: { endpoint: input.endpoint }, update: data, create: { endpoint: input.endpoint, ...data } });
}

export async function removePushSubscription(actor: Actor, endpoint: string): Promise<void> {
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: actor.id } });
}

/** Gửi ngay (dùng trong `after`). Endpoint hết hạn (404/410) bị xóa; lỗi khác chỉ ghi log, không làm hỏng nghiệp vụ. */
export async function sendPushNow(userIds: string[], payload: PushPayload): Promise<void> {
  if (!pushEnabled() || userIds.length === 0) return;
  configure();
  const subs = await db.pushSubscription.findMany({ where: { userId: { in: [...new Set(userIds)] } }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
  if (subs.length === 0) return;
  const body = JSON.stringify({
    title: payload.title.slice(0, 120),
    body: payload.body.length > 240 ? `${payload.body.slice(0, 237)}…` : payload.body,
    url: payload.url && payload.url.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/thong-bao",
    tag: payload.tag,
  });
  const expired: string[] = [];
  await Promise.all(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 24 * 60 * 60 }).catch((error: { statusCode?: number }) => {
        if (error.statusCode === 404 || error.statusCode === 410) expired.push(s.id);
        else console.warn("[push] gửi lỗi", error.statusCode ?? error);
      }),
    ),
  );
  if (expired.length > 0) await db.pushSubscription.deleteMany({ where: { id: { in: expired } } });
}

/**
 * Xếp lịch gửi sau khi trả response (`after`), để không làm chậm thao tác của người dùng.
 * `notificationIds`: chỉ gửi cho thông báo đã thực sự được lưu (transaction nghiệp vụ có thể rollback).
 * Ngoài ngữ cảnh request (seed, test) thì bỏ qua.
 */
export function queuePush(userIds: string[], payload: PushPayload, notificationIds?: string[]): void {
  if (!pushEnabled() || userIds.length === 0) return;
  try {
    after(async () => {
      try {
        let targets = userIds;
        if (notificationIds) {
          const saved = await db.notification.findMany({ where: { id: { in: notificationIds } }, select: { userId: true } });
          targets = saved.map((n) => n.userId);
        }
        await sendPushNow(targets, payload);
      } catch (error) {
        console.warn("[push]", error);
      }
    });
  } catch {
    // Không có request scope.
  }
}
