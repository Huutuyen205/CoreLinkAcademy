// Nội dung tĩnh của trang chủ. Sửa ở đây để đổi nội dung hiển thị — không cần đụng component.
// Mọi thông tin chưa có ghi dạng placeholder trong ngoặc vuông.

export type SubjectKey = "toan" | "van" | "anh";
export type LevelKey = "tien-tieu-hoc" | "tieu-hoc" | "thcs" | "thpt";

export const SUBJECT_TABS: { key: SubjectKey; label: string; slug: string }[] = [
  { key: "toan", label: "Toán", slug: "toan" },
  { key: "van", label: "Ngữ văn", slug: "ngu-van" },
  { key: "anh", label: "Tiếng Anh", slug: "tieng-anh" },
];

export type ProgramCard = {
  level: string;
  age: string;
  title: string;
  description: string;
  points: [string, string, string];
  href: string;
};

const href = (slug: string, grade?: number) => `/khoa-hoc?mon=${slug}${grade ? `&khoi=${grade}` : ""}`;

export const PROGRAMS: Record<SubjectKey, ProgramCard[]> = {
  toan: [
    {
      level: "Tiền tiểu học",
      age: "5–6 tuổi",
      title: "Toán tư duy khởi đầu",
      description: "Làm quen số, hình và quy luật qua trò chơi, giúp trẻ hứng thú trước khi vào lớp 1.",
      points: ["Nhận biết số và phép đếm", "Phát triển tư duy logic", "Rèn tác phong học tập"],
      href: href("toan"),
    },
    {
      level: "Tiểu học",
      age: "Lớp 1–5",
      title: "Toán nền tảng và nâng cao",
      description: "Củng cố bốn phép tính, giải toán có lời văn và mở rộng tư duy theo từng khối lớp.",
      points: ["Vững kỹ năng tính toán", "Giải toán có lời văn", "Bồi dưỡng học sinh khá, giỏi"],
      href: href("toan", 3),
    },
    {
      level: "THCS",
      age: "Lớp 6–9",
      title: "Toán THCS và ôn thi vào 10",
      description: "Hệ thống kiến thức đại số, hình học và luyện đề theo cấu trúc thi vào lớp 10.",
      points: ["Lộ trình bám sát chương trình", "Luyện đề theo chuyên đề", "Kèm sát lớp nhỏ 7–12 em"],
      href: href("toan", 9),
    },
    {
      level: "THPT",
      age: "Lớp 10–12",
      title: "Toán THPT và thi tốt nghiệp",
      description: "Đi từ hàm số, hình không gian đến tổ hợp – xác suất, tập trung dạng bài thi tốt nghiệp THPT.",
      points: ["Chuyên đề theo cấu trúc đề thi", "Chữa bài chi tiết từng em", "Kiểm tra định kỳ và báo cáo"],
      href: href("toan", 11),
    },
  ],
  van: [
    {
      level: "Tiền tiểu học",
      age: "5–6 tuổi",
      title: "Làm quen chữ và ngôn ngữ",
      description: "Rèn phát âm, nhận mặt chữ và khả năng kể chuyện để trẻ tự tin bước vào lớp 1.",
      points: ["Nhận biết chữ cái, phát âm chuẩn", "Mở rộng vốn từ qua truyện", "Rèn cầm bút đúng cách"],
      href: href("ngu-van"),
    },
    {
      level: "Tiểu học",
      age: "Lớp 1–5",
      title: "Tiếng Việt và kỹ năng viết",
      description: "Đọc hiểu, luyện từ và câu, tập làm văn miêu tả, kể chuyện theo chương trình tiểu học.",
      points: ["Đọc trôi chảy, hiểu bài", "Viết câu, đoạn văn mạch lạc", "Yêu thích đọc sách"],
      href: href("ngu-van", 3),
    },
    {
      level: "THCS",
      age: "Lớp 6–9",
      title: "Ngữ văn THCS và ôn thi vào 10",
      description: "Cảm thụ văn bản, rèn kỹ năng viết nghị luận xã hội và nghị luận văn học.",
      points: ["Phân tích văn bản có hệ thống", "Dàn ý và viết bài nghị luận", "Chấm chữa bài chi tiết"],
      href: href("ngu-van", 9),
    },
    {
      level: "THPT",
      age: "Lớp 10–12",
      title: "Ngữ văn THPT và thi tốt nghiệp",
      description: "Ôn tập các tác phẩm trọng tâm, đọc hiểu và nghị luận theo cấu trúc đề thi tốt nghiệp.",
      points: ["Hệ thống tác phẩm trọng tâm", "Kỹ năng đọc hiểu nhiều dạng", "Luyện đề và chấm theo thang điểm"],
      href: href("ngu-van", 11),
    },
  ],
  anh: [
    {
      level: "Tiền tiểu học",
      age: "5–6 tuổi",
      title: "Tiếng Anh khởi đầu",
      description: "Làm quen âm, từ vựng và mẫu câu đơn giản qua bài hát, trò chơi và hoạt động nhóm nhỏ.",
      points: ["Nghe – nói tự nhiên", "Từ vựng theo chủ đề gần gũi", "Phát âm chuẩn từ đầu"],
      href: href("tieng-anh"),
    },
    {
      level: "Tiểu học",
      age: "Lớp 1–5",
      title: "Tiếng Anh tiểu học chuẩn quốc tế",
      description: "Phát triển bốn kỹ năng nghe, nói, đọc, viết và làm quen các chứng chỉ quốc tế cho trẻ em.",
      points: ["Bốn kỹ năng cân bằng", "Giao tiếp qua tình huống thật", "Làm quen chứng chỉ quốc tế"],
      href: href("tieng-anh", 3),
    },
    {
      level: "THCS",
      age: "Lớp 6–9",
      title: "Tiếng Anh THCS và ngữ pháp",
      description: "Hệ thống ngữ pháp, mở rộng từ vựng, luyện đọc – viết và chuẩn bị thi vào lớp 10.",
      points: ["Ngữ pháp có hệ thống", "Luyện kỹ năng đọc – viết", "Ôn thi vào 10 theo đề"],
      href: href("tieng-anh", 7),
    },
    {
      level: "THPT",
      age: "Lớp 10–12",
      title: "Tiếng Anh THPT và chứng chỉ",
      description: "Ôn thi tốt nghiệp THPT kết hợp rèn kỹ năng học thuật hướng tới các chứng chỉ quốc tế.",
      points: ["Luyện đề tốt nghiệp THPT", "Kỹ năng học thuật", "Định hướng chứng chỉ quốc tế"],
      href: href("tieng-anh", 11),
    },
  ],
};

export const QUICK_ACCESS = [
  { no: "01", title: "Học thử miễn phí", detail: "Đăng ký một buổi học thử cùng giáo viên.", href: "/dang-ky-hoc-thu" },
  { no: "02", title: "Kiểm tra đầu vào", detail: "Đánh giá trình độ để xếp lớp phù hợp.", href: "/#dang-ky" },
  { no: "03", title: "Lịch khai giảng", detail: "Xem các lớp đang tuyển sinh.", href: "/khoa-hoc" },
  { no: "04", title: "Tra cứu kết quả", detail: "Đăng nhập để xem điểm và chuyên cần.", href: "/dang-nhap" },
];

export const STATS: { label: string; kind: "count" | "range" | "text"; value?: number; range?: [number, number]; suffix?: string; text?: string }[] = [
  { kind: "count", value: 10, suffix: "+", label: "năm kinh nghiệm giảng dạy" },
  { kind: "range", range: [7, 12], label: "học sinh tối đa mỗi lớp" },
  { kind: "count", value: 3, label: "môn trọng tâm Toán – Văn – Anh" },
  { kind: "text", text: "[SỐ HỌC VIÊN]", label: "học viên đã đồng hành" },
];

export const WHY_US = [
  { icon: "users", title: "Lớp nhỏ 7–12 em", detail: "Giáo viên theo sát từng em, giải đáp ngay trong giờ học." },
  { icon: "award", title: "Hơn 10 năm kinh nghiệm", detail: "Đội ngũ giàu chuyên môn, phương pháp gợi mở và rõ ràng." },
  { icon: "route", title: "Lộ trình cá nhân hóa", detail: "Kiểm tra đầu vào và xây lộ trình theo mục tiêu của từng em." },
  { icon: "shield", title: "Cam kết đầu ra", detail: "Đánh giá định kỳ, báo cáo tiến độ cho phụ huynh hằng tháng." },
] as const;

export const TEACHERS = [
  { subject: "Toán", name: "[Họ tên giáo viên]", degree: "[Bằng cấp / chứng chỉ]", photo: null as string | null },
  { subject: "Ngữ văn", name: "[Họ tên giáo viên]", degree: "[Bằng cấp / chứng chỉ]", photo: null as string | null },
  { subject: "Tiếng Anh", name: "[Họ tên giáo viên]", degree: "[Bằng cấp / chứng chỉ]", photo: null as string | null },
  { subject: "Tiếng Anh", name: "[Họ tên giáo viên]", degree: "[Bằng cấp / chứng chỉ]", photo: null as string | null },
];

export const MARQUEE_ITEMS = [
  "Lớp học tối đa 7–12 học sinh",
  "Cam kết chất lượng đầu ra",
  "Kiểm tra đầu vào miễn phí",
  "Báo cáo tiến độ cho phụ huynh hằng tháng",
  "Giáo viên theo sát từng em",
  "Lộ trình học cá nhân hóa",
];

// Dữ liệu mẫu — thay bằng tin thật khi có (ngày dạng ISO).
export const NEWS = [
  { date: "2026-10-20", category: "Thông báo", title: "Thông báo tuyển sinh các lớp Toán – Văn – Anh học kỳ mới" },
  { date: "2026-10-15", category: "Tin tức", title: "[Tiêu đề tin tức] Lịch khai giảng các lớp luyện thi vào lớp 10" },
  { date: "2026-10-10", category: "Hoạt động", title: "[Tiêu đề tin tức] Buổi sinh hoạt ngoại khóa của học viên" },
  { date: "2026-10-05", category: "Góc phụ huynh", title: "[Tiêu đề tin tức] Cách đồng hành cùng con trong giai đoạn ôn thi" },
  { date: "2026-09-28", category: "Thông báo", title: "[Tiêu đề tin tức] Lịch kiểm tra đầu vào và thi thử" },
];

export const STARS = [
  {
    name: "[Họ tên học viên]",
    result: "[Kết quả đạt được]",
    detail: "[Lớp / trường]",
    story: "[Chia sẻ về hành trình học tập và kết quả của học viên. Nội dung sẽ được cập nhật khi có sự đồng ý của phụ huynh.]",
  },
  {
    name: "[Họ tên học viên]",
    result: "[Kết quả đạt được]",
    detail: "[Lớp / trường]",
    story: "[Chia sẻ về hành trình học tập và kết quả của học viên. Nội dung sẽ được cập nhật khi có sự đồng ý của phụ huynh.]",
  },
  {
    name: "[Họ tên học viên]",
    result: "[Kết quả đạt được]",
    detail: "[Lớp / trường]",
    story: "[Chia sẻ về hành trình học tập và kết quả của học viên. Nội dung sẽ được cập nhật khi có sự đồng ý của phụ huynh.]",
  },
];

export const HOME_SUBJECT_SLUGS = SUBJECT_TABS.map((s) => s.slug);

export const GRADE_CHOICES = [
  { value: "0", label: "Tiền tiểu học (5–6 tuổi)" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Lớp ${i + 1}` })),
];
