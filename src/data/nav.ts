// Menu chính. Các mục chưa có trang riêng trỏ tới khối tương ứng trên trang chủ (neo `#…`) hoặc danh mục khóa học,
// để không có liên kết chết. Khi bổ sung trang thật (Pha 2) chỉ cần đổi `href` ở đây.

export type NavChild = { label: string; href: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

export const NAV_ITEMS: NavItem[] = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Giới thiệu",
    href: "/#vi-sao",
    children: [
      { label: "Thư ngỏ của Giám đốc", href: "/#vi-sao" },
      { label: "Lịch sử hình thành", href: "/#so-lieu" },
      { label: "Sứ mệnh – Tầm nhìn", href: "/#vi-sao" },
      { label: "Đội ngũ giáo viên", href: "/#giao-vien" },
      { label: "Cơ sở vật chất", href: "/#dang-ky" },
      { label: "Đối tác", href: "/#dang-ky" },
    ],
  },
  {
    label: "Khóa học",
    href: "/khoa-hoc",
    children: [
      { label: "Tiền tiểu học", href: "/#chuong-trinh" },
      { label: "Tiểu học", href: "/khoa-hoc?khoi=3" },
      { label: "THCS", href: "/khoa-hoc?khoi=7" },
      { label: "THPT", href: "/khoa-hoc?khoi=11" },
      { label: "Luyện thi vào 10", href: "/khoa-hoc?mon=toan&khoi=9" },
      { label: "Luyện thi tốt nghiệp THPT", href: "/khoa-hoc?khoi=12" },
      { label: "Tiếng Anh chuẩn quốc tế", href: "/khoa-hoc?mon=tieng-anh" },
    ],
  },
  {
    label: "Tuyển sinh",
    href: "/dang-ky-hoc-thu",
    children: [
      { label: "Thông báo tuyển sinh", href: "/#tin-tuc" },
      { label: "Lịch khai giảng", href: "/khoa-hoc" },
      { label: "Đăng ký học thử", href: "/dang-ky-hoc-thu" },
      { label: "Kiểm tra đầu vào", href: "/#dang-ky" },
      { label: "Học phí – Ưu đãi", href: "/khoa-hoc" },
      { label: "Học bổng", href: "/#tin-tuc" },
    ],
  },
  {
    label: "Đào tạo",
    href: "/#chuong-trinh",
    children: [
      { label: "Thời khóa biểu", href: "/dang-nhap" },
      { label: "Lịch thi thử", href: "/#tin-tuc" },
      { label: "Lộ trình học tập", href: "/#chuong-trinh" },
      { label: "Chuẩn đầu ra", href: "/#vi-sao" },
      { label: "Quy chế lớp học", href: "/#vi-sao" },
    ],
  },
  {
    label: "Tin tức – Hoạt động",
    href: "/#tin-tuc",
    children: [
      { label: "Tin tức chung", href: "/#tin-tuc" },
      { label: "Thông báo", href: "/#tin-tuc" },
      { label: "Hoạt động học viên", href: "/#tin-tuc" },
      { label: "Góc phụ huynh", href: "/#tin-tuc" },
    ],
  },
  { label: "Liên hệ", href: "/#dang-ky" },
];

export const TOP_LINKS: NavChild[] = [
  { label: "Tra cứu kết quả", href: "/dang-nhap" },
  { label: "Cổng học viên", href: "/dang-nhap" },
  { label: "Cổng phụ huynh", href: "/dang-nhap" },
];
