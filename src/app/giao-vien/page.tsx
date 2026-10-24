import { redirect } from "next/navigation";

// Giáo viên vào thẳng lịch dạy (không có trang tổng quan).
export default function TeacherHome() {
  redirect("/giao-vien/lich");
}
