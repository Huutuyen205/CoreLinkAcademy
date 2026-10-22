import type { MetadataRoute } from "next";

// Cài như ứng dụng (DECISION-D31): Android/Chrome/Edge cài trực tiếp ("Cài đặt ứng dụng");
// iPhone/iPad dùng Safari → "Thêm vào MH chính" (iOS 16.4+ mới nhận được thông báo đẩy khi mở từ màn hình chính).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CoreLink Academy",
    short_name: "CoreLink",
    description: "Cổng học tập CoreLink Academy: lịch học, bài tập, điểm, thông báo và tin nhắn.",
    start_url: "/dang-nhap?nguon=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F7FE",
    theme_color: "#1F2F98",
    lang: "vi",
    categories: ["education"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Thông báo", url: "/thong-bao", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
      { name: "Tin nhắn", url: "/tin-nhan", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
