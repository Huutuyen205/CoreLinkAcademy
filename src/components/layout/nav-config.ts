import type { Role } from "@prisma/client";
import type { NavItem } from "./nav-links";

export function managementNav(role: Role): NavItem[] {
  const items: NavItem[] = [
    { href: "/quan-ly", label: "Tổng quan" },
    { href: "/quan-ly/lead", label: "Lead" },
    { href: "/quan-ly/lop", label: "Lớp học" },
    { href: "/quan-ly/hoc-vien", label: "Học viên" },
  ];
  if (role === "ADMIN") {
    items.push(
      { href: "/quan-ly/nguoi-dung", label: "Người dùng" },
      { href: "/quan-ly/khoa-hoc", label: "Khóa học" },
      { href: "/quan-ly/mon-hoc", label: "Môn học" },
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
];

export const studentNav: NavItem[] = [
  { href: "/hoc-sinh", label: "Tổng quan" },
  { href: "/hoc-sinh/lich", label: "Lịch học" },
  { href: "/hoc-sinh/bai-tap", label: "Bài tập" },
  { href: "/hoc-sinh/ket-qua", label: "Kết quả" },
];

export const parentNav: NavItem[] = [{ href: "/phu-huynh", label: "Theo dõi con" }];
