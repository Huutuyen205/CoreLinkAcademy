"use server";

import { z } from "zod";
import { runAction } from "@/server/action";
import { requireActor } from "@/server/auth/guard";
import type { ActionState } from "@/server/errors";
import { removePushSubscription, savePushSubscription, sendPushNow } from "./service";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Bật thông báo đẩy cho thiết bị hiện tại (dữ liệu từ `PushSubscription.toJSON()` của trình duyệt). */
export async function subscribePushAction(subscription: unknown, userAgent: string): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false, message: "Đăng ký thông báo không hợp lệ." };
  const result = await runAction(() =>
    savePushSubscription(actor, { endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent: userAgent.slice(0, 300) || null }),
  );
  if (!result.ok) return result.state;
  return { ok: true, message: "Đã bật thông báo đẩy trên thiết bị này." };
}

export async function unsubscribePushAction(endpoint: string): Promise<ActionState> {
  const actor = await requireActor();
  if (typeof endpoint !== "string" || endpoint.length > 1000) return { ok: false, message: "Không hợp lệ." };
  await removePushSubscription(actor, endpoint);
  return { ok: true, message: "Đã tắt thông báo đẩy trên thiết bị này." };
}

/** Gửi thử một thông báo đẩy tới chính mình. */
export async function testPushAction(): Promise<ActionState> {
  const actor = await requireActor();
  await sendPushNow([actor.id], { title: "CoreLink Academy", body: "Thông báo đẩy đã hoạt động trên thiết bị của bạn.", url: "/thong-bao", tag: "test" });
  return { ok: true, message: "Đã gửi thông báo thử." };
}
