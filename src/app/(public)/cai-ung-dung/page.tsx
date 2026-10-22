import type { Metadata } from "next";
import Image from "next/image";
import { BellRing, WifiOff, Zap } from "lucide-react";
import { InstallGuide } from "@/components/pwa/install-guide";

export const metadata: Metadata = {
  title: "Cài ứng dụng",
  description: "Cài CoreLink Academy lên điện thoại hoặc máy tính: Android cài một chạm, iPhone dùng “Thêm vào MH chính”.",
};

// DECISION-D31: ứng dụng web cài được (PWA) — không qua CH Play / App Store.
export default function InstallAppPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <Image src="/brand/icon-192.png" alt="" width={72} height={72} className="size-16 shrink-0 rounded-2xl shadow-md sm:size-[72px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Cài ứng dụng CoreLink</h1>
          <p className="text-muted">Mở nhanh từ màn hình chính, nhận thông báo đẩy về lịch học, điểm và tin nhắn.</p>
        </div>
      </div>
      <ul className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Zap, text: "Mở một chạm, toàn màn hình như ứng dụng" },
          { icon: BellRing, text: "Thông báo đẩy kể cả khi không mở web" },
          { icon: WifiOff, text: "Không tốn dung lượng, tự cập nhật bản mới" },
        ].map((f) => (
          <li key={f.text} className="flex items-start gap-2 rounded-block border border-line bg-surface p-3 text-sm">
            <f.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            {f.text}
          </li>
        ))}
      </ul>
      <InstallGuide />
    </div>
  );
}
