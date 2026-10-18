'use client';

import React, { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Kiểm tra đã cài PWA chưa
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // 2. Đăng ký Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[CoreLink PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[CoreLink PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 3. Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Phát hiện iOS Safari
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIos && !isRunningStandalone) {
      // Chỉ hiện nhắc nhở nếu chưa lưu vào home screen
      const dismissed = localStorage.getItem('corelink_ios_pwa_dismissed');
      if (!dismissed) {
        setShowIosGuide(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleDismissIos = () => {
    localStorage.setItem('corelink_ios_pwa_dismissed', 'true');
    setShowIosGuide(false);
  };

  // Nếu đã ở chế độ standalone app thì không cần hiện banner
  if (isStandalone) return null;

  return (
    <>
      {/* 1. Android / Desktop Chrome Install Banner */}
      {installPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              CL
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Cài đặt CoreLink App</p>
              <p className="text-xs text-slate-500">Trải nghiệm mượt mà, nhận thông báo tức thì</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
            >
              Cài Đặt
            </button>
            <button
              onClick={() => setInstallPrompt(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Add to Home Screen Modal Guide (FR-1004) */}
      {showIosGuide && (
        <div className="fixed bottom-4 left-4 right-4 sm:max-w-md sm:mx-auto z-50 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-800 text-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <p className="font-bold text-slate-900">Thêm CoreLink vào Màn hình chính</p>
            </div>
            <button onClick={handleDismissIos} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Để nhận thông báo điểm danh và bài tập trên iOS Safari:
          </p>
          <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
            <li>
              Bấm nút <span className="text-blue-600 font-semibold">Chia sẻ (Share) ⎙</span> ở thanh dưới Safari
            </li>
            <li>
              Cuộn xuống và chọn <span className="text-blue-600 font-semibold">"Thêm vào MH chính" (Add to Home Screen)</span>
            </li>
            <li>Bấm <span className="text-blue-600 font-semibold">Thêm (Add)</span> ở góc trên phải</li>
          </ol>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleDismissIos}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
