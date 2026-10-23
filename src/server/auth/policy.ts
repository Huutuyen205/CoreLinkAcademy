// Phân quyền theo vai trò (docs/03 §2). Hàm thuần, không truy cập DB.
// Phạm vi dữ liệu (lớp của GV, con của PH…) được kiểm tra trong service từng nghiệp vụ.
import type { Role } from "@prisma/client";
import { ForbiddenError } from "@/server/errors";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Giáo vụ / Tư vấn",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
  PARENT: "Phụ huynh",
};

/**
 * Thao tác chính theo vai trò — hiển thị cho Admin ở trang Người dùng (docs/03 §2).
 * Chỉ để đọc: quyền thật vẫn kiểm tra bằng `assertCan`/phạm vi trong từng service.
 */
export const ROLE_CAPABILITIES: Record<Role, { area: string; actions: string }[]> = {
  ADMIN: [
    { area: "Người dùng", actions: "Tạo mọi loại tài khoản, đổi vai trò, khóa/mở khóa, đặt lại mật khẩu" },
    { area: "Danh mục", actions: "Thêm/sửa/xóa môn học, cấp học, khóa học, phòng học" },
    { area: "Tuyển sinh", actions: "Xem, nhập tay, đổi trạng thái lead; chuyển lead thành học viên" },
    { area: "Đào tạo", actions: "Mở/sửa lớp, ghi danh, hủy/dời buổi, dạy thay, học bù, lịch tổng, sửa điểm danh ngoài khung" },
    { area: "Tài liệu & yêu cầu", actions: "Quản lý giáo trình/tài liệu; duyệt đề xuất đổi lịch, đơn xin nghỉ" },
    { area: "Giao tiếp", actions: "Gửi thông báo mọi đối tượng; nhắn tin nhóm lớp và 1-1" },
    { area: "Báo cáo & nhật ký", actions: "Xem báo cáo, xuất Excel; xem nhật ký hệ thống (audit)" },
  ],
  STAFF: [
    { area: "Người dùng", actions: "Tạo tài khoản học sinh/phụ huynh, liên kết phụ huynh – học sinh" },
    { area: "Tuyển sinh", actions: "Xem, nhập tay, đổi trạng thái lead; chuyển lead thành học viên" },
    { area: "Đào tạo", actions: "Mở/sửa lớp, ghi danh, hủy/dời buổi, dạy thay, học bù, lịch tổng, sửa điểm danh ngoài khung" },
    { area: "Tài liệu & yêu cầu", actions: "Quản lý giáo trình/tài liệu; duyệt đề xuất đổi lịch, đơn xin nghỉ" },
    { area: "Giao tiếp", actions: "Gửi thông báo mọi đối tượng; nhắn tin nhóm lớp và 1-1" },
    { area: "Báo cáo", actions: "Xem báo cáo, xuất Excel (không quản lý vai trò, danh mục, nhật ký)" },
  ],
  TEACHER: [
    { area: "Lớp của mình", actions: "Xem lịch dạy, điểm danh trong khung giờ, hồ sơ học sinh lớp mình" },
    { area: "Bài tập", actions: "Soạn/giao/đóng bài, chấm (kể cả ảnh bài tự luận), yêu cầu nộp lại, công bố điểm và bài chữa, bảng điểm" },
    { area: "Ôn luyện", actions: "Soạn đề luyện tập (trắc nghiệm, trả lời ngắn, lời giải) cho học sinh tự ôn" },
    { area: "Yêu cầu", actions: "Gửi đề xuất đổi lịch/xin nghỉ; duyệt đơn xin nghỉ của học sinh lớp mình" },
    { area: "Tài liệu & đánh giá", actions: "Tài liệu, giáo án; đánh giá định kỳ học sinh" },
    { area: "Giao tiếp", actions: "Thông báo cho lớp mình; nhắn nhóm lớp, nhắn riêng học sinh/phụ huynh lớp mình và trung tâm" },
  ],
  STUDENT: [
    { area: "Học tập", actions: "Xem lịch học, làm và nộp bài (chụp ảnh bài tự luận), xem điểm/bài chữa đã công bố, chuyên cần" },
    { area: "Tự ôn luyện", actions: "Lọc đề theo chuyên đề, dạng bài, mức độ; làm bài, xem đáp án, lời giải và lịch sử luyện tập" },
    { area: "Tài liệu", actions: "Xem tài liệu được chia sẻ cho lớp" },
    { area: "Giao tiếp", actions: "Nhắn nhóm lớp, nhắn riêng giáo viên và bạn cùng lớp; nhận thông báo" },
  ],
  PARENT: [
    { area: "Theo dõi con", actions: "Xem lịch, chuyên cần, bài tập, điểm đã công bố, đánh giá của con đã liên kết" },
    { area: "Đơn xin nghỉ", actions: "Gửi/rút đơn xin nghỉ buổi học cho con" },
    { area: "Giao tiếp", actions: "Nhắn nhóm lớp của con, nhắn riêng giáo viên của con và trung tâm; nhận thông báo" },
  ],
};

export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/quan-ly",
  STAFF: "/quan-ly",
  TEACHER: "/giao-vien",
  STUDENT: "/hoc-sinh",
  PARENT: "/phu-huynh",
};

const PERMISSIONS = {
  "catalog.manage": ["ADMIN"],
  "room.manage": ["ADMIN"],
  "lead.manage": ["ADMIN", "STAFF"],
  "user.manage": ["ADMIN"],
  "user.createLearner": ["ADMIN", "STAFF"],
  "guardian.manage": ["ADMIN", "STAFF"],
  "class.manage": ["ADMIN", "STAFF"],
  "enrollment.manage": ["ADMIN", "STAFF"],
  "attendance.override": ["ADMIN", "STAFF"],
  "assignment.author": ["TEACHER"],
  "submission.work": ["STUDENT"],
  "audit.read": ["ADMIN"],
  // Bổ sung (FR-036..FR-052)
  "staff.view": ["ADMIN", "STAFF"], // xem danh sách/hồ sơ giáo viên, lịch tổng
  "document.manage": ["ADMIN", "STAFF"], // giáo trình, phân phối tài liệu
  "request.handle": ["ADMIN", "STAFF"], // duyệt đề xuất đổi lịch
  "report.view": ["ADMIN", "STAFF"],
  "level.manage": ["ADMIN"],
  // Checklist v4 (DECISION-D33)
  "practice.author": ["ADMIN", "STAFF", "TEACHER"], // soạn đề luyện tập
  "practice.take": ["STUDENT"], // làm đề luyện tập
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function assertCan(actor: { role: Role }, permission: Permission): void {
  if (!can(actor.role, permission)) throw new ForbiddenError();
}

/** STAFF chỉ được tạo tài khoản học sinh/phụ huynh (ASSUMPTION-A04). */
export function canCreateUserWithRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "ADMIN") return true;
  return actorRole === "STAFF" && (targetRole === "STUDENT" || targetRole === "PARENT");
}

/** Admin không tự khóa hoặc tự đổi vai trò của chính mình (T-10). */
export function canChangeRoleOrStatus(actor: { id: string; role: Role }, targetUserId: string): boolean {
  return actor.role === "ADMIN" && actor.id !== targetUserId;
}
