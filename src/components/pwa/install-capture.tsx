"use client";

import { useEffect } from "react";

/** Sự kiện cài đặt của Chrome/Edge (Android, Windows, macOS) — chưa có trong kiểu DOM chuẩn. */
export type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

declare global {
  interface Window {
    __installPrompt?: InstallPromptEvent | null;
  }
}

export const INSTALL_EVENT = "corelink:installable";

/**
 * `beforeinstallprompt` chỉ bắn MỘT lần, thường trước khi người dùng mở trang Cài ứng dụng →
 * giữ lại ở `window` để nút "Cài ứng dụng" dùng sau. Đặt ở layout gốc.
 */
export function InstallCapture() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // không hiện thanh cài mặc định; dùng nút của trang
      window.__installPrompt = e as InstallPromptEvent;
      window.dispatchEvent(new Event(INSTALL_EVENT));
    };
    const onInstalled = () => {
      window.__installPrompt = null;
      window.dispatchEvent(new Event(INSTALL_EVENT));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
