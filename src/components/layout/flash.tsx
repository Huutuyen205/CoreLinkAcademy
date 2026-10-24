import { Alert } from "@/components/ui/feedback";

// Thông báo sau khi chuyển trang (`?thongbao=<mã>`). Chỉ hiển thị chuỗi định sẵn, không in tham số URL.
const MESSAGES: Record<string, string> = {
  "doi-mat-khau": "Đã đổi mật khẩu.",
  "tao-lop": "Đã mở lớp và sinh lịch học.",
  "xoa-lop": "Đã xóa lớp.",
  "tao-bai": "Đã tạo bài tập. Thêm câu hỏi rồi giao cho lớp.",
  "tao-bai-ai": "Đã tạo bài tập NHÁP từ nội dung AI. Hãy kiểm tra từng câu và đáp án, sửa nếu cần rồi mới giao cho lớp.",
  luu: "Đã lưu.",
  "xoa-khoa": "Đã xóa khóa học.",
  "tao-lead": "Đã tạo lead.",
  "xoa-bai": "Đã xóa bài tập.",
  "giao-bai": "Đã giao bài cho lớp. Học sinh đã thấy bài trong mục Bài tập.",
  "dong-bai": "Đã đóng bài. Học sinh không nộp thêm được.",
  "cong-bo": "Đã công bố kết quả. Học sinh và phụ huynh đã xem được điểm và nhận được thông báo.",
  "xoa-tai-lieu": "Đã xóa tài liệu.",
  "gui-don": "Đã gửi đơn xin nghỉ. Giáo viên/trung tâm sẽ phản hồi qua thông báo.",
  "duyet-don": "Đã duyệt đơn xin nghỉ. Buổi học được ghi \"Có phép\" và phụ huynh đã nhận thông báo.",
  "tu-choi-don": "Đã từ chối đơn xin nghỉ. Phụ huynh đã nhận thông báo.",
  "duyet-de-xuat": "Đã duyệt đề xuất và cập nhật lịch. Giáo viên và lớp đã nhận thông báo.",
  "tu-choi-de-xuat": "Đã từ chối đề xuất. Giáo viên đã nhận thông báo.",
  "tra-bai": "Đã yêu cầu học sinh nộp lại. Học sinh và phụ huynh đã nhận thông báo.",
  "xoa-bai-lam": "Đã xóa bài làm của học sinh.",
  "tao-de": "Đã tạo đề luyện tập. Thêm câu hỏi rồi bật \"Mở cho học sinh\".",
  "xoa-de": "Đã xóa đề luyện tập.",
  "huy-buoi": "Đã hủy buổi học. Lớp đã nhận thông báo.",
};

export function Flash({ code }: { code?: string | string[] }) {
  const message = typeof code === "string" ? MESSAGES[code] : undefined;
  return message ? (
    <Alert tone="success" className="mb-6">
      {message}
    </Alert>
  ) : null;
}
