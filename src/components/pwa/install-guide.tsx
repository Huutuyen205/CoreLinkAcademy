"use client";

import { CheckCircle2, Download, EllipsisVertical, MonitorDown, PlusSquare, Share, Smartphone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { INSTALL_EVENT } from "./install-capture";

type Platform = "ios" | "android" | "desktop";

function detect(): { platform: Platform; installed: boolean; iosNotSafari: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Trên iOS chỉ Safari (và iOS 16.4+ cả Chrome/Edge) có "Thêm vào MH chính"; ứng dụng nhúng như Zalo/Facebook thì không.
  const iosNotSafari = ios && /FBAN|FBAV|Zalo|Instagram|Line\//i.test(ua);
  return { platform: ios ? "ios" : android ? "android" : "desktop", installed, iosNotSafari };
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

const key = "inline-flex items-center gap-1 rounded-md border border-line bg-paper px-1.5 py-0.5 text-sm font-semibold";

/** Hướng dẫn cài CoreLink như ứng dụng: nút cài 1 chạm (Android/máy tính), các bước "Thêm vào MH chính" (iPhone). */
export function InstallGuide() {
  const [info, setInfo] = useState<ReturnType<typeof detect> | null>(null);
  const [tab, setTab] = useState<Platform>("android");
  const [canPrompt, setCanPrompt] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const d = detect();
    setInfo(d);
    setTab(d.platform);
    const sync = () => setCanPrompt(Boolean(window.__installPrompt));
    sync();
    window.addEventListener(INSTALL_EVENT, sync);
    return () => window.removeEventListener(INSTALL_EVENT, sync);
  }, []);

  const install = async () => {
    const e = window.__installPrompt;
    if (!e) return;
    await e.prompt();
    const choice = await e.userChoice;
    window.__installPrompt = null;
    setCanPrompt(false);
    setResult(choice.outcome === "accepted" ? "Đã cài! Tìm biểu tượng CoreLink trên màn hình chính." : "Bạn đã hủy. Có thể cài lại bất cứ lúc nào.");
  };

  if (info?.installed) {
    return (
      <div className="flex items-start gap-3 rounded-block border border-success/30 bg-success-soft p-4 text-success">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
        <p>
          Bạn đang dùng CoreLink dạng ứng dụng. Vào <strong>Thông báo</strong> để bật thông báo đẩy nếu chưa bật.
        </p>
      </div>
    );
  }

  const tabs: { id: Platform; label: string; icon: typeof Smartphone }[] = [
    { id: "android", label: "Android", icon: Smartphone },
    { id: "ios", label: "iPhone / iPad", icon: Smartphone },
    { id: "desktop", label: "Máy tính", icon: MonitorDown },
  ];

  return (
    <div className="space-y-5">
      {canPrompt && (
        <div className="flex flex-wrap items-center gap-4 rounded-block bg-gradient-to-r from-primary to-accent p-5 text-white">
          <Download className="size-8 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">Thiết bị của bạn cài được CoreLink chỉ với một chạm — không cần CH Play hay App Store.</p>
          <button type="button" onClick={install} className="inline-flex min-h-11 items-center rounded-control bg-white px-5 font-semibold text-primary hover:bg-brand-tint">
            Cài ứng dụng
          </button>
        </div>
      )}
      {result && <p className="font-medium text-primary">{result}</p>}

      <div role="tablist" aria-label="Chọn thiết bị" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold", tab === t.id ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink")}
          >
            <t.icon className="size-4" aria-hidden="true" />
            {t.label}
            {info?.platform === t.id && <span className="text-xs font-normal opacity-80">(máy này)</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="rounded-block border border-line bg-surface p-5">
        {tab === "android" && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Android — Chrome, Samsung Internet, Edge</h2>
            <p className="mb-4 text-sm text-muted">Cách nhanh nhất: bấm nút “Cài ứng dụng” ở trên (hiện khi trình duyệt hỗ trợ). Nếu không thấy nút:</p>
            <ol className="space-y-3">
              <Step n={1}>Mở trang này bằng <strong>Chrome</strong> (không mở trong Zalo/Facebook).</Step>
              <Step n={2}>
                Bấm nút menu <span className={key}><EllipsisVertical className="size-4" aria-hidden="true" /> ba chấm</span> ở góc trên bên phải.
              </Step>
              <Step n={3}>
                Chọn <span className={key}>Cài đặt ứng dụng</span> (hoặc <span className={key}>Thêm vào màn hình chính</span>) → <span className={key}>Cài đặt</span>.
              </Step>
              <Step n={4}>Mở CoreLink từ biểu tượng trên màn hình chính, đăng nhập, vào <strong>Thông báo</strong> → “Bật thông báo đẩy”.</Step>
            </ol>
          </>
        )}
        {tab === "ios" && (
          <>
            <h2 className="mb-3 text-lg font-semibold">iPhone / iPad — Thêm vào màn hình chính</h2>
            {info?.iosNotSafari && (
              <p className="mb-4 rounded-control bg-warning-soft p-3 text-sm text-warning">Bạn đang mở trong ứng dụng khác (Zalo/Facebook…). Hãy bấm “Mở bằng Safari” trước.</p>
            )}
            <ol className="space-y-3">
              <Step n={1}>Mở trang này bằng <strong>Safari</strong>.</Step>
              <Step n={2}>
                Bấm nút <span className={key}><Share className="size-4" aria-hidden="true" /> Chia sẻ</span> ở thanh dưới cùng (iPad: góc trên).
              </Step>
              <Step n={3}>
                Kéo xuống, chọn <span className={key}><PlusSquare className="size-4" aria-hidden="true" /> Thêm vào MH chính</span>, rồi bấm <span className={key}>Thêm</span>.
              </Step>
              <Step n={4}>
                Mở CoreLink <strong>từ biểu tượng trên màn hình chính</strong>, đăng nhập, vào <strong>Thông báo</strong> → “Bật thông báo đẩy” (cần iOS 16.4 trở lên).
              </Step>
            </ol>
          </>
        )}
        {tab === "desktop" && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Máy tính — Chrome hoặc Edge</h2>
            <ol className="space-y-3">
              <Step n={1}>
                Bấm biểu tượng <span className={key}><MonitorDown className="size-4" aria-hidden="true" /> Cài đặt</span> ở cuối thanh địa chỉ (hoặc nút “Cài ứng dụng” ở trên).
              </Step>
              <Step n={2}>Chọn <span className={key}>Cài đặt</span> — CoreLink mở thành cửa sổ riêng, có biểu tượng trên thanh tác vụ.</Step>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
