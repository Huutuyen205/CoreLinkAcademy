import type { ReactNode } from "react";
import { FloatingButtons } from "@/components/home/floating-buttons";
import { Footer } from "@/components/home/footer";
import { Header } from "@/components/home/header";
import { MotionProvider } from "@/components/home/motion";

/**
 * Khung các trang công khai: header dính, chân trang, nút nổi.
 * `bare`: nội dung tự quản chiều rộng (trang chủ có các khối tràn viền); mặc định bọc trong khung 1120px.
 */
export function PublicShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return (
    <MotionProvider>
      <div className="flex min-h-dvh flex-col bg-white">
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
        >
          Bỏ qua tới nội dung
        </a>
        <Header />
        {bare ? (
          <main id="noi-dung" className="flex-1">
            {children}
          </main>
        ) : (
          <div className="flex-1 bg-paper">
            <main id="noi-dung" className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:py-12">
              {children}
            </main>
          </div>
        )}
        <Footer />
        <FloatingButtons />
      </div>
    </MotionProvider>
  );
}
