import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

// Chỉ dùng cho wordmark "CORE LINK" (logo dùng chữ có chân).
const serif = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Core Link Academy — Học viện đào tạo phổ thông", template: "%s · Core Link Academy" },
  description:
    "Core Link Academy đào tạo Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học cho học sinh phổ thông. Đăng ký học thử miễn phí.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1F2F98" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
