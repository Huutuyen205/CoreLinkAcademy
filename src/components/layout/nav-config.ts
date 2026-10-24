import type { Role } from "@prisma/client";
import type { NavItem } from "./nav-links";

export function managementNav(role: Role): NavItem[] {
  const items: NavItem[] = [
    { href: "/quan-ly", label: "Tổng quan" },
    { href: "/quan-ly/lead", label: "Lead", section: "Tuyển sinh & đào tạo" },
    { href: "/quan-ly/lop", label: "Lớp học" },
    { href: "/quan-ly/lich", label: "Lịch tổng" },
    { href: "/quan-ly/de-xuat", label: "Đề xuất & đơn nghỉ" },
    { href: "/quan-ly/chuyen-can", label: "Chuyên cần" },
    { href: "/quan-ly/danh-gia", label: "Đánh giá của GV" },
    { href: "/quan-ly/bao-cao", label: "Báo cáo" },
    { href: "/quan-ly/hoc-vien", label: "Học viên", section: "Con người" },
    { href: "/quan-ly/giao-vien", label: "Giáo viên" },
    { href: "/quan-ly/phu-huynh", label: "Phụ huynh" },
    { href: "/tai-lieu", label: "Giáo trình, tài liệu, giáo án", section: "Tài liệu & tương tác" },
    { href: "/on-luyen", label: "Đề luyện tập" },
    { href: "/thong-bao", label: "Thông báo" },
    { href: "/tin-nhan", label: "Tin nhắn" },
  ];
  if (role === "ADMIN") {
    items.push(
      { href: "/quan-ly/nguoi-dung", label: "Người dùng", section: "Quản trị" },
      { href: "/quan-ly/khoa-hoc", label: "Khóa học" },
      { href: "/quan-ly/mon-hoc", label: "Môn & cấp học" },
      { href: "/quan-ly/phong", label: "Phòng học" },
      { href: "/quan-ly/nhat-ky", label: "Nhật ký" },
    );
  }
  return items;
}

export const teacherNav: NavItem[] = [
  { href: "/giao-vien/lich", label: "Lịch" },
  { href: "/giao-vien/lop", label: "Lớp của tôi" },
  { href: "/giao-vien/don", label: "Đơn" },
  { href: "/tin-nhan", label: "Tin nhắn" },
  { href: "/giao-vien/ho-so", label: "Hồ sơ và lịch rảnh" },
];
/** Lịch ở giữa thanh đáy điện thoại. */
export const teacherBottomNav: NavItem[] = [
  { href: "/giao-vien/lop", label: "Lớp" },
  { href: "/giao-vien/don", label: "Đơn" },
  { href: "/giao-vien/lich", label: "Lịch" },
  { href: "/tin-nhan", label: "Tin nhắn" },
  { href: "/giao-vien/ho-so", label: "Hồ sơ" },
];

// DECISION-D41: học sinh có 4 mục; kết quả, tự ôn luyện, tài liệu gộp vào Lớp học / Bài tập; thông báo ở chuông.
export const studentNav: NavItem[] = [
  { href: "/hoc-sinh/lich", label: "Lịch học" },
  { href: "/hoc-sinh/lop", label: "Lớp học" },
  { href: "/hoc-sinh/bai-tap", label: "Bài tập" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];
export const studentBottomNav: NavItem[] = studentNav;

// DECISION-D42: phụ huynh dùng y hệt giao diện học sinh cho con đang chọn (ô chọn con ở thanh trên), thêm Đơn xin nghỉ.
export const parentNav: NavItem[] = [
  { href: "/phu-huynh/lich", label: "Lịch học" },
  { href: "/phu-huynh/lop", label: "Lớp học" },
  { href: "/phu-huynh/bai-tap", label: "Bài tập" },
  { href: "/phu-huynh/don-nghi", label: "Đơn xin nghỉ" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];
export const parentBottomNav: NavItem[] = parentNav;

/** Menu cho các trang dùng chung mọi vai trò (tài liệu, thông báo, tin nhắn, tài khoản). */
export function navForRole(role: Role): { nav: NavItem[]; bottomNav?: NavItem[] } {
  if (role === "ADMIN" || role === "STAFF") return { nav: managementNav(role) }; // STAFF: vai trò đã ngừng, không còn phiên hợp lệ
  if (role === "TEACHER") return { nav: teacherNav, bottomNav: teacherBottomNav };
  if (role === "STUDENT") return { nav: studentNav, bottomNav: studentBottomNav };
  return { nav: parentNav, bottomNav: parentBottomNav };
}
