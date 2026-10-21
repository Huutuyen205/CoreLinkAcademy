import type { Role } from "@prisma/client";
import type { NavItem } from "./nav-links";

export function managementNav(role: Role): NavItem[] {
  const items: NavItem[] = [
    { href: "/quan-ly", label: "Tổng quan" },
    { href: "/quan-ly/lead", label: "Lead", section: "Tuyển sinh & đào tạo" },
    { href: "/quan-ly/lop", label: "Lớp học" },
    { href: "/quan-ly/lich", label: "Lịch tổng" },
    { href: "/quan-ly/de-xuat", label: "Đề xuất & đơn nghỉ" },
    { href: "/quan-ly/bao-cao", label: "Báo cáo" },
    { href: "/quan-ly/hoc-vien", label: "Học viên", section: "Con người" },
    { href: "/quan-ly/giao-vien", label: "Giáo viên" },
    { href: "/quan-ly/phu-huynh", label: "Phụ huynh" },
    { href: "/tai-lieu", label: "Giáo trình & tài liệu", section: "Tài liệu & tương tác" },
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
  { href: "/giao-vien", label: "Tổng quan" },
  { href: "/giao-vien/lich", label: "Lịch dạy" },
  { href: "/giao-vien/lop", label: "Lớp của tôi" },
  { href: "/giao-vien/de-xuat", label: "Đề xuất & đơn nghỉ" },
  { href: "/tai-lieu", label: "Tài liệu & giáo án" },
  { href: "/thong-bao", label: "Thông báo" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];
export const teacherBottomNav: NavItem[] = [
  { href: "/giao-vien", label: "Tổng quan" },
  { href: "/giao-vien/lich", label: "Lịch dạy" },
  { href: "/giao-vien/lop", label: "Lớp" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];

export const studentNav: NavItem[] = [
  { href: "/hoc-sinh", label: "Tổng quan" },
  { href: "/hoc-sinh/lich", label: "Lịch học" },
  { href: "/hoc-sinh/bai-tap", label: "Bài tập" },
  { href: "/hoc-sinh/ket-qua", label: "Kết quả" },
  { href: "/tai-lieu", label: "Tài liệu" },
  { href: "/thong-bao", label: "Thông báo" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];
export const studentBottomNav: NavItem[] = studentNav.slice(0, 4);

export const parentNav: NavItem[] = [
  { href: "/phu-huynh", label: "Theo dõi con" },
  { href: "/phu-huynh/bai-tap", label: "Bài tập" },
  { href: "/phu-huynh/don-nghi", label: "Đơn xin nghỉ" },
  { href: "/tai-lieu", label: "Tài liệu" },
  { href: "/thong-bao", label: "Thông báo" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];
export const parentBottomNav: NavItem[] = [
  { href: "/phu-huynh", label: "Con" },
  { href: "/phu-huynh/bai-tap", label: "Bài tập" },
  { href: "/thong-bao", label: "Thông báo" },
  { href: "/tin-nhan", label: "Tin nhắn" },
];

/** Menu cho các trang dùng chung mọi vai trò (tài liệu, thông báo, tin nhắn, tài khoản). */
export function navForRole(role: Role): { nav: NavItem[]; bottomNav?: NavItem[] } {
  if (role === "ADMIN" || role === "STAFF") return { nav: managementNav(role) };
  if (role === "TEACHER") return { nav: teacherNav, bottomNav: teacherBottomNav };
  if (role === "STUDENT") return { nav: studentNav, bottomNav: studentBottomNav };
  return { nav: parentNav, bottomNav: parentBottomNav };
}
