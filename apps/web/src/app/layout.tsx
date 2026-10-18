import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoreLink Academy — Học Tiếng Anh Thông Minh Tích Hợp AI',
  description: 'Hệ thống quản lý đào tạo tiếng Anh thế hệ mới từ tiền tiểu học đến luyện thi chứng chỉ du học.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoreLink Academy',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import ChatbotWidget from '../components/chatbot/ChatbotWidget';
import PwaRegister from '../components/pwa/PwaRegister';
import MobileBottomNav from '../components/mobile/MobileBottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-[#F7F9FC] text-[#172033] antialiased min-h-screen flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
        {children}
        <ChatbotWidget />
        <PwaRegister />
        <MobileBottomNav />
      </body>
    </html>
  );
}
