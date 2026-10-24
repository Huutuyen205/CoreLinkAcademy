// Danh mục ý định chatbot (DECISION-D34). Mỗi ý định ứng với MỘT hàm trong handlers.ts dùng service có kiểm tra phạm vi.
import type { Role } from "@prisma/client";
import type { IntentDef } from "./types";

const LEARNER: Role[] = ["PARENT", "STUDENT"];
const MANAGER: Role[] = ["ADMIN"];
const ALL: Role[] = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];

export const INTENTS: IntentDef[] = [
  /* ───────── Học sinh & phụ huynh ───────── */
  {
    id: "learner_today",
    roles: LEARNER,
    label: "Hôm nay con tôi có đi học không, đã đến lớp chưa?",
    labels: { STUDENT: "Hôm nay mình có buổi học không?" },
    description: "Hôm nay (hoặc hôm qua/ngày mai) có buổi học không, đã đến lớp/có mặt/vắng chưa",
    chip: true,
    keywords: {
      "di hoc": 3, "den lop": 3, "toi lop": 3, "co mat": 3, "vang": 3, "den truong": 3, "diem danh": 3,
      "co hoc khong": 3, "co buoi hoc": 3, "co lop": 2, "hoc chua": 2, "vao lop": 3, "nghi hoc": 3, "den chua": 2,
    },
  },
  {
    id: "learner_score",
    roles: LEARNER,
    label: "Hôm nay con tôi làm bài được mấy điểm?",
    labels: { STUDENT: "Mình được mấy điểm bài gần nhất?" },
    description: "Điểm số, kết quả bài làm/bài kiểm tra đã công bố",
    chip: true,
    keywords: { "diem": 2, "bao nhieu diem": 3, "may diem": 3, "ket qua": 2, "diem so": 3, "lam bai": 1, "kiem tra": 2, "bai thi": 2, "duoc diem": 3 },
  },
  {
    id: "learner_progress",
    roles: LEARNER,
    label: "Con tôi học đến đâu rồi?",
    labels: { STUDENT: "Mình đã học đến đâu rồi?" },
    description: "Tiến độ học tập: đã học bao nhiêu buổi, nội dung buổi gần nhất, bài về nhà",
    chip: true,
    keywords: { "hoc den dau": 4, "tien do": 3, "hoc duoc gi": 3, "hoc gi": 2, "noi dung buoi": 3, "da hoc": 2, "buoi truoc": 2, "nhat ky": 2, "den bai nao": 3, "bai giang": 1 },
  },
  {
    id: "learner_homework",
    roles: LEARNER,
    label: "Con tôi còn bài tập nào chưa nộp?",
    labels: { STUDENT: "Mình còn bài tập nào chưa nộp?" },
    description: "Bài tập, bài về nhà, hạn nộp, bài chưa nộp",
    chip: true,
    keywords: { "bai tap": 3, "bai ve nha": 3, "han nop": 3, "chua nop": 3, "deadline": 3, "phai lam": 1, "bai nop": 2, "nop bai": 3 },
  },
  {
    id: "learner_schedule",
    roles: LEARNER,
    label: "Buổi học tiếp theo của con là khi nào?",
    labels: { STUDENT: "Buổi học tiếp theo của mình là khi nào?" },
    description: "Lịch học sắp tới, buổi học tiếp theo, thời khóa biểu",
    keywords: { "lich hoc": 3, "lich": 2, "thoi khoa bieu": 3, "buoi tiep theo": 4, "buoi sau": 3, "khi nao hoc": 3, "bao gio hoc": 3, "tuan nay": 2, "tuan sau": 2, "ke tiep": 2 },
  },
  {
    id: "learner_attendance_rate",
    roles: LEARNER,
    label: "Tỷ lệ chuyên cần của con thế nào?",
    labels: { STUDENT: "Tỷ lệ chuyên cần của mình thế nào?" },
    description: "Tỷ lệ chuyên cần, số buổi vắng/nghỉ/muộn",
    keywords: { "chuyen can": 4, "ty le": 2, "vang may buoi": 4, "nghi may buoi": 4, "di hoc deu": 3, "bao nhieu buoi vang": 4, "di muon": 3 },
  },
  {
    id: "learner_teacher",
    roles: LEARNER,
    label: "Giáo viên của con là ai?",
    labels: { STUDENT: "Giáo viên của mình là ai?" },
    description: "Giáo viên phụ trách các lớp đang học",
    keywords: { "giao vien": 3, "co giao": 3, "thay giao": 2, "ai day": 4, "thay nao": 3, "co nao": 2, "lop nao": 2, "hoc lop": 2 },
  },
  {
    id: "learner_leave",
    roles: ["PARENT"],
    label: "Đơn xin nghỉ của con đã được duyệt chưa?",
    description: "Tình trạng đơn xin nghỉ buổi học đã gửi",
    keywords: { "don xin nghi": 5, "xin nghi": 4, "don nghi": 4, "duyet chua": 3, "cho con nghi": 3, "duoc duyet": 3 },
  },
  {
    id: "learner_evaluation",
    roles: LEARNER,
    label: "Giáo viên nhận xét gì về con?",
    labels: { STUDENT: "Giáo viên nhận xét gì về mình?" },
    description: "Nhận xét/đánh giá định kỳ của giáo viên, học lực",
    keywords: { "nhan xet": 4, "danh gia": 4, "hoc luc": 3, "hoc the nao": 4, "hoc tot khong": 3, "diem manh": 3, "diem yeu": 3 },
  },
  {
    id: "learner_notifications",
    roles: LEARNER,
    label: "Có thông báo mới nào không?",
    description: "Thông báo chưa đọc",
    keywords: { "thong bao": 3, "tin moi": 2, "co tin": 2, "tin nhan": 2 },
  },

  /* ───────── Giáo viên ───────── */
  {
    id: "teacher_today",
    roles: ["TEACHER"],
    label: "Hôm nay tôi có mấy lớp?",
    description: "Số lớp/buổi dạy hôm nay (hoặc hôm qua/ngày mai), giờ và phòng",
    chip: true,
    keywords: { "may lop": 4, "bao nhieu lop": 4, "lop hom nay": 3, "lich day": 3, "nay day": 2, "hom nay day": 3, "co lop nao": 3, "day lop nao": 3, "ca day": 2, "bao nhieu buoi": 4, "may buoi": 4, "co day khong": 3 },
  },
  {
    id: "teacher_lesson",
    roles: ["TEACHER"],
    label: "Bài giảng hôm nay của tôi là gì?",
    description: "Nội dung/giáo án/giáo trình của buổi dạy hôm nay",
    chip: true,
    keywords: { "bai giang": 4, "giao an": 4, "day gi": 4, "day bai gi": 4, "noi dung buoi": 3, "bai hom nay": 3, "hoc gi hom nay": 3, "giao trinh": 3, "chuan bi": 2, "bai nao": 2, "day bai": 3 },
  },
  {
    id: "teacher_next",
    roles: ["TEACHER"],
    label: "Buổi dạy tiếp theo của tôi là khi nào?",
    description: "Buổi dạy sắp tới",
    keywords: { "buoi tiep theo": 4, "buoi ke tiep": 4, "khi nao day": 3, "lop tiep theo": 4, "bao gio day": 3, "buoi sau": 3, "lich sap toi": 3 },
  },
  {
    id: "teacher_attendance_todo",
    roles: ["TEACHER"],
    label: "Buổi nào tôi chưa điểm danh?",
    description: "Các buổi đã diễn ra nhưng chưa điểm danh",
    chip: true,
    keywords: { "chua diem danh": 5, "diem danh": 2, "quen diem danh": 4, "con thieu diem danh": 5 },
  },
  {
    id: "teacher_grading",
    roles: ["TEACHER"],
    label: "Có bài nào cần chấm không?",
    description: "Số bài nộp đang chờ chấm",
    keywords: { "cham bai": 4, "bai nop": 3, "bai cho cham": 5, "can cham": 4, "chua cham": 4, "bai can cham": 5 },
  },
  {
    id: "teacher_absence",
    roles: ["TEACHER"],
    label: "Học sinh nào vắng liên tiếp?",
    description: "Cảnh báo học sinh vắng 2 buổi liên tiếp",
    keywords: { "vang nhieu": 4, "hoc sinh vang": 4, "vang lien tiep": 4, "canh bao": 3, "ai vang": 4 },
  },
  {
    id: "teacher_requests",
    roles: ["TEACHER"],
    label: "Có đơn xin nghỉ nào chờ duyệt không?",
    description: "Đơn xin nghỉ của học sinh đang chờ duyệt",
    keywords: { "don nghi": 4, "don xin nghi": 4, "cho duyet": 3, "xin nghi": 2 },
  },

  /* ───────── Quản lý (Admin, Staff) ───────── */
  {
    id: "mgr_today",
    roles: MANAGER,
    label: "Hôm nay có bao nhiêu lớp?",
    description: "Số buổi/lớp học hôm nay (hoặc hôm qua/ngày mai), giáo viên và phòng từng lớp",
    chip: true,
    keywords: { "bao nhieu lop": 4, "may lop": 4, "lop hom nay": 3, "nay co lop": 3, "lich hom nay": 3, "bao nhieu buoi": 4, "may buoi": 4, "co lop nao": 3, "lich tong": 2 },
  },
  {
    id: "mgr_class_teacher",
    roles: MANAGER,
    label: "Lớp này của giáo viên nào?",
    description: "Giáo viên phụ trách một lớp (kèm mã lớp), hoặc các lớp của một giáo viên (kèm tên giáo viên)",
    chip: true,
    keywords: { "giao vien nao": 4, "ai day": 4, "do ai day": 5, "cua giao vien": 3, "gv nao": 3, "thay nao": 3, "co nao": 2, "phu trach": 3, "day nhung lop nao": 5, "day lop nao": 4, "lop cua": 2, "lich day cua": 4 },
  },
  {
    id: "mgr_class_size",
    roles: MANAGER,
    label: "Lớp còn bao nhiêu chỗ trống?",
    description: "Sĩ số, số học viên, số chỗ còn trống của lớp",
    keywords: { "si so": 5, "bao nhieu hoc sinh": 4, "bao nhieu hoc vien": 4, "con cho": 4, "con slot": 4, "cho trong": 4, "bao nhieu em": 3 },
  },
  {
    id: "mgr_rooms",
    roles: MANAGER,
    label: "Phòng nào đang trống?",
    description: "Phòng học trống ngay lúc này",
    keywords: { "phong trong": 5, "phong nao trong": 5, "phong hoc": 2, "con phong": 3, "phong nao": 3 },
  },
  {
    id: "mgr_leads",
    roles: MANAGER,
    label: "Có lead mới nào chưa xử lý?",
    description: "Lead (khách đăng ký học thử) mới, quá hạn xử lý",
    chip: true,
    keywords: { "lead": 4, "khach hang": 3, "dang ky hoc thu": 4, "hoc thu": 2, "dang ky moi": 3, "khach moi": 3, "tuyen sinh": 2 },
  },
  {
    id: "mgr_requests",
    roles: MANAGER,
    label: "Có đơn nghỉ / đề xuất nào chờ duyệt?",
    description: "Đơn xin nghỉ và đề xuất đổi lịch đang chờ duyệt",
    keywords: { "don nghi": 4, "don xin nghi": 4, "de xuat": 4, "cho duyet": 4, "duyet": 2, "xin nghi": 2 },
  },
  {
    id: "mgr_attendance_missing",
    roles: MANAGER,
    label: "Buổi nào chưa được điểm danh?",
    description: "Các buổi đã diễn ra nhưng giáo viên chưa điểm danh",
    keywords: { "chua diem danh": 5, "quen diem danh": 4, "diem danh": 2, "con thieu diem danh": 5 },
  },
  {
    id: "mgr_absence",
    roles: MANAGER,
    label: "Học sinh nào vắng liên tiếp?",
    description: "Cảnh báo học sinh vắng 2 buổi liên tiếp",
    keywords: { "vang nhieu": 4, "canh bao vang": 5, "hoc sinh vang": 4, "vang lien tiep": 4, "ai vang": 4 },
  },

  /* ───────── Chung ───────── */
  {
    id: "contact_center",
    roles: ALL,
    label: "Liên hệ trung tâm / học phí?",
    description: "Học phí, đăng ký khóa học, địa chỉ, số điện thoại, liên hệ trung tâm",
    keywords: { "hoc phi": 4, "dia chi": 3, "gio mo cua": 3, "hotline": 4, "so dien thoai": 3, "lien he": 3, "dang ky": 1, "khoa hoc": 2, "gia": 1, "tu van": 2 },
  },
  {
    id: "help",
    roles: ALL,
    label: "Bạn trả lời được những gì?",
    description: "Hỏi trợ lý làm được gì, hướng dẫn sử dụng",
    keywords: { "lam duoc gi": 4, "huong dan": 2, "co the hoi": 3, "giup": 2, "tro ly": 2, "chuc nang": 2, "hoi gi": 3 },
  },
  {
    id: "greeting",
    roles: ALL,
    label: "Xin chào",
    description: "Lời chào",
    keywords: { "xin chao": 3, "chao": 2, "hello": 3, "hi": 2, "alo": 2, "cam on": 3, "thanks": 3 },
  },
];

const BY_ID = new Map(INTENTS.map((i) => [i.id, i]));

export function intentById(id: string): IntentDef | undefined {
  return BY_ID.get(id);
}

export function intentsForRole(role: Role): IntentDef[] {
  return INTENTS.filter((i) => i.roles.includes(role));
}

export function intentLabel(intent: IntentDef, role: Role): string {
  return intent.labels?.[role] ?? intent.label;
}

/** Nút gợi ý hiển thị cho vai trò (tối đa `limit`). */
export function suggestionsForRole(role: Role, limit = 6): { intent: string; label: string }[] {
  return intentsForRole(role)
    .filter((i) => i.chip)
    .slice(0, limit)
    .map((i) => ({ intent: i.id, label: intentLabel(i, role) }));
}
