import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "CoreLink Academy — Học viện đào tạo phổ thông", template: "%s · CoreLink Academy" },
  description:
    "CoreLink Academy đào tạo Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học cho học sinh phổ thông. Đăng ký học thử miễn phí.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1F3A5F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
