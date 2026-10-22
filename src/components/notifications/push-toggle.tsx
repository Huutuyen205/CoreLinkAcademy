"use client";

import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { subscribePushAction, testPushAction, unsubscribePushAction } from "@/server/push/actions";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** Bật/tắt thông báo đẩy (Web Push) cho thiết bị đang dùng — FR-048. */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    (async () => {
      const supported = PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        // iPhone/iPad: Safari chỉ hỗ trợ khi web được thêm vào màn hình chính.
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setStatus(PUBLIC_KEY && ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  const enable = () =>
    start(async () => {
      setMessage(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      try {
        const reg = await registration();
        await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(PUBLIC_KEY) }));
        const result = await subscribePushAction(sub.toJSON(), navigator.userAgent);
        setMessage(result.message ?? null);
        setStatus(result.ok ? "on" : "off");
      } catch {
        setMessage("Không bật được thông báo đẩy trên trình duyệt này.");
      }
    });

  const disable = () =>
    start(async () => {
      setMessage(null);
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      setMessage("Đã tắt thông báo đẩy trên thiết bị này.");
    });

  const test = () =>
    start(async () => {
      const result = await testPushAction();
      setMessage(result.message ?? null);
    });

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-block border border-line bg-surface px-4 py-3">
      <span className={status === "on" ? "text-success" : "text-muted"}>
        {status === "on" ? <BellRing className="size-5" aria-hidden="true" /> : <BellOff className="size-5" aria-hidden="true" />}
      </span>
      <p className="min-w-0 flex-1 text-sm">
        {status === "on" && "Thông báo đẩy đang bật: thông báo mới và tin nhắn sẽ hiện trên thiết bị này kể cả khi không mở web."}
        {status === "off" && "Bật thông báo đẩy để nhận thông báo ngay trên điện thoại/máy tính, kể cả khi không mở web."}
        {status === "denied" && "Trình duyệt đang chặn thông báo của trang này. Mở cài đặt trang (biểu tượng ổ khóa cạnh địa chỉ) để cho phép, rồi tải lại."}
        {status === "ios-install" && (
          <>
            Trên iPhone/iPad cần cài CoreLink vào màn hình chính trước (Chia sẻ → “Thêm vào MH chính”).{" "}
            <a href="/cai-ung-dung">Xem hướng dẫn</a>
          </>
        )}
        {message && <span className="mt-1 block font-medium text-primary">{message}</span>}
      </p>
      {status === "off" && (
        <button type="button" onClick={enable} disabled={pending} className="inline-flex min-h-9 items-center rounded-control bg-primary px-3 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Đang bật…" : "Bật thông báo đẩy"}
        </button>
      )}
      {status === "on" && (
        <span className="flex gap-2">
          <button type="button" onClick={test} disabled={pending} className="inline-flex min-h-9 items-center rounded-control border border-primary/30 px-3 text-sm font-semibold text-primary disabled:opacity-60">
            Gửi thử
          </button>
          <button type="button" onClick={disable} disabled={pending} className="inline-flex min-h-9 items-center rounded-control px-3 text-sm text-muted hover:text-danger disabled:opacity-60">
            Tắt
          </button>
        </span>
      )}
    </div>
  );
}
