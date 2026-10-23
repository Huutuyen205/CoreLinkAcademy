// Câu trả lời "đã đến lớp chưa" — phân biệt rõ CHƯA ĐIỂM DANH với VẮNG (không bao giờ nói vắng khi chưa có bản ghi). Hàm thuần.
import type { AttendanceStatus, SessionStatus } from "@prisma/client";
import { formatTime } from "@/lib/time";

const ATTENDANCE_TEXT: Record<AttendanceStatus, string> = {
  PRESENT: "Đã điểm danh: có mặt.",
  LATE: "Đã điểm danh: đến muộn (có mặt).",
  ABSENT: "Đã điểm danh: vắng mặt.",
  EXCUSED: "Đã điểm danh: vắng có phép.",
};

export function sessionPresenceText(i: {
  sessionStatus: SessionStatus;
  cancelReason: string | null;
  attendance: { status: AttendanceStatus; note: string | null } | null;
  startsAt: Date;
  endsAt: Date;
  now: Date;
}): string {
  if (i.sessionStatus === "CANCELLED") return `Buổi học đã hủy${i.cancelReason ? ` (lý do: ${i.cancelReason})` : ""}.`;
  if (i.attendance) return `${ATTENDANCE_TEXT[i.attendance.status]}${i.attendance.note ? ` Ghi chú: ${i.attendance.note}.` : ""}`;
  if (i.now < i.startsAt) return `Chưa đến giờ học (bắt đầu lúc ${formatTime(i.startsAt)}).`;
  if (i.now <= i.endsAt) return "Buổi học đang diễn ra, giáo viên chưa điểm danh nên chưa biết đã đến lớp hay chưa.";
  return "Giáo viên chưa điểm danh buổi này nên chưa có thông tin có mặt hay vắng.";
}
