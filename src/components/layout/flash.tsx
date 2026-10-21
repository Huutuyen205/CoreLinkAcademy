import { Alert } from "@/components/ui/feedback";

// Thông báo sau khi chuyển trang (`?thongbao=<mã>`). Chỉ hiển thị chuỗi định sẵn, không in tham số URL.
const MESSAGES: Record<string, string> = {
  "doi-mat-khau": "Đã đổi mật khẩu.",
  "tao-lop": "Đã mở lớp và sinh lịch học.",
  "xoa-lop": "Đã xóa lớp.",
  "tao-bai": "Đã tạo bài tập. Thêm câu hỏi rồi giao cho lớp.",
  luu: "Đã lưu.",
  "xoa-khoa": "Đã xóa khóa học.",
  "tao-lead": "Đã tạo lead.",
};

export function Flash({ code }: { code?: string | string[] }) {
  const message = typeof code === "string" ? MESSAGES[code] : undefined;
  return message ? (
    <Alert tone="success" className="mb-6">
      {message}
    </Alert>
  ) : null;
}
