import { ButtonLink } from "@/components/ui/button";

// DECISION-D11: sai phạm vi dữ liệu cũng hiển thị trang này, không tiết lộ bản ghi có tồn tại hay không.
export default function NotFound() {
  return (
    <main id="noi-dung" className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-serif text-4xl text-accent">404</p>
      <h1 className="mt-3 text-2xl">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">Trang không tồn tại hoặc bạn không có quyền xem nội dung này.</p>
      <div className="mt-6">
        <ButtonLink href="/">Về trang chủ</ButtonLink>
      </div>
    </main>
  );
}
