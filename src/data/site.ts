// Thông tin liên hệ của trung tâm. Giá trị trong ngoặc vuông là placeholder — thay bằng thông tin thật (QUESTION-Q02).

export const SITE = {
  name: "Core Link Academy",
  hotline: "[SỐ HOTLINE]",
  email: "[EMAIL TRUNG TÂM]",
  address: "[ĐỊA CHỈ TRUNG TÂM]",
  zalo: "[SỐ ZALO]",
  facebook: "https://www.facebook.com/CoreLinkAcademy",
  studentCount: "[SỐ HỌC VIÊN]",
} as const;

export function isPlaceholder(value: string): boolean {
  return value.startsWith("[");
}

/** Liên kết `tel:` khi đã có số thật; còn placeholder thì đưa người dùng tới form đăng ký. */
export function phoneHref(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  return isPlaceholder(value) || digits.length < 8 ? "/#dang-ky" : `tel:${digits}`;
}

export function zaloHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return isPlaceholder(value) || digits.length < 8 ? "/#dang-ky" : `https://zalo.me/${digits}`;
}

export const FOOTER_COURSE_LINKS = [
  { label: "Tiền tiểu học", href: "/khoa-hoc" },
  { label: "Tiểu học", href: "/khoa-hoc?khoi=3" },
  { label: "THCS", href: "/khoa-hoc?khoi=7" },
  { label: "THPT", href: "/khoa-hoc?khoi=11" },
  { label: "Luyện thi vào 10", href: "/khoa-hoc?mon=toan&khoi=9" },
  { label: "Tiếng Anh chuẩn quốc tế", href: "/khoa-hoc?mon=tieng-anh" },
];

export const FOOTER_SUPPORT_LINKS = [
  { label: "Đăng ký học thử", href: "/dang-ky-hoc-thu" },
  { label: "Kiểm tra đầu vào", href: "/#dang-ky" },
  { label: "Cổng học viên", href: "/dang-nhap" },
  { label: "Cổng phụ huynh", href: "/dang-nhap" },
  { label: "Liên hệ", href: "/#dang-ky" },
];
